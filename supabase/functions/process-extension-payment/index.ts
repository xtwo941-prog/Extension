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
    const { license_key, package_id, payment_method, amount, currency, customer_name, customer_email } = body;

    if (!license_key || !package_id) {
      return jsonRes({ success: false, error_display: "Missing required parameters." }, 400);
    }

    // Fetch the package
    const { data: pkg } = await supabase
      .from("packages")
      .select("*")
      .eq("id", package_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!pkg) {
      return jsonRes({ success: false, error_display: "Package not found or inactive." }, 404);
    }

    // Log payment attempt — in a real integration, this would connect to Stripe/PagSeguro/etc.
    // For now, redirect to WhatsApp for manual processing
    const whatsappNumber = "8801889067101";
    const message = encodeURIComponent(
      `New payment request!\n\nPackage: ${pkg.name}\nPrice: ${pkg.price} ${pkg.currency}\nCustomer: ${customer_name || "N/A"}\nEmail: ${customer_email || "N/A"}\nLicense: ${license_key}`
    );

    return jsonRes({
      success: true,
      redirect_url: `https://wa.me/${whatsappNumber}?text=${message}`,
      message: "Redirecting to payment processing.",
      package: pkg,
    });
  } catch (err) {
    console.error("process-extension-payment error:", err);
    return jsonRes({ success: false, error_display: "Server error." }, 500);
  }
});
