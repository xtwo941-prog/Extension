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

    // Build headers for Lovable API
    const lovableHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token_lovable}`,
      ...(session_headers || {}),
    };

    if (browser_session_id) {
      lovableHeaders["x-browser-session-id"] = browser_session_id;
    }

    // Build payload for Lovable
    const lovablePayload: Record<string, unknown> = {
      prompt: mensagem,
      think: modo_pensar || false,
    };

    if (upload_files && Array.isArray(upload_files) && upload_files.length > 0) {
      // Handle file uploads - pass them through
      const uploadedUrls: string[] = [];
      for (const file of upload_files) {
        if (file.public_url) {
          uploadedUrls.push(file.public_url);
        } else if (file.file_data && file.file_name) {
          // Upload to Supabase Storage
          const fileBytes = Uint8Array.from(atob(file.file_data), c => c.charCodeAt(0));
          const filePath = `uploads/${license_key}/${Date.now()}_${file.file_name}`;
          const { data: uploadData } = await supabase.storage
            .from("extension-uploads")
            .upload(filePath, fileBytes, { contentType: file.file_type || "application/octet-stream", upsert: true });
          if (uploadData) {
            const { data: { publicUrl } } = supabase.storage.from("extension-uploads").getPublicUrl(filePath);
            uploadedUrls.push(publicUrl);
          }
        }
      }
      if (uploadedUrls.length > 0) {
        lovablePayload.images = uploadedUrls;
      }
    }

    // Proxy to Lovable API
    const lovableUrl = `https://api.lovable.dev/projects/${projeto_id}/messages`;
    const lovableRes = await fetch(lovableUrl, {
      method: "POST",
      headers: lovableHeaders,
      body: JSON.stringify(lovablePayload),
    });

    const lovableData = await lovableRes.json().catch(() => ({}));

    if (!lovableRes.ok) {
      return jsonRes({
        success: false,
        error_display: lovableData?.message || lovableData?.error || `Lovable API error (${lovableRes.status})`,
        status: lovableRes.status,
      });
    }

    // Update last_seen_at
    await supabase
      .from("licenses")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("license_key", license_key.trim());

    return jsonRes({ success: true, data: lovableData, message: "Command sent successfully." });
  } catch (err) {
    console.error("proxy-command error:", err);
    return jsonRes({ success: false, error_display: "Server error. Try again." }, 500);
  }
});
