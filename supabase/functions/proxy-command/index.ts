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
    const {
      license_key,
      session_id,
      projeto_id,
      token_lovable,
      mensagem,
      modo_pensar,
      device_id,
      browser_session_id,
      session_headers,
      upload_files,
    } = body;

    if (!license_key || !session_id) {
      return jsonRes({ success: false, error_display: "Invalid session. Please re-validate your license." }, 401);
    }

    // Validate license & session
    const { data: lic } = await supabase
      .from("licenses")
      .select("is_active, status, expires_at, session_id, device_id")
      .eq("license_key", license_key.trim())
      .maybeSingle();

    if (!lic || !lic.is_active) {
      return jsonRes({ success: false, error_display: "License is not active." }, 403);
    }

    if (lic.session_id !== session_id) {
      return jsonRes({ success: false, error_display: "Session expired. Please re-activate your license." }, 403);
    }

    if (lic.status !== "lifetime" && lic.expires_at && new Date(lic.expires_at) < new Date()) {
      return jsonRes({ success: false, error_display: "Your license has expired. Please renew." }, 403);
    }

    // Check feature flags
    const { data: featureFlag } = await supabase
      .from("feature_flags")
      .select("is_enabled, allowed_statuses")
      .eq("flag_key", "optimize_prompt")
      .maybeSingle();

    // Update last_seen_at
    await supabase
      .from("licenses")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("license_key", license_key.trim());

    // Just log and return success - actual API call happens client-side
    // The extension handles Lovable API communication directly through lovable.dev cookies
    return jsonRes({
      success: true,
      message: "Command validated and ready to send.",
      projeto_id,
      mensagem,
      modo_pensar,
    });
  } catch (err) {
    console.error("proxy-command error:", err);
    return jsonRes({ success: false, error_display: "Server error. Try again." }, 500);
  }
});
