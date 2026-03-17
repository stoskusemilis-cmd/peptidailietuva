import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const POSSIBLE_OFFSETS = [0.0001, 0.0002, 0.0003, 0.0004, 0.0005, 0.0006, 0.0007, 0.0008, 0.0009];
const BASE_TOLERANCE = 0.00005;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { base_sol } = await req.json();

    if (typeof base_sol !== "number" || base_sol <= 0 || !isFinite(base_sol)) {
      return new Response(JSON.stringify({ error: "Invalid base_sol" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const windowStart = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: recentOrders } = await supabase
      .from("orders")
      .select("crypto_amount, unique_sol_offset")
      .eq("payment_status", "pending")
      .gte("created_at", windowStart);

    const usedOffsets = new Set<number>();

    for (const order of recentOrders ?? []) {
      const cryptoAmount = parseFloat(order.crypto_amount);
      const offset = parseFloat(order.unique_sol_offset ?? "0");
      if (isNaN(cryptoAmount) || isNaN(offset)) continue;

      const orderBase = cryptoAmount - offset;
      if (Math.abs(orderBase - base_sol) <= BASE_TOLERANCE) {
        const rounded = Math.round(offset * 10000) / 10000;
        if (POSSIBLE_OFFSETS.includes(rounded)) {
          usedOffsets.add(rounded);
        }
      }
    }

    const available = POSSIBLE_OFFSETS.filter(o => !usedOffsets.has(o));

    const offset = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : POSSIBLE_OFFSETS[Math.floor(Math.random() * POSSIBLE_OFFSETS.length)];

    return new Response(JSON.stringify({ offset }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
