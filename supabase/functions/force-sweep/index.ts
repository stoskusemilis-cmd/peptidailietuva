import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { mnemonicToSeed } from "npm:bip39@3.1.0";
import { derivePath } from "npm:ed25519-hd-key@1.3.0";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  ComputeBudgetProgram,
} from "npm:@solana/web3.js@1.87.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LAMPORTS_PER_SOL = 1_000_000_000;
const BASE_TX_FEE_LAMPORTS = 5000;
const COMPUTE_UNIT_LIMIT = 1000;
const COMPUTE_UNIT_PRICE_MICROLAMPORTS = 1000;
const PRIORITY_FEE_LAMPORTS = Math.ceil((COMPUTE_UNIT_LIMIT * COMPUTE_UNIT_PRICE_MICROLAMPORTS) / 1_000_000);
const TOTAL_TX_FEE_LAMPORTS = BASE_TX_FEE_LAMPORTS + PRIORITY_FEE_LAMPORTS;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function rpc(method: string, params: unknown[]): Promise<any> {
  const rpcUrl = Deno.env.get("HELIUS_RPC_URL") || "https://api.mainnet-beta.solana.com";
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC ${method}: ${JSON.stringify(json.error)}`);
  return json.result;
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

    let body: { order_id?: string; deposit_address?: string } = {};
    try { body = await req.json(); } catch {}

    const { data: mainWallet } = await supabase.rpc("get_vault_secret", { p_name: "MAIN_WALLET_ADDRESS" });
    if (!mainWallet) throw new Error("MAIN_WALLET_ADDRESS not set");
    const mainPubkey = new PublicKey(mainWallet as string);

    const { data: seedData } = await supabase.rpc("get_vault_secret", { p_name: "MASTER_SEED_MNEMONIC" });
    if (!seedData) throw new Error("MASTER_SEED_MNEMONIC not set");
    const seed = await mnemonicToSeed(seedData as string);
    const seedHex = seed.toString("hex");

    let q = supabase.from("orders").select("id, order_number, deposit_address, derivation_index");
    if (body.order_id) q = q.eq("id", body.order_id);
    else if (body.deposit_address) q = q.eq("deposit_address", body.deposit_address);
    else throw new Error("order_id or deposit_address required");

    const { data: order } = await q.maybeSingle();
    if (!order) throw new Error("order not found");

    const balance: number = await rpc("getBalance", [order.deposit_address, { commitment: "confirmed" }]).then((r) => r.value);

    if (balance <= TOTAL_TX_FEE_LAMPORTS) {
      return new Response(JSON.stringify({ ok: false, reason: "dust", balance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sweepAmount = balance - TOTAL_TX_FEE_LAMPORTS;
    const { key } = derivePath(`m/44'/501'/${order.derivation_index}'/0'`, seedHex);
    const kp = Keypair.fromSeed(key);

    let sentSig: string | null = null;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const bh = await rpc("getLatestBlockhash", [{ commitment: "finalized" }]);
        const blockhash: string = bh.value.blockhash;
        const lastValidBlockHeight: number = bh.value.lastValidBlockHeight;

        const tx = new Transaction({ feePayer: kp.publicKey, blockhash, lastValidBlockHeight });
        tx.add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNIT_LIMIT }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: COMPUTE_UNIT_PRICE_MICROLAMPORTS }),
          SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: mainPubkey, lamports: sweepAmount }),
        );
        tx.sign(kp);
        const rawTx = tx.serialize();
        const rawTxB64 = btoa(String.fromCharCode(...rawTx));

        const sig: string = await rpc("sendTransaction", [rawTxB64, { skipPreflight: false, encoding: "base64", maxRetries: 0 }]);

        let landed = false;
        const deadline = Date.now() + 90_000;
        while (Date.now() < deadline) {
          await sleep(2000);
          const res = await rpc("getSignatureStatuses", [[sig], { searchTransactionHistory: true }]);
          const status = res?.value?.[0];
          if (status) {
            if (status.err) throw new Error(`tx failed: ${JSON.stringify(status.err)}`);
            if (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized") {
              landed = true;
              break;
            }
          } else {
            try { await rpc("sendTransaction", [rawTxB64, { skipPreflight: true, encoding: "base64", maxRetries: 0 }]); } catch {}
            const bhValid = await rpc("isBlockhashValid", [blockhash, { commitment: "confirmed" }]);
            if (!bhValid.value) break;
          }
        }

        if (!landed) throw new Error(`tx ${sig} did not land within timeout`);
        sentSig = sig;
        break;
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        if (attempt < 3) await sleep(2000 * attempt);
      }
    }

    if (!sentSig) {
      return new Response(JSON.stringify({ ok: false, error: lastError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("orders")
      .update({
        swept_at: new Date().toISOString(),
        sweep_signature: sentSig,
        payment_status: "confirmed",
        order_status: "paid",
        payment_confirmed_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    await supabase.from("payment_events").insert({
      order_id: order.id,
      event_type: "funds_swept",
      new_status: "swept",
      amount: sweepAmount / LAMPORTS_PER_SOL,
      currency: "SOL",
      transaction_signature: sentSig,
      source: "force-sweep",
      details: { to: mainPubkey.toBase58(), from: kp.publicKey.toBase58(), forced: true },
    });

    return new Response(JSON.stringify({
      ok: true,
      signature: sentSig,
      amount_sol: sweepAmount / LAMPORTS_PER_SOL,
      to: mainPubkey.toBase58(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
