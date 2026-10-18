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
              <div style="margin-top:36px;">
                <a href="https://yossico.com/rastreo.html?busqueda=${pedidoId || tel || ''}"
                   style="display:inline-block; padding:14px 32px; background:#111111; color:#ffffff; text-decoration:none; font-size:10px; letter-spacing:3px; text-transform:uppercase;">
                  Rastrear mi pedido en tiempo real →
                </a>
                <a href="https://yossico.com/coleccion.html"
                   style="display:inline-block; margin-left:16px; font-size:10px; letter-spacing:2px; text-transform:uppercase; color:#666; text-decoration:none;">
                  Ver colección →
                </a>
              </div>
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
      } else {
        console.log("[email-confirmacion] Resend OK — id:", resendBody);
      }
    } catch (emailErr) {
      console.error("[email-confirmacion] Resend fetch error:", emailErr);
    }

    /* ── Notificación instantánea a la administración (Nicolás / YOSSICO) ── */
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "YOSSICO Tienda <hola@yossico.com>",
            to: "hola@yossico.com",
            subject: `🚨 ¡Nueva venta YOSSICO! ${fmtPrice(Number(total || 0))} — ${nombre}`,
            html: `
              <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;border:1px solid #ebe9e5;background:#ffffff;">
                <span style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#888;">YOSSICO Ventas</span>
                <h2 style="margin:12px 0 20px;color:#111;font-weight:400;font-size:24px;">¡Nueva venta registrada!</h2>
                <div style="background:#f9f9f7;padding:18px;border-radius:4px;margin-bottom:24px;font-size:13px;line-height:1.7;color:#333;">
                  <p style="margin:0 0 6px;"><strong>Cliente:</strong> ${nombre}</p>
                  <p style="margin:0 0 6px;"><strong>WhatsApp:</strong> <a href="https://wa.me/${(tel || '').replace(/\D/g, '')}" target="_blank" style="color:#1565c0;text-decoration:none;">${tel || 'No registrado'}</a></p>
                  <p style="margin:0 0 6px;"><strong>Email:</strong> ${email}</p>
                  <p style="margin:0 0 6px;"><strong>Ciudad:</strong> ${ciudad || 'No especificada'}</p>
                  <p style="margin:0 0 6px;"><strong>Total:</strong> <strong style="font-size:16px;color:#111;">${fmtPrice(Number(total || 0))}</strong></p>
                  <p style="margin:0 0 6px;"><strong>Ref. Pedido:</strong> <code>${pedidoId || 'N/A'}</code></p>
                  ${codigo_descuento ? `<p style="margin:0;color:#2D6A4F;"><strong>Cupón aplicado:</strong> ${codigo_descuento}</p>` : ''}
                </div>
                <h3 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#888;">Prendas del pedido:</h3>
                <table width="100%" cellpadding="6" style="border-collapse:collapse;border:1px solid #eee;font-size:12px;">
                  ${itemRows}
                </table>
                <div style="margin-top:28px;">
                  <a href="https://yossico.com/YOSSICO_Panel_Admin.html" style="background:#111;color:#fff;padding:12px 24px;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;display:inline-block;">Ir al Panel de Administración →</a>
                </div>
              </div>
            `
          }),
        });
        console.log("[email-confirmacion] Admin alert sent successfully");
      } catch (adminErr) {
        console.warn("[email-confirmacion] Admin alert error:", adminErr);
      }
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
