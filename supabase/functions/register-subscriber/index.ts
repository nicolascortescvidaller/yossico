import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, phone } = await req.json();

    // Validate inputs
    if (!name || !email || !phone) {
      return new Response(
        JSON.stringify({ error: "Todos los campos son requeridos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "El correo electrónico no es válido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role (admin access)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("DB_SERVICE_KEY")!
    );

    // Check if email is already registered
    const { data: existing } = await supabase
      .from("subscribers")
      .select("id, discount_code")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          error: "Este correo ya está registrado.",
          already_registered: true,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique discount code: YOSSICO-BIENVENIDA-XXXX
    const suffix = Array.from({ length: 6 }, () =>
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
    ).join("");
    const discountCode = `YOSSICO-BIENVENIDA-${suffix}`;

    // Insert subscriber into DB
    const { error: insertError } = await supabase.from("subscribers").insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      discount_code: discountCode,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Error al guardar el registro. Intenta de nuevo." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send welcome email via Resend
    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenida a YOSSICO</title>
</head>
<body style="margin:0; padding:0; background:#f5f4f1; font-family:'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f1; padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff; max-width:560px; width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#111111; padding:40px 48px 32px;">
              <p style="margin:0; font-size:11px; letter-spacing:5px; text-transform:uppercase; color:rgba(255,255,255,0.35);">YOSSICO</p>
              <h1 style="margin:20px 0 0; font-size:28px; font-weight:300; color:#ffffff; line-height:1.2; letter-spacing:-0.5px;">
                Bienvenida,<br><em style="font-style:italic; color:rgba(255,255,255,0.55);">${name.split(" ")[0]}.</em>
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 48px 32px;">
              <p style="margin:0 0 20px; font-size:13px; color:#444; line-height:1.8; font-weight:300;">
                Gracias por unirte a la comunidad YOSSICO. Eres parte de las primeras en acceder al próximo drop — y como bienvenida, este código es solo para ti.
              </p>

              <!-- Code box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td style="background:#f5f4f1; border:1px solid #dddbd7; padding:28px 32px; text-align:center;">
                    <p style="margin:0 0 8px; font-size:9px; letter-spacing:4px; text-transform:uppercase; color:#8a8a8a;">Tu código de descuento</p>
                    <p style="margin:0; font-size:22px; letter-spacing:3px; font-weight:500; color:#111111; font-family:'Courier New', monospace;">${discountCode}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px; font-size:12px; color:#111; font-weight:500;">10% OFF en tu primera compra</p>
              <p style="margin:0 0 32px; font-size:12px; color:#6e6e6e; line-height:1.7;">
                Válido para un solo uso · Aplica sobre el valor total de tu pedido · Sin fecha de vencimiento para el próximo drop.
              </p>
              <p style="margin:0 0 8px; font-size:12px; color:#444; line-height:1.7;">
                Cuando el drop abra, te escribimos antes que nadie. Mientras tanto, puedes explorar la colección actual:
              </p>
              <a href="https://yossico.com/coleccion.html" style="display:inline-block; margin-top:20px; padding:14px 32px; background:#111111; color:#ffffff; text-decoration:none; font-size:10px; letter-spacing:3px; text-transform:uppercase;">
                Ver colección →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 48px; border-top:1px solid #f0eeea;">
              <p style="margin:0; font-size:10px; color:#aaa; line-height:1.8;">
                YOSSICO · Colombia<br>
                Uniformes médicos premium para la mujer en salud.<br>
                <a href="https://yossico.com" style="color:#aaa;">"Vestidos para sanar. Diseñados para perdurar."</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    console.log("[resend] key present:", !!resendKey, "| prefix:", resendKey?.slice(0, 6) ?? "MISSING");

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "YOSSICO <hola@yossico.com>",
        to: email.toLowerCase().trim(),
        subject: `${name.split(" ")[0]}, aquí está tu 10% de descuento YOSSICO`,
        html: emailHtml,
      }),
    });

    const resendBody = await resendRes.text();
    if (!resendRes.ok) {
      console.error("[resend] FAILED — status:", resendRes.status, "| body:", resendBody);
      // Email failed but user is already saved — return success with code anyway
    } else {
      console.log("[resend] OK — id:", resendBody);
    }


    return new Response(
      JSON.stringify({ success: true, discount_code: discountCode }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Error inesperado. Intenta de nuevo." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
