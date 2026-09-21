/**
 * YOSSICO — Edge Function: wompi-webhook
 *
 * Recibe las notificaciones de Wompi cuando un pago cambia de estado.
 * Valida la firma del evento, actualiza el pedido y envía email de confirmación.
 *
 * ─── VARIABLES DE ENTORNO REQUERIDAS ─────────────────────────────────
 * WOMPI_EVENTS_KEY    → Llave de eventos de Wompi (para validar webhooks)
 * SUPABASE_URL        → URL de tu proyecto Supabase
 * DB_SERVICE_KEY      → Service Role Key de Supabase
 * RESEND_API_KEY      → Para enviar email de confirmación al cliente
 *
 * URL del webhook a registrar en Wompi Dashboard:
 *   https://mgzevtcipwfpqgolmpwm.supabase.co/functions/v1/wompi-webhook
 * ─────────────────────────────────────────────────────────────────────
 *
 * Wompi envía un POST con este body:
 * {
 *   "event": "transaction.updated",
 *   "data": { "transaction": { "id": "...", "reference": "...", "status": "APPROVED", ... } },
 *   "sent_at": "2026-09-21T00:00:00.000Z",
 *   "timestamp": 1234567890,
 *   "signature": { "checksum": "sha256...", "properties": ["transaction.id", "..."] }
 * }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WOMPI_EVENTS_KEY = Deno.env.get("WOMPI_EVENTS_KEY") ?? "";
const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")     ?? "";
const DB_SERVICE_KEY   = Deno.env.get("DB_SERVICE_KEY")   ?? "";
const RESEND_API_KEY   = Deno.env.get("RESEND_API_KEY")   ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const body = await req.json();
    const { event, data, timestamp, signature } = body;

    // ── Solo procesar eventos de transacción ─────────────────────────
    if (event !== "transaction.updated") {
      return new Response(JSON.stringify({ received: true }), { headers: CORS });
    }

    const tx = data?.transaction;
    if (!tx) return new Response(JSON.stringify({ error: "Sin datos de transacción" }), { status: 400, headers: CORS });

    // ── Validar firma del webhook ─────────────────────────────────────
    // Wompi concatena los valores de las properties + timestamp + events_key
    const isValid = await validarFirmaWebhook(tx, timestamp, signature, WOMPI_EVENTS_KEY);
    if (!isValid) {
      console.error("[wompi-webhook] Firma inválida — posible intento de fraude");
      return new Response(JSON.stringify({ error: "Firma inválida" }), { status: 401, headers: CORS });
    }

    const { id: wompiId, reference, status, payment_method_type } = tx;

    console.log(`[wompi-webhook] TX ${wompiId} → referencia: ${reference} | estado: ${status}`);

    // ── Actualizar pedido en Supabase ────────────────────────────────
    const sb = createClient(SUPABASE_URL, DB_SERVICE_KEY);
    const { data: pedido, error: fetchError } = await sb
      .from("pedidos")
      .select("id, cliente_nombre, cliente_telefono, items, total")
      .eq("wompi_referencia", reference)
      .single();

    if (fetchError || !pedido) {
      console.error("[wompi-webhook] Pedido no encontrado para referencia:", reference);
      return new Response(JSON.stringify({ received: true }), { headers: CORS });
    }

    // Actualizar estado
    const { error: updateError } = await sb
      .from("pedidos")
      .update({
        wompi_id:     wompiId,
        wompi_estado: status,
        wompi_metodo: payment_method_type,
        metodo_pago:  payment_method_type,
        estado: status === "APPROVED" ? "Pagado"
              : status === "DECLINED" ? "Pago rechazado"
              : status === "VOIDED"   ? "Pago anulado"
              : "Pendiente",
      })
      .eq("id", pedido.id);

    if (updateError) console.error("[wompi-webhook] update error:", updateError.message);

    // ── Email de confirmación si el pago fue aprobado ────────────────
    if (status === "APPROVED" && RESEND_API_KEY) {
      await enviarEmailConfirmacion(pedido, wompiId);
    }

    return new Response(JSON.stringify({ received: true, status }), { headers: CORS });

  } catch (err) {
    console.error("[wompi-webhook] error:", err);
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500, headers: CORS });
  }
});

// ── Validar firma SHA256 de Wompi ─────────────────────────────────────
async function validarFirmaWebhook(
  tx: Record<string, unknown>,
  timestamp: number,
  signature: { checksum: string; properties: string[] },
  eventsKey: string
): Promise<boolean> {
  if (!eventsKey || !signature?.checksum) return false;

  try {
    // Concatenar los valores de las properties especificadas
    const valores = signature.properties.map((prop: string) => {
      const keys = prop.split(".");
      let val: unknown = tx;
      for (const k of keys) val = (val as Record<string, unknown>)?.[k];
      return String(val ?? "");
    });

    const cadena = valores.join("") + timestamp + eventsKey;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(cadena));
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    return hashHex === signature.checksum;
  } catch {
    return false;
  }
}

// ── Email de confirmación de pago ─────────────────────────────────────
async function enviarEmailConfirmacion(
  pedido: { id: string; cliente_nombre: string; cliente_telefono: string; items: unknown[]; total: number },
  wompiId: string
): Promise<void> {
  const prendas = (pedido.items as Array<{ nombre?: string; talla?: string; qty?: number }>)
    .map(i => `• ${i.nombre} · Talla ${i.talla} × ${i.qty ?? 1}`)
    .join("<br>");

  // TODO: Añadir email del cliente al insertar pedido para poder enviar aquí
  // Por ahora solo logueamos
  console.log(`[wompi-webhook] Pago confirmado para pedido ${pedido.id} | Wompi TX: ${wompiId}`);
  console.log(`[wompi-webhook] Cliente: ${pedido.cliente_nombre} | Total: ${pedido.total}`);

  // Cuando se agregue el campo email al pedido, descomentar:
  /*
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "hola@yossico.com",
      to: pedido.cliente_email,
      subject: "✅ Pago confirmado — YOSSICO",
      html: `
        <h2>¡Gracias por tu compra, ${pedido.cliente_nombre}!</h2>
        <p>Tu pago fue procesado exitosamente.</p>
        <p>${prendas}</p>
        <p><strong>Total: $${pedido.total.toLocaleString("es-CO")} COP</strong></p>
        <p>Ref. Wompi: ${wompiId}</p>
      `
    })
  });
  */
}
