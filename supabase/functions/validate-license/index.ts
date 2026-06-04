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
    const { license_key, device_id, heartbeat, session_id } = body;

    if (!license_key) {
      return jsonRes({ valid: false, message: "License key is required." }, 400);
    }

    // Fetch license from DB
    const { data: lic, error: licErr } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", license_key.trim())
      .maybeSingle();

    if (licErr || !lic) {
      return jsonRes({ valid: false, message: "Invalid license key." });
    }

    if (!lic.is_active) {
      return jsonRes({ valid: false, message: "License is disabled. Contact support." });
    }

    // Check expiry (lifetime = no expires_at)
    if (lic.status !== "lifetime" && lic.expires_at) {
      const expired = new Date(lic.expires_at) < new Date();
      if (expired) {
        return jsonRes({ valid: false, message: "License has expired. Please renew." });
      }
    }

    const now = new Date().toISOString();

    // --- HEARTBEAT ---
    if (heartbeat) {
      // If session mismatch (another device stole session)
      if (lic.session_id && session_id && lic.session_id !== session_id) {
        return jsonRes({
          valid: false,
          reason: "device_conflict",
          message: "Another device is using this license.",
        });
      }

      // Update last_seen_at
      await supabase
        .from("licenses")
        .update({ last_seen_at: now })
        .eq("license_key", license_key.trim());

      return jsonRes({
        valid: true,
        user_name: lic.user_name,
        expires_at: lic.expires_at,
        status: lic.status,
        activated_at: lic.activated_at,
        method_version: "v2",
        session_id: lic.session_id,
      });
    }

    // --- INITIAL VALIDATION ---

    // Device binding: if already bound to a different device
    if (lic.device_id && lic.device_id !== "" && device_id && lic.device_id !== device_id) {
      const maxDevices = lic.max_devices || 1;
      if (maxDevices <= 1) {
        return jsonRes({
          valid: false,
          reason: "device_conflict",
          message: "This license is already activated on another device. Contact support to reset.",
        });
      }
    }

    // Generate a new session_id
    const newSessionId = crypto.randomUUID();

    // Update device_id, session_id, activated_at, last_seen_at
    await supabase
      .from("licenses")
      .update({
        device_id: device_id || lic.device_id || "",
        session_id: newSessionId,
        activated_at: lic.activated_at || now,
        last_seen_at: now,
        usage_count: (lic.usage_count || 0) + 1,
      })
      .eq("license_key", license_key.trim());

    return jsonRes({
      valid: true,
      session_id: newSessionId,
      user_name: lic.user_name,
      expires_at: lic.expires_at,
      status: lic.status,
      activated_at: lic.activated_at || now,
      method_version: "v2",
      message: "License activated successfully.",
    });
  } catch (err) {
    console.error("validate-license error:", err);
    return jsonRes({ valid: false, message: "Server error. Try again later." }, 500);
  }
});
