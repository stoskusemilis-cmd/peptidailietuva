import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SANITY_MIN_EUR = 10;
const SANITY_MAX_EUR = 2000;

type Source = { name: string; fetch: () => Promise<number | null> };

async function timeoutFetch(url: string, ms = 6000): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { signal: ctl.signal });
  } finally {
    clearTimeout(t);
  }
}

const sources: Source[] = [
  {
    name: "binance",
    fetch: async () => {
      try {
        const res = await timeoutFetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLEUR");
        if (!res.ok) return null;
        const data = await res.json();
        const v = parseFloat(data?.price);
        return Number.isFinite(v) && v > 0 ? v : null;
      } catch {
        return null;
      }
    },
  },
  {
    name: "coingecko",
    fetch: async () => {
      try {
        const res = await timeoutFetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=eur");
        if (!res.ok) return null;
        const data = await res.json();
        const v = data?.solana?.eur;
        return typeof v === "number" && v > 0 ? v : null;
      } catch {
        return null;
      }
    },
  },
  {
    name: "kraken",
    fetch: async () => {
      try {
        const res = await timeoutFetch("https://api.kraken.com/0/public/Ticker?pair=SOLEUR");
        if (!res.ok) return null;
        const data = await res.json();
        const result = data?.result;
        if (!result) return null;
        const firstKey = Object.keys(result)[0];
        const price = parseFloat(result[firstKey]?.c?.[0]);
        return Number.isFinite(price) && price > 0 ? price : null;
      } catch {
        return null;
      }
    },
  },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const prices: { source: string; price: number }[] = [];

    for (const s of sources) {
      const p = await s.fetch();
      if (p != null && p >= SANITY_MIN_EUR && p <= SANITY_MAX_EUR) {
        prices.push({ source: s.name, price: p });
      }
      if (prices.length >= 2) break;
    }

    if (prices.length === 0) {
      return new Response(
        JSON.stringify({ error: "price_unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sorted = [...prices].sort((a, b) => a.price - b.price);
    const median = sorted[Math.floor(sorted.length / 2)].price;

    return new Response(
      JSON.stringify({
        price_eur: median,
        sources: prices,
        fetched_at: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=30",
        },
      }
    );
  } catch (err) {
    console.error("get-sol-price error:", err);
    return new Response(
      JSON.stringify({ error: "internal_error", message: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
