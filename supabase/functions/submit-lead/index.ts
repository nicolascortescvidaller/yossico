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
    const { table, payload, turnstileToken } = await req.json();

    // 1. Basic validation
    if (!table || !payload || !turnstileToken) {
      return new Response(
        JSON.stringify({ error: "Petición inválida. Faltan datos requeridos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Allow list of tables this function can insert into
    const allowedTables = ["institucional_leads", "embajadoras_leads", "waitlist_capas"];
    if (!allowedTables.includes(table)) {
      return new Response(
        JSON.stringify({ error: "Tabla no permitida." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Verify Turnstile Token
    const secretKey = Deno.env.get("TURNSTILE_SECRET_KEY");
    if (!secretKey) {
      console.error("Falta TURNSTILE_SECRET_KEY en las variables de entorno.");
      return new Response(
        JSON.stringify({ error: "Error de configuración del servidor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", turnstileToken);

    const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });
    
    const turnstileData = await turnstileRes.json();

    if (!turnstileData.success) {
      console.error("Turnstile falló:", turnstileData);
      return new Response(
        JSON.stringify({ error: "Verificación de seguridad fallida. Eres un bot?" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Insert into Supabase
    // We use the service role key to bypass RLS, since we just verified the captcha
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("DB_SERVICE_KEY")!
    );

    const { data, error } = await supabase
      .from(table)
      .insert([payload])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(
        JSON.stringify({ error: "Error guardando los datos. Por favor intenta de nuevo." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Error inesperado del servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
