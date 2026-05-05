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
    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: existingOrder, error: fetchErr } = await supabase
      .from("orders")
      .select("id, derivation_index, deposit_address")
      .eq("id", order_id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existingOrder) throw new Error("order not found");

    if (existingOrder.deposit_address && existingOrder.derivation_index !== null) {
      return new Response(
        JSON.stringify({
          deposit_address: existingOrder.deposit_address,
          derivation_index: existingOrder.derivation_index,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: idxData, error: idxErr } = await supabase.rpc("assign_order_derivation", {
      p_order_id: order_id,
    });
    if (idxErr) throw idxErr;
    const derivationIndex: number = Number(idxData);

    const { data: seedData, error: seedErr } = await supabase.rpc("get_vault_secret", {
      p_name: "MASTER_SEED_MNEMONIC",
    });
    if (seedErr) throw seedErr;
    if (!seedData) throw new Error("MASTER_SEED_MNEMONIC not set in vault");

    const seed = await mnemonicToSeed(seedData as string);
    const path = `m/44'/501'/${derivationIndex}'/0'`;
    const { key } = derivePath(path, seed.toString("hex"));
    const kp = Keypair.fromSeed(key);
    const depositAddress = kp.publicKey.toBase58();

    const { error: updateErr } = await supabase
      .from("orders")
      .update({ deposit_address: depositAddress })
      .eq("id", order_id);
    if (updateErr) throw updateErr;

    return new Response(
      JSON.stringify({ deposit_address: depositAddress, derivation_index: derivationIndex }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
