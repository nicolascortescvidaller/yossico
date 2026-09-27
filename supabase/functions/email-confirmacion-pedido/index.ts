import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
    const { pedidoId, nombre, email, tel, ciudad, items, total, codigo_descuento } =
      await req.json();

    // If no email, skip silently
    if (!email) {
      return new Response(
        JSON.stringify({ skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firstName = (nombre || "").split(" ")[0] || "cliente";

    /* ── Build items rows ── */
    function fmtPrice(n: number): string {
      return "$" + Math.round(n).toLocaleString("es-CO") + " COP";
    }

    const itemRows: string = Array.isArray(items) && items.length
      ? items
          .map((it: Record<string, unknown>) => {
            const name  = String(it.nombre || it.name || it.producto || "—");
            const talla = String(it.talla || it.size || "");
            const qty   = Number(it.qty || it.cantidad || 1);
            const price = Number(it.precio || it.price || 0);
            const subtotal = price * qty;

            return `
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #ebe9e5; font-size:12px; color:#333; font-weight:300;">
                  ${name}
                  ${talla ? `<span style="color:#999; font-size:10px; margin-left:6px;">Talla ${talla}</span>` : ""}
                  ${qty > 1 ? `<span style="color:#999; font-size:10px; margin-left:6px;">×${qty}</span>` : ""}
                </td>
                <td style="padding:10px 0; border-bottom:1px solid #ebe9e5; font-size:12px; color:#333; text-align:right; white-space:nowrap; font-weight:300;">
                  ${fmtPrice(subtotal)}
                </td>
              </tr>`;
          })
          .join("")
      : `<tr><td colspan="2" style="padding:10px 0; font-size:12px; color:#999;">—</td></tr>`;

    /* ── Discount line ── */
    const discountRow = codigo_descuento
      ? `
        <tr>
          <td colspan="2" style="padding:12px 0; font-size:11px; color:#2D6A4F; letter-spacing:0.5px;">
            ✓ Descuento aplicado · código <strong>${codigo_descuento}</strong>
          </td>
        </tr>`
      : "";

    /* ── Total row ── */
    const totalRow = total
      ? `
        <tr>
          <td style="padding:20px 0 0; font-size:9px; letter-spacing:3px; text-transform:uppercase; color:#8a8a8a;">Total</td>
          <td style="padding:20px 0 0; font-size:24px; font-weight:300; color:#111; text-align:right; font-family:'Georgia', serif;">
            ${fmtPrice(Number(total))}
          </td>
        </tr>`
      : "";

    /* ── Contact line ── */
    const contactLine = tel
      ? `Te contactaremos a tu WhatsApp <strong>${tel}</strong> para coordinar el envío.`
      : "Te contactaremos pronto para coordinar los detalles del envío.";

    /* ── Pedido ID ── */
    const pedidoLine = pedidoId
      ? `<p style="margin:8px 0 0; font-size:10px; color:#aaa; font-family:'Courier New', monospace; letter-spacing:1px;">Ref. ${pedidoId}</p>`
      : "";

    /* ── Full email HTML ── */
    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido confirmado — YOSSICO</title>
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
                Pedido recibido,<br><em style="font-style:italic; color:rgba(255,255,255,0.55);">${firstName}.</em>
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 48px 32px;">
              <p style="margin:0 0 32px; font-size:13px; color:#444; line-height:1.8; font-weight:300;">
                Gracias por tu compra. Hemos recibido tu pedido y lo estamos preparando con cuidado.
              </p>

              <!-- Order summary label -->
              <p style="margin:0 0 12px; font-size:9px; letter-spacing:4px; text-transform:uppercase; color:#8a8a8a;">Resumen del pedido</p>

              <!-- Items table -->
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemRows}
                ${discountRow}
                ${totalRow}
              </table>

              <!-- Shipping info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:36px 0 0;">
                <tr>
                  <td style="background:#f8f8f8; border:1px solid #ebe9e5; padding:24px 28px;">
                    <p style="margin:0 0 8px; font-size:9px; letter-spacing:3px; text-transform:uppercase; color:#8a8a8a;">Próximos pasos</p>
                    <p style="margin:0; font-size:12px; color:#444; line-height:1.8; font-weight:300;">
                      ${contactLine}
                    </p>
                    ${pedidoLine}
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <a href="https://yossico.com/coleccion.html"
                 style="display:inline-block; margin-top:36px; padding:14px 32px; background:#111111; color:#ffffff; text-decoration:none; font-size:10px; letter-spacing:3px; text-transform:uppercase;">
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
                <a href="https://yossico.com" style="color:#aaa;">yossico.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    /* ── Send via Resend ── */
    const resendKey = Deno.env.get("RESEND_API_KEY");
    console.log("[email-confirmacion] key present:", !!resendKey);

    const subject = `${firstName}, tu pedido YOSSICO está confirmado ✓`;

    try {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "YOSSICO <hola@yossico.com>",
          to: email,
          subject,
          html: emailHtml,
        }),
      });

      const resendBody = await resendRes.text();
      if (!resendRes.ok) {
        console.error("[email-confirmacion] Resend FAILED — status:", resendRes.status, "| body:", resendBody);
        // Do NOT throw — we return success to the caller regardless
      } else {
        console.log("[email-confirmacion] Resend OK — id:", resendBody);
      }
    } catch (emailErr) {
      console.error("[email-confirmacion] Resend fetch error:", emailErr);
      // Swallow — caller still gets success
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[email-confirmacion] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Error inesperado." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
