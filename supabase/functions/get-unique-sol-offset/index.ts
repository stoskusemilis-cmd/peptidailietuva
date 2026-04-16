import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OFFSET_COUNT = 99;
const POSSIBLE_OFFSETS: number[] = [];
for (let i = 1; i <= OFFSET_COUNT; i++) {
  POSSIBLE_OFFSETS.push(parseFloat((i * 0.00001).toFixed(5)));
}

const BASE_TOLERANCE = 0.0005;

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

    const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();

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
        const rounded = parseFloat(offset.toFixed(5));
        usedOffsets.add(rounded);
      }
    }

    const available = POSSIBLE_OFFSETS.filter(o => !usedOffsets.has(o));

    let offset: number;
    if (available.length > 0) {
      offset = available[Math.floor(Math.random() * available.length)];
    } else {
      const extendedOffset = parseFloat(((Math.floor(Math.random() * 900) + 100) * 0.00001).toFixed(5));
      offset = extendedOffset;
    }

    return new Response(JSON.stringify({ offset, available_count: available.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
