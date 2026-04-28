import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SOLANA_ADDRESS = "A8CDFpdaLuzfZWDX2xbCXf8nXSJpz3K5urqTPGL126ai";
const SHIPPING_FEE_EUR = 3.5;
const FREE_SHIPPING_THRESHOLD = 50;
const ALLOWED_PAYMENT_METHODS = new Set([
  "swaps",
  "paybis",
  "phantom",
  "trust",
  "revolut",
]);
const SOL_PRICE_MIN = 10;
const SOL_PRICE_MAX = 2000;

type CartItemInput = {
  product_id: string;
  quantity: number;
};

type CreateOrderInput = {
  cart: CartItemInput[];
  customer_phone: string;
  customer_city: string;
  parcel_locker_id?: string | null;
  payment_method: string;
  discount_code?: string | null;
  expected_sol_price_eur?: number | null;
};

type ProductRow = {
  id: string;
  name: string;
  price: number | string;
  stock: number;
  is_active: boolean;
};

type TierRow = {
  product_id: string;
  quantity: number;
  price: number | string;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 10000) / 10000;
const round5 = (n: number) => Math.round(n * 100000) / 100000;

async function fetchSolPriceEur(): Promise<number | null> {
  const sources = [
    async () => {
      try {
        const r = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLEUR");
        if (!r.ok) return null;
        const d = await r.json();
        const v = parseFloat(d?.price);
        return Number.isFinite(v) && v > 0 ? v : null;
      } catch { return null; }
    },
    async () => {
      try {
        const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=eur");
        if (!r.ok) return null;
        const d = await r.json();
        const v = d?.solana?.eur;
        return typeof v === "number" && v > 0 ? v : null;
      } catch { return null; }
    },
    async () => {
      try {
        const r = await fetch("https://api.kraken.com/0/public/Ticker?pair=SOLEUR");
        if (!r.ok) return null;
        const d = await r.json();
        const result = d?.result;
        if (!result) return null;
        const k = Object.keys(result)[0];
        const p = parseFloat(result[k]?.c?.[0]);
        return Number.isFinite(p) && p > 0 ? p : null;
      } catch { return null; }
    },
  ];

  const collected: number[] = [];
  for (const src of sources) {
    const p = await src();
    if (p != null && p >= SOL_PRICE_MIN && p <= SOL_PRICE_MAX) collected.push(p);
    if (collected.length >= 2) break;
  }
  if (collected.length === 0) return null;
  collected.sort((a, b) => a - b);
  return collected[Math.floor(collected.length / 2)];
}

function sanitize(value: unknown, max = 200): string {
  if (typeof value !== "string") return "";
  return value.replace(/[<>"'`]/g, "").trim().slice(0, max);
}

function validatePhone(phone: string): boolean {
  return /^[\d\s+\-()]{6,20}$/.test(phone.trim());
}

async function pickUniqueOffset(
  supabase: ReturnType<typeof createClient>,
  baseSol: number
): Promise<number> {
  const offsets: number[] = [];
  for (let i = 1; i <= 99; i++) offsets.push(round5(i * 0.00001));

  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("orders")
    .select("crypto_amount, unique_sol_offset")
    .eq("payment_status", "pending")
    .gte("created_at", windowStart);

  const used = new Set<number>();
  for (const o of recent ?? []) {
    const amount = parseFloat(String(o.crypto_amount));
    const off = parseFloat(String(o.unique_sol_offset ?? 0));
    if (!Number.isFinite(amount) || !Number.isFinite(off)) continue;
    if (Math.abs(amount - off - baseSol) <= 0.0005) {
      used.add(round5(off));
    }
  }

  const available = offsets.filter((o) => !used.has(o));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  return round5((Math.floor(Math.random() * 900) + 100) * 0.00001);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "method_not_allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as CreateOrderInput;

    if (!Array.isArray(body?.cart) || body.cart.length === 0) {
      return new Response(JSON.stringify({ error: "empty_cart" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.cart.length > 50) {
      return new Response(JSON.stringify({ error: "too_many_items" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const phone = sanitize(body.customer_phone, 20);
    const city = sanitize(body.customer_city, 100);
    const parcelLockerId = body.parcel_locker_id ? sanitize(body.parcel_locker_id, 64) : null;
    const paymentMethod = sanitize(body.payment_method, 32);
    const discountCodeRaw = body.discount_code ? sanitize(body.discount_code, 32).toUpperCase() : null;

    if (!validatePhone(phone)) {
      return new Response(JSON.stringify({ error: "invalid_phone" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!city) {
      return new Response(JSON.stringify({ error: "invalid_city" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!parcelLockerId) {
      return new Response(JSON.stringify({ error: "parcel_locker_required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
      return new Response(JSON.stringify({ error: "invalid_payment_method" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanCart: CartItemInput[] = [];
    for (const item of body.cart) {
      const id = sanitize(item?.product_id, 64);
      const qty = Math.floor(Number(item?.quantity));
      if (!id || !Number.isFinite(qty) || qty <= 0 || qty > 100) {
        return new Response(JSON.stringify({ error: "invalid_cart_item" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      cleanCart.push({ product_id: id, quantity: qty });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: lockerRow, error: lockerErr } = await supabase
      .from("parcel_lockers")
      .select("id, city, is_active")
      .eq("id", parcelLockerId)
      .maybeSingle();
    if (lockerErr || !lockerRow || !lockerRow.is_active) {
      return new Response(JSON.stringify({ error: "invalid_parcel_locker" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (lockerRow.city !== city) {
      return new Response(JSON.stringify({ error: "locker_city_mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productIds = [...new Set(cleanCart.map((i) => i.product_id))];
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("id, name, price, stock, is_active")
      .in("id", productIds);

    if (prodErr || !products) {
      return new Response(JSON.stringify({ error: "products_fetch_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productMap = new Map<string, ProductRow>();
    for (const p of products as ProductRow[]) {
      if (!p.is_active) continue;
      productMap.set(p.id, p);
    }

    for (const item of cleanCart) {
      const p = productMap.get(item.product_id);
      if (!p) {
        return new Response(JSON.stringify({ error: "product_unavailable", product_id: item.product_id }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (p.stock < item.quantity) {
        return new Response(JSON.stringify({ error: "insufficient_stock", product_id: p.id, available: p.stock }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: tiers } = await supabase
      .from("product_price_tiers")
      .select("product_id, quantity, price")
      .in("product_id", productIds);

    const tierMap = new Map<string, number>();
    for (const t of (tiers ?? []) as TierRow[]) {
      tierMap.set(`${t.product_id}:${t.quantity}`, parseFloat(String(t.price)));
    }

    let subtotal = 0;
    const orderItems: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      price: number;
      line_total: number;
    }> = [];

    for (const item of cleanCart) {
      const product = productMap.get(item.product_id)!;
      const tierKey = `${item.product_id}:${item.quantity}`;
      const tierPrice = tierMap.get(tierKey);
      const basePrice = parseFloat(String(product.price));
      const lineTotal = round2(tierPrice != null ? tierPrice : basePrice * item.quantity);
      const unitPrice = round4(lineTotal / item.quantity);
      subtotal += lineTotal;
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        price: unitPrice,
        line_total: lineTotal,
      });
    }

    subtotal = round2(subtotal);

    let discountPercent = 0;
    let commissionPercent = 0;
    let appliedCode: string | null = null;
    if (discountCodeRaw) {
      const { data: applied, error: discErr } = await supabase
        .rpc("apply_discount_code", { p_code: discountCodeRaw });

      if (discErr) {
        console.error("apply_discount_code error", discErr);
      }
      const row = Array.isArray(applied) && applied.length > 0 ? applied[0] : null;
      if (row) {
        appliedCode = row.code;
        discountPercent = row.discount_percent;
        commissionPercent = row.referral_commission_percent ?? 0;
      } else {
        return new Response(JSON.stringify({ error: "invalid_discount_code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const discountAmount = round2((subtotal * discountPercent) / 100);
    const discountedSubtotal = round2(subtotal - discountAmount);
    const shippingFee = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE_EUR;
    const totalEur = round2(discountedSubtotal + shippingFee);

    if (parcelLockerId) {
      const { data: locker } = await supabase
        .from("parcel_lockers")
        .select("id, is_active, city, provider, address, locker_code")
        .eq("id", parcelLockerId)
        .maybeSingle();
      if (!locker || !locker.is_active) {
        return new Response(JSON.stringify({ error: "invalid_parcel_locker" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const serverSolPrice = await fetchSolPriceEur();
    if (!serverSolPrice) {
      return new Response(JSON.stringify({ error: "sol_price_unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let solPrice = serverSolPrice;
    const clientPrice = Number(body.expected_sol_price_eur);
    if (
      Number.isFinite(clientPrice) &&
      clientPrice >= SOL_PRICE_MIN &&
      clientPrice <= SOL_PRICE_MAX
    ) {
      const drift = Math.abs(clientPrice - serverSolPrice) / serverSolPrice;
      if (drift <= 0.05) {
        solPrice = clientPrice;
      } else {
        return new Response(
          JSON.stringify({
            error: "sol_price_drift",
            server_price: serverSolPrice,
            client_price: clientPrice,
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const baseSol = round4(totalEur / solPrice);
    const offset = await pickUniqueOffset(supabase, baseSol);
    const cryptoAmount = round5(baseSol + offset);

    const fullOrderDetails = {
      items: orderItems,
      phone,
      city,
      parcel_locker_id: parcelLockerId,
      payment: {
        method: paymentMethod,
        wallet_address: SOLANA_ADDRESS,
        crypto_type: "SOL",
      },
      pricing: {
        subtotal_eur: subtotal,
        discount_code: appliedCode,
        discount_percent: appliedCode ? discountPercent : null,
        discount_amount_eur: discountAmount,
        discounted_subtotal_eur: discountedSubtotal,
        shipping_fee_eur: shippingFee,
        total_eur: totalEur,
        sol_price_eur: solPrice,
        base_sol: baseSol,
        unique_sol_offset: offset,
        total_sol: cryptoAmount,
        commission_percent: appliedCode ? commissionPercent : null,
      },
    };

    const { data: order, error: insertErr } = await supabase
      .from("orders")
      .insert({
        customer_phone: phone,
        customer_city: city,
        delivery_method: "parcel_locker",
        parcel_locker_id: parcelLockerId,
        order_items: orderItems,
        total_amount: totalEur,
        subtotal_amount: subtotal,
        shipping_fee: shippingFee,
        discount_code: appliedCode,
        discount_percent: appliedCode ? discountPercent : null,
        discount_amount: discountAmount,
        crypto_amount: cryptoAmount,
        unique_sol_offset: offset,
        sol_price_eur: solPrice,
        payment_method: paymentMethod,
        payment_status: "pending",
        order_status: "pending",
        wallet_address: SOLANA_ADDRESS,
        full_order_details: fullOrderDetails,
        shipping_address: {
          crypto_type: "SOL",
          wallet_address: SOLANA_ADDRESS,
          payment_method: paymentMethod,
          shipping_fee_eur: shippingFee,
          original_total_eur: subtotal,
        },
      })
      .select()
      .maybeSingle();

    if (insertErr || !order) {
      console.error("order insert failed", insertErr);
      return new Response(JSON.stringify({ error: "order_insert_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    EdgeRuntime.waitUntil((async () => {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ order_id: order.id }),
        });
      } catch (e) {
        console.error("send-order-email failed:", e);
      }
    })());

    return new Response(
      JSON.stringify({
        ok: true,
        order_id: order.id,
        order_number: order.order_number,
        total_eur: totalEur,
        sol_amount: cryptoAmount,
        sol_price_eur: solPrice,
        wallet_address: SOLANA_ADDRESS,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-order error:", err);
    return new Response(JSON.stringify({ error: "internal_error", message: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
