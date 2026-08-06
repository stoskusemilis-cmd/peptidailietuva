import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LAMPORTS_PER_SOL = 1_000_000_000;
const TOLERANCE = 0.00005;
const ONRAMP_EUR_TOLERANCE = 10;

async function rpcFetch(body: object): Promise<Response> {
  const rpcUrl = Deno.env.get("HELIUS_RPC_URL") || "https://api.mainnet-beta.solana.com";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    return await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function getRecentTransactions(address: string, limit = 25) {
  const res = await rpcFetch({
    jsonrpc: "2.0",
    id: 1,
    method: "getSignaturesForAddress",
    params: [address, { limit }],
  });
  const data = await res.json();
  return (data?.result ?? []) as Array<{ signature: string; blockTime: number | null; err: null | object }>;
}

async function getTransactionAmount(signature: string, recipient: string): Promise<{ receivedSol: number } | null> {
  const res = await rpcFetch({
    jsonrpc: "2.0",
    id: 1,
    method: "getTransaction",
    params: [signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
  });
  const data = await res.json();
  const tx = data?.result;
  if (!tx) return null;

  const accountKeys: string[] = tx.transaction?.message?.accountKeys?.map(
    (k: { pubkey?: string } | string) => (typeof k === "string" ? k : k.pubkey ?? "")
  ) ?? [];

  const recipientIndex = accountKeys.indexOf(recipient);
  if (recipientIndex === -1) return null;

  const preBalances: number[] = tx.meta?.preBalances ?? [];
  const postBalances: number[] = tx.meta?.postBalances ?? [];
  const receivedLamports = (postBalances[recipientIndex] ?? 0) - (preBalances[recipientIndex] ?? 0);
  return { receivedSol: receivedLamports / LAMPORTS_PER_SOL };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "Missing order_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, payment_status, transaction_signature, crypto_amount, total_amount, created_at, deposit_address, shipping_address")
      .eq("id", order_id)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.payment_status === "paid" || order.payment_status === "confirmed") {
      return new Response(JSON.stringify({ confirmed: true, signature: order.transaction_signature }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!order.deposit_address) {
      return new Response(JSON.stringify({ confirmed: false, error: "no_deposit_address" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expectedSolNum = parseFloat(order.crypto_amount);
    if (isNaN(expectedSolNum) || expectedSolNum <= 0) {
      return new Response(JSON.stringify({ error: "Invalid crypto_amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentMethod = order.shipping_address?.payment_method ?? null;
    const isOnramp = paymentMethod === "onramp";

    let solPriceEur = 0;
    if (isOnramp) {
      try {
        const priceRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=eur");
        const priceData = await priceRes.json();
        solPriceEur = priceData?.solana?.eur ?? 0;
      } catch {}
    }

    const orderCreatedAt = new Date(order.created_at).getTime() / 1000;
    const sigs = await getRecentTransactions(order.deposit_address, 25);
    const candidates = sigs.filter((s) => s.err === null && s.blockTime != null && s.blockTime >= orderCreatedAt - 60);

    for (const sig of candidates) {
      const txInfo = await getTransactionAmount(sig.signature, order.deposit_address);
      if (!txInfo || txInfo.receivedSol <= 0) continue;

      let amountMatches = false;
      if (isOnramp && solPriceEur > 0) {
        const receivedEur = txInfo.receivedSol * solPriceEur;
        const expectedEur = parseFloat(order.total_amount);
        amountMatches = receivedEur >= (expectedEur - ONRAMP_EUR_TOLERANCE) && receivedEur <= (expectedEur + ONRAMP_EUR_TOLERANCE);
      } else {
        amountMatches = Math.abs(txInfo.receivedSol - expectedSolNum) <= TOLERANCE || txInfo.receivedSol >= expectedSolNum - TOLERANCE;
      }

      if (amountMatches) {
        const { data: updated } = await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            order_status: "confirmed",
            status: "paid",
            transaction_signature: sig.signature,
            payment_confirmed_at: new Date().toISOString(),
            crypto_amount: txInfo.receivedSol,
          })
          .eq("id", order_id)
          .eq("payment_status", "pending")
          .select("id")
          .maybeSingle();

        if (updated) {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
              body: JSON.stringify({ order_id, type: "payment_confirmed" }),
            });
          } catch (e) {
            console.error("payment_confirmed email failed:", e);
          }
          EdgeRuntime.waitUntil((async () => {
            try {
              await fetch(`${supabaseUrl}/functions/v1/sweep-payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
                body: JSON.stringify({ order_id }),
              });
            } catch (e) {
              console.error("post-confirm sweep failed:", e);
            }
          })());
        }

        return new Response(
          JSON.stringify({ confirmed: true, signature: sig.signature, received_sol: txInfo.receivedSol }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(JSON.stringify({ confirmed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
