import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "npm:@solana/web3.js@1";
import * as bip39 from "npm:bip39@3";
import { derivePath } from "npm:ed25519-hd-key@1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { derivation_index } = await req.json();

    if (typeof derivation_index !== "number") {
      return new Response(
        JSON.stringify({ error: "derivation_index is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const rpcUrl = Deno.env.get("HELIUS_RPC_URL") || "https://api.mainnet-beta.solana.com";

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: mnemonicData, error: mnemonicError } = await supabase.rpc("get_vault_secret", { secret_name: "MASTER_SEED_MNEMONIC" });
    if (mnemonicError || !mnemonicData) {
      return new Response(
        JSON.stringify({ error: "Failed to get mnemonic", detail: mnemonicError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: mainWalletData, error: mainWalletError } = await supabase.rpc("get_vault_secret", { secret_name: "MAIN_WALLET_ADDRESS" });
    if (mainWalletError || !mainWalletData) {
      return new Response(
        JSON.stringify({ error: "Failed to get main wallet", detail: mainWalletError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mnemonic = mnemonicData.trim();
    const mainWallet = new PublicKey(mainWalletData.trim());

    const seed = await bip39.mnemonicToSeed(mnemonic);
    const path = `m/44'/501'/${derivation_index}'/0'`;
    const derived = derivePath(path, seed.toString("hex"));
    const childKeypair = Keypair.fromSeed(derived.key);

    const connection = new Connection(rpcUrl, "confirmed");
    const balance = await connection.getBalance(childKeypair.publicKey);

    if (balance === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No SOL balance to sweep",
          address: childKeypair.publicKey.toBase58(),
          balance: 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fee = 5000;
    const transferAmount = balance - fee;

    if (transferAmount <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Balance too low to cover fee",
          address: childKeypair.publicKey.toBase58(),
          balance,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: childKeypair.publicKey,
        toPubkey: mainWallet,
        lamports: transferAmount,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = childKeypair.publicKey;
    transaction.sign(childKeypair);

    const signature = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(signature, "confirmed");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sweep completed",
        from: childKeypair.publicKey.toBase58(),
        to: mainWallet.toBase58(),
        amount_lamports: transferAmount,
        amount_sol: transferAmount / LAMPORTS_PER_SOL,
        signature,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message, stack: err.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
