import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SOLANA_ADDRESS = "A8CDFpdaLuzfZWDX2xbCXf8nXSJpz3K5urqTPGL126ai";
const LAMPORTS_PER_SOL = 1_000_000_000;
const TOLERANCE = 0.00005;
const RPC_URL = "https://api.mainnet-beta.solana.com";

async function rpcFetch(body: object): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    return await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function getRecentTransactions(limit = 100): Promise<Array<{ signature: string; blockTime: number | null; err: null | object }>> {
  const res = await rpcFetch({
    jsonrpc: "2.0",
    id: 1,
    method: "getSignaturesForAddress",
    params: [SOLANA_ADDRESS, { limit }],
  });
  const data = await res.json();
  return data?.result ?? [];
}

async function getTransactionAmount(signature: string): Promise<{ receivedSol: number } | null> {
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

  const recipientIndex = accountKeys.indexOf(SOLANA_ADDRESS);
  if (recipientIndex === -1) return null;

  const preBalances: number[] = tx.meta?.preBalances ?? [];
  const postBalances: number[] = tx.meta?.postBalances ?? [];
  const receivedLamports = (postBalances[recipientIndex] ?? 0) - (preBalances[recipientIndex] ?? 0);
  const receivedSol = receivedLamports / LAMPORTS_PER_SOL;

  return { receivedSol };
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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, payment_status, transaction_signature, crypto_amount, created_at")
      .eq("id", order_id)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.payment_status === "paid") {
      return new Response(JSON.stringify({ confirmed: true, signature: order.transaction_signature }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expectedSolNum = parseFloat(order.crypto_amount);
    if (isNaN(expectedSolNum) || expectedSolNum <= 0) {
      return new Response(JSON.stringify({ error: "Invalid crypto_amount in order" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderCreatedAt = new Date(order.created_at).getTime() / 1000;
    const lookbackSeconds = 30 * 60;

    const allSignatures = await getRecentTransactions(100);

    const candidateSignatures = allSignatures.filter(
      (s) => s.err === null && s.blockTime != null && s.blockTime >= (orderCreatedAt - lookbackSeconds)
    );

    const windowStart = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: paidOrders } = await supabase
      .from("orders")
      .select("transaction_signature")
      .eq("payment_status", "paid")
      .gte("payment_confirmed_at", windowStart)
      .not("transaction_signature", "is", null);

    const usedSignatures = new Set(
      (paidOrders ?? [])
        .map((o: { transaction_signature: string | null }) => o.transaction_signature)
        .filter(Boolean) as string[]
    );

    for (const sig of candidateSignatures) {
      if (usedSignatures.has(sig.signature)) continue;

      const txInfo = await getTransactionAmount(sig.signature);
      if (!txInfo) continue;
      if (txInfo.receivedSol <= 0) continue;

      if (Math.abs(txInfo.receivedSol - expectedSolNum) <= TOLERANCE) {
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

        if (!updated) {
          const { data: existing } = await supabase
            .from("orders")
            .select("transaction_signature")
            .eq("id", order_id)
            .maybeSingle();
          return new Response(
            JSON.stringify({ confirmed: true, signature: existing?.transaction_signature ?? sig.signature }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
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
              body: JSON.stringify({ order_id, type: "payment_confirmed" }),
            });
          } catch (e) {
            console.error("Failed to send payment confirmation email:", e);
          }
        })());

        return new Response(
          JSON.stringify({ confirmed: true, signature: sig.signature, received_sol: txInfo.receivedSol }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(JSON.stringify({ confirmed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
