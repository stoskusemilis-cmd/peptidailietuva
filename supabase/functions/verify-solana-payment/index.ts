import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SOLANA_ADDRESS = "A8CDFpdaLuzfZWDX2xbCXf8nXSJpz3K5urqTPGL126ai";
const LAMPORTS_PER_SOL = 1_000_000_000;
const TOLERANCE = 0.000005;
const RPC_URL = "https://api.mainnet-beta.solana.com";
const HELIUS_RPC = Deno.env.get("HELIUS_RPC_URL") ?? "";

async function rpcFetch(body: object, retries = 3): Promise<Response> {
  const urls = [RPC_URL, ...(HELIUS_RPC ? [HELIUS_RPC] : [])];
  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    const url = urls[attempt % urls.length];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries - 1) await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastErr;
}

async function getRecentTransactions(limit = 200): Promise<Array<{ signature: string; blockTime: number | null; err: null | object }>> {
  try {
    const res = await rpcFetch({
      jsonrpc: "2.0",
      id: 1,
      method: "getSignaturesForAddress",
      params: [SOLANA_ADDRESS, { limit }],
    });
    const data = await res.json();
    return data?.result ?? [];
  } catch {
    return [];
  }
}

type SbClient = ReturnType<typeof createClient>;

async function decrementStockForOrder(
  supabase: SbClient,
  orderId: string,
  orderItems: unknown
): Promise<void> {
  if (!Array.isArray(orderItems)) return;
  for (const raw of orderItems) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as { product_id?: string; quantity?: number };
    const pid = typeof item.product_id === "string" ? item.product_id : null;
    const qty = Math.floor(Number(item.quantity));
    if (!pid || !Number.isFinite(qty) || qty <= 0) continue;
    try {
      await supabase.rpc("decrement_product_stock", {
        p_product_id: pid,
        p_quantity: qty,
        p_order_id: orderId,
      });
    } catch (e) {
      console.error("decrement_product_stock failed", { orderId, pid, qty, e });
    }
  }
}

async function getTransactionAmount(signature: string): Promise<{ receivedSol: number } | null> {
  try {
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
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();

    if (!order_id || typeof order_id !== "string") {
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
    if (isNaN(expectedSolNum) || expectedSolNum <= 0 || !isFinite(expectedSolNum)) {
      return new Response(JSON.stringify({ error: "Invalid crypto_amount in order" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderCreatedAt = new Date(order.created_at).getTime() / 1000;
    const lookbackSeconds = 7 * 24 * 60 * 60;

    const allSignatures = await getRecentTransactions(200);

    const candidateSignatures = allSignatures.filter(
      (s) => s.err === null && s.blockTime != null && s.blockTime >= (orderCreatedAt - 300)
        && s.blockTime <= (orderCreatedAt + lookbackSeconds)
    );

    const windowStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
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

      const underpaid = expectedSolNum - txInfo.receivedSol;
      const overpaid = txInfo.receivedSol - expectedSolNum;
      const acceptable = underpaid <= TOLERANCE && overpaid <= 0.01;
      if (acceptable) {
        const { data: updated } = await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            order_status: "confirmed",
            status: "paid",
            transaction_signature: sig.signature,
            payment_confirmed_at: new Date().toISOString(),
          })
          .eq("id", order_id)
          .eq("payment_status", "pending")
          .select("id, order_items")
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

        await decrementStockForOrder(supabase, order_id, updated.order_items);

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
    console.error("verify-solana-payment error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
