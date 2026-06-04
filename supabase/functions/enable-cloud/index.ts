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
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { license_key, token_lovable, project_id, region, session_headers } = body;

    if (!license_key || !token_lovable || !project_id) {
      return jsonRes({ success: false, error_display: "Missing required parameters." }, 400);
    }

    const { data: lic } = await supabase
      .from("licenses")
      .select("is_active, status, expires_at")
      .eq("license_key", license_key.trim())
      .maybeSingle();

    if (!lic || !lic.is_active) {
      return jsonRes({ success: false, error_display: "License not active." }, 403);
    }

    const { data: flag } = await supabase
      .from("feature_flags")
      .select("is_enabled, allowed_statuses")
      .eq("flag_key", "enable_cloud")
      .maybeSingle();

    if (flag && flag.is_enabled === false) {
      return jsonRes({ success: false, error_display: "Cloud deployment is currently disabled." }, 403);
    }

    if (flag && Array.isArray(flag.allowed_statuses) && !flag.allowed_statuses.includes(lic.status)) {
      return jsonRes({ success: false, error_display: "Your plan does not include Cloud deployment." }, 403);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token_lovable}`,
      ...(session_headers || {}),
    };

    const res = await fetch(`https://api.lovable.dev/projects/${project_id}/enable-cloud`, {
      method: "POST",
      headers,
      body: JSON.stringify({ region: region || "america" }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return jsonRes({ success: false, error_display: data?.message || `Error ${res.status}` });
    }

    return jsonRes({ success: true, data, message: "Cloud deployment enabled." });
  } catch (err) {
    console.error("enable-cloud error:", err);
    return jsonRes({ success: false, error_display: "Server error." }, 500);
  }
});
