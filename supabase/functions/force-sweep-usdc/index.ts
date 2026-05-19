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

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

const COMPUTE_UNIT_LIMIT = 50_000;
const COMPUTE_UNIT_PRICE_MICROLAMPORTS = 5000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getAssociatedTokenAddress(owner: PublicKey, mint: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return address;
}

function createTransferInstruction(
  source: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: bigint,
): TransactionInstruction {
  const data = Buffer.alloc(9);
  data.writeUInt8(3, 0); // Transfer instruction index
  data.writeBigUInt64LE(amount, 1);
  return new TransactionInstruction({
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    programId: TOKEN_PROGRAM_ID,
    data,
  });
}

function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  associatedToken: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
): TransactionInstruction {
  return new TransactionInstruction({
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedToken, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: new PublicKey("11111111111111111111111111111111"), isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.alloc(0),
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

    let body: { deposit_address?: string; order_id?: string } = {};
    try { body = await req.json(); } catch {}

    if (!body.deposit_address && !body.order_id) {
      throw new Error("deposit_address or order_id required");
    }

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

    const { data: order } = await q.maybeSingle();
    if (!order) throw new Error("order not found");

    const depositPubkey = new PublicKey(order.deposit_address as string);
    const sourceAta = getAssociatedTokenAddress(depositPubkey, USDC_MINT);
    const destAta = getAssociatedTokenAddress(mainPubkey, USDC_MINT);

    // Get USDC balance of deposit address
    const tokenAccountInfo = await rpc("getTokenAccountBalance", [sourceAta.toBase58()]);
    if (!tokenAccountInfo || !tokenAccountInfo.value) {
      return new Response(JSON.stringify({ ok: false, reason: "no_usdc_account", deposit_address: order.deposit_address }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const usdcAmount = BigInt(tokenAccountInfo.value.amount);
    if (usdcAmount <= 0n) {
      return new Response(JSON.stringify({ ok: false, reason: "zero_balance", deposit_address: order.deposit_address }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Derive deposit keypair (token owner/signer)
    const { key } = derivePath(`m/44'/501'/${order.derivation_index}'/0'`, seedHex);
    const depositKp = Keypair.fromSeed(key);

    // Try multiple derivation paths to find main wallet keypair
    let mainKp: Keypair | null = null;
    const mainAddr = mainPubkey.toBase58();
    const pathsToTry = [
      `m/44'/501'/0'/0'`,
      `m/44'/501'/0'`,
      `m/44'/501'/1'/0'`,
    ];
    for (const path of pathsToTry) {
      const { key: k } = derivePath(path, seedHex);
      const candidate = Keypair.fromSeed(k);
      if (candidate.publicKey.toBase58() === mainAddr) {
        mainKp = candidate;
        break;
      }
    }
    if (!mainKp) {
      // Return debug info to figure out the correct derivation path
      const derived = pathsToTry.map((p) => {
        const { key: k } = derivePath(p, seedHex);
        return { path: p, address: Keypair.fromSeed(k).publicKey.toBase58() };
      });
      return new Response(JSON.stringify({
        ok: false,
        reason: "cannot_find_main_wallet_keypair",
        main_wallet: mainAddr,
        derived_addresses: derived,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check if destination ATA exists
    const destAccountInfo = await rpc("getAccountInfo", [destAta.toBase58(), { encoding: "base64" }]);
    const needsCreateAta = !destAccountInfo || !destAccountInfo.value;

    let sentSig: string | null = null;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const bh = await rpc("getLatestBlockhash", [{ commitment: "finalized" }]);
        const blockhash: string = bh.value.blockhash;
        const lastValidBlockHeight: number = bh.value.lastValidBlockHeight;

        // Main wallet pays the fee since deposit address has 0 SOL
        const tx = new Transaction({ feePayer: mainKp.publicKey, blockhash, lastValidBlockHeight });
        tx.add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNIT_LIMIT }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: COMPUTE_UNIT_PRICE_MICROLAMPORTS }),
        );

        if (needsCreateAta) {
          tx.add(createAssociatedTokenAccountInstruction(mainKp.publicKey, destAta, mainPubkey, USDC_MINT));
        }

        tx.add(createTransferInstruction(sourceAta, destAta, depositKp.publicKey, usdcAmount));

        tx.sign(mainKp, depositKp);
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

    const uiAmount = Number(usdcAmount) / 1_000_000;

    return new Response(JSON.stringify({
      ok: true,
      signature: sentSig,
      amount_usdc: uiAmount,
      from: order.deposit_address,
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
