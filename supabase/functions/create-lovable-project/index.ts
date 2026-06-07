import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { license_key, token_lovable } = body;

    if (!license_key) {
      return jsonRes({ success: false, error_display: "License key required." }, 400);
    }

    if (!token_lovable) {
      return jsonRes({ success: false, error_display: "Lovable token required. Open lovable.dev and sync." }, 400);
    }

    // Validate license
    const { data: lic } = await supabase
      .from("licenses")
      .select("is_active, status, expires_at")
      .eq("license_key", license_key.trim())
      .maybeSingle();

    if (!lic || !lic.is_active) {
      return jsonRes({ success: false, error_display: "License is not active." }, 403);
    }

    if (lic.status !== "lifetime" && lic.expires_at && new Date(lic.expires_at) < new Date()) {
      return jsonRes({ success: false, error_display: "Your license has expired." }, 403);
    }

    // Check create_project feature flag
    const { data: featureFlag } = await supabase
      .from("feature_flags")
      .select("is_enabled, allowed_statuses")
      .eq("flag_key", "create_project")
      .maybeSingle();

    if (!featureFlag || !featureFlag.is_enabled) {
      return jsonRes({ success: false, error_display: "Project creation is currently disabled." }, 403);
    }

    const allowedStatuses: string[] = featureFlag.allowed_statuses || [];
    if (allowedStatuses.length > 0 && !allowedStatuses.includes(lic.status)) {
      return jsonRes({ success: false, error_display: `Project creation requires ${allowedStatuses.join(" or ")} license.` }, 403);
    }

    // Create project via Lovable API
    const lovableResp = await fetch("https://api.lovable.dev/projects", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token_lovable}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!lovableResp.ok) {
      const errText = await lovableResp.text();
      console.error("Lovable API error:", lovableResp.status, errText);
      return jsonRes({ success: false, error_display: "Failed to create project on Lovable. Try again." }, 502);
    }

    const lovableData = await lovableResp.json();
    const projectId = lovableData?.id || lovableData?.project_id;

    if (!projectId) {
      return jsonRes({ success: false, error_display: "Unexpected response from Lovable." }, 502);
    }

    // Update last_seen_at
    await supabase
      .from("licenses")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("license_key", license_key.trim());

    const link = `https://lovable.dev/projects/${projectId}`;

    return jsonRes({
      success: true,
      link,
      project_id: projectId,
    });
  } catch (err) {
    console.error("create-lovable-project error:", err);
    return jsonRes({ success: false, error_display: "Server error. Try again." }, 500);
  }
});
