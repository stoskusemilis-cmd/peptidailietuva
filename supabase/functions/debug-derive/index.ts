import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { mnemonicToSeed } from "npm:bip39@3.1.0";
import { derivePath } from "npm:ed25519-hd-key@1.3.0";
import { Keypair } from "npm:@solana/web3.js@1.98.4";

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
    const { target_address, start_index, end_index } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: seedData } = await supabase.rpc("get_vault_secret", { p_name: "MASTER_SEED_MNEMONIC" });
    if (!seedData) throw new Error("MASTER_SEED_MNEMONIC not set");

    const seed = await mnemonicToSeed(seedData as string);
    const seedHex = seed.toString("hex");

    const startIdx = start_index ?? 0;
    const endIdx = end_index ?? 200;
    const results: { index: number; address: string }[] = [];
    let foundIndex = -1;

    for (let i = startIdx; i <= endIdx; i++) {
      const path = `m/44'/501'/${i}'/0'`;
      const { key } = derivePath(path, seedHex);
      const kp = Keypair.fromSeed(key);
      const addr = kp.publicKey.toBase58();

      if (target_address && addr === target_address) {
        foundIndex = i;
        break;
      }

      if (!target_address || i <= startIdx + 5) {
        results.push({ index: i, address: addr });
      }
    }

    // Also try alternative derivation paths
    const altPaths = [
      `m/44'/501'/0'/${target_address ? 0 : 0}'`,
      `m/44'/501'/0'/0`,
    ];
    const altResults: { path: string; addresses: string[] }[] = [];

    if (target_address) {
      // Try m/44'/501'/X' (without /0')
      for (let i = startIdx; i <= endIdx; i++) {
        const path = `m/44'/501'/${i}'`;
        const { key } = derivePath(path, seedHex);
        const kp = Keypair.fromSeed(key);
        if (kp.publicKey.toBase58() === target_address) {
          foundIndex = i;
          results.push({ index: i, address: `FOUND with path m/44'/501'/${i}'` });
          break;
        }
      }
    }

    return new Response(JSON.stringify({
      found: foundIndex >= 0,
      found_index: foundIndex,
      seed_length: seed.length,
      seed_hex_first8: seedHex.substring(0, 8),
      mnemonic_words: (seedData as string).trim().split(/\s+/).length,
      sample_addresses: results.slice(0, 10),
    }), {
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
