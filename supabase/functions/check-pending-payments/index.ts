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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const { data: pendingOrders, error: pendingError } = await supabase
      .from("orders")
      .select("id, order_number, crypto_amount, created_at")
      .eq("payment_status", "pending")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false });

    if (pendingError) {
      console.error("Failed to fetch pending orders:", pendingError);
      return new Response(JSON.stringify({ error: String(pendingError) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingOrders || pendingOrders.length === 0) {
      return new Response(JSON.stringify({ checked: 0, confirmed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Checking ${pendingOrders.length} pending orders`);

    const allSignatures = await getRecentTransactions(200);
    const validSignatures = allSignatures.filter((s) => s.err === null && s.blockTime != null);

    if (validSignatures.length === 0) {
      console.log("No valid signatures from RPC");
      return new Response(JSON.stringify({ checked: pendingOrders.length, confirmed: 0, rpc_empty: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: paidOrders } = await supabase
      .from("orders")
      .select("transaction_signature")
      .eq("payment_status", "paid")
      .gte("created_at", cutoff)
      .not("transaction_signature", "is", null);

    const usedSignatures = new Set(
      (paidOrders ?? [])
        .map((o: { transaction_signature: string | null }) => o.transaction_signature)
        .filter(Boolean) as string[]
    );

    const results: Array<{ order_number: string; confirmed: boolean }> = [];

    for (const order of pendingOrders) {
      const expectedSol = parseFloat(order.crypto_amount);
      if (isNaN(expectedSol) || expectedSol <= 0 || !isFinite(expectedSol)) continue;

      const orderCreatedAtSec = new Date(order.created_at).getTime() / 1000;
      const lookbackSec = 72 * 60 * 60;

      const candidates = validSignatures.filter(
        (s) =>
          !usedSignatures.has(s.signature) &&
          s.blockTime! >= (orderCreatedAtSec - 300) &&
          s.blockTime! <= (orderCreatedAtSec + lookbackSec)
      );

      let matched = false;
      for (const sig of candidates) {
        const txInfo = await getTransactionAmount(sig.signature);
        if (!txInfo || txInfo.receivedSol <= 0) continue;

        if (Math.abs(txInfo.receivedSol - expectedSol) <= TOLERANCE) {
          const { data: updated } = await supabase
            .from("orders")
            .update({
              payment_status: "paid",
              order_status: "confirmed",
              status: "paid",
              transaction_signature: sig.signature,
              payment_confirmed_at: new Date().toISOString(),
            })
            .eq("id", order.id)
            .eq("payment_status", "pending")
            .select("id")
            .maybeSingle();

          if (updated) {
            usedSignatures.add(sig.signature);
            matched = true;
            console.log(`Confirmed order ${order.order_number} with tx ${sig.signature}`);

            try {
              const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
              const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
              await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({ order_id: order.id, type: "payment_confirmed" }),
              });
            } catch (e) {
              console.error("Failed to send email for order", order.order_number, e);
            }
          }

          results.push({ order_number: order.order_number, confirmed: !!updated });
          break;
        }
      }

      if (!matched) {
        results.push({ order_number: order.order_number, confirmed: false });
      }
    }

    const confirmedCount = results.filter((r) => r.confirmed).length;
    console.log(`Done: checked ${pendingOrders.length}, confirmed ${confirmedCount}`);

    return new Response(
      JSON.stringify({ checked: pendingOrders.length, confirmed: confirmedCount, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("check-pending-payments error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
