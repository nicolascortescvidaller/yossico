/**
 * YOSSICO — Edge Function: generar-pago-wompi
 *
 * Recibe los datos del pedido, genera la firma de integridad (SHA256)
 * y devuelve los parámetros listos para el widget de Wompi.
 *
 * ─── VARIABLES DE ENTORNO REQUERIDAS ─────────────────────────────────
 * WOMPI_PUBLIC_KEY       → Clave pública de Wompi  (empieza con pub_)
 * WOMPI_INTEGRITY_KEY    → Llave de integridad de Wompi (para la firma)
 * SUPABASE_URL           → URL de tu proyecto Supabase
 * DB_SERVICE_KEY         → Service Role Key de Supabase
 *
 * Configurar en: Supabase → Edge Functions → Secrets
 * ─────────────────────────────────────────────────────────────────────
 *
 * Request (POST):
 * {
 *   "pedidoId":   "uuid-del-pedido",
 *   "totalCOP":   269900,            ← total en pesos colombianos
 *   "referencia": "YOSSICO-XXXXXX"  ← opcional, se genera si no se manda
 * }
 *
 * Response:
 * {
 *   "publicKey":   "pub_...",
 *   "referencia":  "YOSSICO-XXXXXX",
 *   "amountCents": 26990000,
 *   "currency":    "COP",
 *   "firma":       "sha256hash...",
 *   "redirectUrl": "https://yossico.com/gracias.html"
 * }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WOMPI_PUBLIC_KEY    = Deno.env.get("WOMPI_PUBLIC_KEY")    ?? "";
const WOMPI_INTEGRITY_KEY = Deno.env.get("WOMPI_INTEGRITY_KEY") ?? "";
const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")        ?? "";
const DB_SERVICE_KEY      = Deno.env.get("DB_SERVICE_KEY")      ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // ── Bloquear si no están configuradas las claves ──────────────────
  if (!WOMPI_PUBLIC_KEY || !WOMPI_INTEGRITY_KEY) {
    return new Response(
      JSON.stringify({ error: "Wompi no configurado. Agrega WOMPI_PUBLIC_KEY y WOMPI_INTEGRITY_KEY en los secrets de Supabase." }),
      { status: 503, headers: CORS }
    );
  }

  try {
    const { pedidoId, totalCOP, referencia: refInput } = await req.json();

    if (!pedidoId || !totalCOP) {
      return new Response(JSON.stringify({ error: "pedidoId y totalCOP son requeridos" }), { status: 400, headers: CORS });
    }

    // ── Generar referencia única ──────────────────────────────────────
    const referencia = refInput ?? `YOSSICO-${pedidoId.split("-")[0].toUpperCase()}-${Date.now()}`;
    const amountCents = Math.round(totalCOP * 100); // Wompi trabaja en centavos
    const currency = "COP";

    // ── Firma de integridad SHA256 ────────────────────────────────────
    // Wompi requiere: SHA256(referencia + amountCents + currency + integrityKey)
    const cadena = `${referencia}${amountCents}${currency}${WOMPI_INTEGRITY_KEY}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(cadena);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const firma = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // ── Guardar la referencia Wompi en el pedido ──────────────────────
    const sb = createClient(SUPABASE_URL, DB_SERVICE_KEY);
    const { error: updateError } = await sb
      .from("pedidos")
      .update({ wompi_referencia: referencia, wompi_estado: "PENDING", metodo_pago: "wompi" })
      .eq("id", pedidoId);

    if (updateError) {
      console.error("[generar-pago-wompi] update error:", updateError.message);
    }

    return new Response(JSON.stringify({
      publicKey:   WOMPI_PUBLIC_KEY,
      referencia,
      amountCents,
      currency,
      firma,
      redirectUrl: "https://yossico.com/gracias.html",
    }), { headers: CORS });

  } catch (err) {
    console.error("[generar-pago-wompi] error:", err);
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500, headers: CORS });
  }
});
