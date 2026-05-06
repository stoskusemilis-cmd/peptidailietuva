import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { mnemonicToSeed } from "npm:bip39@3.1.0";
import { derivePath } from "npm:ed25519-hd-key@1.3.0";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from "npm:@solana/web3.js@1.98.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BASE_TX_FEE_LAMPORTS = 5000;
const COMPUTE_UNIT_LIMIT = 1000;
const COMPUTE_UNIT_PRICE_MICROLAMPORTS = 1000;
const PRIORITY_FEE_LAMPORTS = Math.ceil(
  (COMPUTE_UNIT_LIMIT * COMPUTE_UNIT_PRICE_MICROLAMPORTS) / 1_000_000,
);
const TOTAL_TX_FEE_LAMPORTS = BASE_TX_FEE_LAMPORTS + PRIORITY_FEE_LAMPORTS;
const MAX_SEND_RETRIES = 3;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const rpcUrl = Deno.env.get("HELIUS_RPC_URL") || "https://api.mainnet-beta.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");

    const { data: mainWallet, error: mainErr } = await supabase.rpc("get_vault_secret", {
      p_name: "MAIN_WALLET_ADDRESS",
    });
    if (mainErr) throw mainErr;
    if (!mainWallet) throw new Error("MAIN_WALLET_ADDRESS not set");
    const mainPubkey = new PublicKey(mainWallet as string);

    const { data: seedData, error: seedErr } = await supabase.rpc("get_vault_secret", {
      p_name: "MASTER_SEED_MNEMONIC",
    });
    if (seedErr) throw seedErr;
    if (!seedData) throw new Error("MASTER_SEED_MNEMONIC not set");
    const seed = await mnemonicToSeed(seedData as string);
    const seedHex = seed.toString("hex");

    let body: { order_id?: string } = {};
    try { body = await req.json(); } catch { /* no body — sweep all pending */ }

    const query = supabase
      .from("orders")
      .select("id, order_number, deposit_address, derivation_index, crypto_amount, payment_status, swept_at, created_at")
      .not("deposit_address", "is", null)
      .is("swept_at", null)
      .gte("created_at", new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString());

    if (body.order_id) query.eq("id", body.order_id);

    const { data: orders, error: ordersErr } = await query.limit(50);
    if (ordersErr) throw ordersErr;

    const results: Array<Record<string, unknown>> = [];

    for (const order of orders ?? []) {
      try {
        const depositPubkey = new PublicKey(order.deposit_address as string);
        const balance = await connection.getBalance(depositPubkey, "confirmed");
        const expectedLamports = Math.round(Number(order.crypto_amount) * LAMPORTS_PER_SOL);

        if (balance <= 0) {
          results.push({ order_id: order.id, status: "no_balance" });
          continue;
        }

        if (balance + 5000 < expectedLamports) {
          results.push({ order_id: order.id, status: "underpaid", balance, expected: expectedLamports });
          continue;
        }

        if (order.payment_status !== "confirmed" && order.payment_status !== "paid") {
          const sigs = await connection.getSignaturesForAddress(depositPubkey, { limit: 1 });
          const txSig = sigs[0]?.signature ?? null;
          await supabase
            .from("orders")
            .update({
              payment_status: "confirmed",
              order_status: "paid",
              payment_confirmed_at: new Date().toISOString(),
              transaction_signature: txSig,
            })
            .eq("id", order.id);
          await supabase.from("payment_events").insert({
            order_id: order.id,
            event_type: "payment_confirmed",
            new_status: "confirmed",
            amount: Number(order.crypto_amount),
            currency: "SOL",
            transaction_signature: txSig ?? "",
            source: "sweep-payments",
            details: { balance_lamports: balance, expected_lamports: expectedLamports },
          });
        }

        const sweepAmount = balance - TOTAL_TX_FEE_LAMPORTS;
        if (sweepAmount <= 0) {
          results.push({ order_id: order.id, status: "confirmed_no_sweep", balance });
          continue;
        }

        const { key } = derivePath(`m/44'/501'/${order.derivation_index}'/0'`, seedHex);
        const kp = Keypair.fromSeed(key);

        let lastError: unknown = null;
        let sentSig: string | null = null;

        for (let attempt = 1; attempt <= MAX_SEND_RETRIES; attempt++) {
          try {
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
            const tx = new Transaction({ feePayer: kp.publicKey, blockhash, lastValidBlockHeight });
            tx.add(
              ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNIT_LIMIT }),
              ComputeBudgetProgram.setComputeUnitPrice({ microLamports: COMPUTE_UNIT_PRICE_MICROLAMPORTS }),
              SystemProgram.transfer({
                fromPubkey: kp.publicKey,
                toPubkey: mainPubkey,
                lamports: sweepAmount,
              }),
            );
            tx.sign(kp);
            const sig = await connection.sendRawTransaction(tx.serialize(), {
              skipPreflight: false,
              maxRetries: 5,
            });
            await connection.confirmTransaction(
              { signature: sig, blockhash, lastValidBlockHeight },
              "confirmed",
            );
            sentSig = sig;
            break;
          } catch (e) {
            lastError = e;
            if (attempt < MAX_SEND_RETRIES) await sleep(1500 * attempt);
          }
        }

        if (!sentSig) {
          throw lastError instanceof Error ? lastError : new Error(String(lastError));
        }

        await supabase
          .from("orders")
          .update({ swept_at: new Date().toISOString(), sweep_signature: sentSig })
          .eq("id", order.id);

        await supabase.from("payment_events").insert({
          order_id: order.id,
          event_type: "funds_swept",
          new_status: "swept",
          amount: sweepAmount / LAMPORTS_PER_SOL,
          currency: "SOL",
          transaction_signature: sentSig,
          source: "sweep-payments",
          details: { to: mainPubkey.toBase58(), from: kp.publicKey.toBase58() },
        });

        results.push({ order_id: order.id, status: "swept", signature: sentSig, amount: sweepAmount });
      } catch (innerErr) {
        const message = innerErr instanceof Error ? innerErr.message : String(innerErr);
        await supabase.from("payment_events").insert({
          order_id: order.id,
          event_type: "sweep_failed",
          new_status: "error",
          amount: 0,
          currency: "SOL",
          transaction_signature: "",
          source: "sweep-payments",
          details: { error: message },
        });
        results.push({ order_id: order.id, status: "error", error: message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
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
