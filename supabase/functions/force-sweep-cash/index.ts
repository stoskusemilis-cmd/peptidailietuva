import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Buffer } from "node:buffer";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { mnemonicToSeed } from "npm:bip39@3.1.0";
import { derivePath } from "npm:ed25519-hd-key@1.3.0";
import {
  Keypair,
  PublicKey,
  Transaction,
  ComputeBudgetProgram,
  TransactionInstruction,
} from "npm:@solana/web3.js@1.87.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CASH_MINT = new PublicKey("CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getAssociatedTokenAddress(owner: PublicKey, mint: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return address;
}

function createTransferCheckedInstruction(
  source: PublicKey,
  mint: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: bigint,
  decimals: number,
): TransactionInstruction {
  const data = Buffer.alloc(1 + 8 + 1);
  data.writeUInt8(12, 0); // TransferChecked instruction
  data.writeBigUInt64LE(amount, 1);
  data.writeUInt8(decimals, 9);
  return new TransactionInstruction({
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    programId: TOKEN_2022_PROGRAM_ID,
    data,
  });
}

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

    const body = await req.json();
    const { derivation_index } = body;

    if (typeof derivation_index !== "number") {
      throw new Error("derivation_index is required");
    }

    const { data: mainWallet } = await supabase.rpc("get_vault_secret", { p_name: "MAIN_WALLET_ADDRESS" });
    if (!mainWallet) throw new Error("MAIN_WALLET_ADDRESS not set");
    const mainPubkey = new PublicKey(mainWallet as string);

    const { data: seedData } = await supabase.rpc("get_vault_secret", { p_name: "MASTER_SEED_MNEMONIC" });
    if (!seedData) throw new Error("MASTER_SEED_MNEMONIC not set");
    const seed = await mnemonicToSeed(seedData as string);
    const seedHex = seed.toString("hex");

    const { key } = derivePath(`m/44'/501'/${derivation_index}'/0'`, seedHex);
    const depositKp = Keypair.fromSeed(key);

    const sourceAta = getAssociatedTokenAddress(depositKp.publicKey, CASH_MINT);
    const destAta = getAssociatedTokenAddress(mainPubkey, CASH_MINT);

    const tokenAccountInfo = await rpc("getTokenAccountBalance", [sourceAta.toBase58()]);
    if (!tokenAccountInfo?.value) {
      return new Response(JSON.stringify({
        ok: false,
        reason: "no_cash_account",
        deposit_address: depositKp.publicKey.toBase58(),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const cashAmount = BigInt(tokenAccountInfo.value.amount);
    if (cashAmount <= 0n) {
      return new Response(JSON.stringify({
        ok: false,
        reason: "zero_balance",
        deposit_address: depositKp.publicKey.toBase58(),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let sentSig: string | null = null;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const bh = await rpc("getLatestBlockhash", [{ commitment: "finalized" }]);
        const blockhash: string = bh.value.blockhash;
        const lastValidBlockHeight: number = bh.value.lastValidBlockHeight;

        const tx = new Transaction({
          feePayer: depositKp.publicKey,
          blockhash,
          lastValidBlockHeight,
        });

        tx.add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5000 }),
        );

        tx.add(createTransferCheckedInstruction(
          sourceAta,
          CASH_MINT,
          destAta,
          depositKp.publicKey,
          cashAmount,
          6,
        ));

        tx.sign(depositKp);

        const rawTx = tx.serialize();
        const rawTxB64 = btoa(String.fromCharCode(...rawTx));

        const sig: string = await rpc("sendTransaction", [
          rawTxB64,
          { skipPreflight: false, encoding: "base64", maxRetries: 0 },
        ]);

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
            try {
              await rpc("sendTransaction", [rawTxB64, { skipPreflight: true, encoding: "base64", maxRetries: 0 }]);
            } catch {}
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

    const uiAmount = Number(cashAmount) / 1_000_000;

    return new Response(JSON.stringify({
      ok: true,
      signature: sentSig,
      amount_cash: uiAmount,
      from: depositKp.publicKey.toBase58(),
      to: mainPubkey.toBase58(),
      dest_ata: destAta.toBase58(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
