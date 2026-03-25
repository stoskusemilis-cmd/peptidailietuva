import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SOLANA_ADDRESS = "A8CDFpdaLuzfZWDX2xbCXf8nXSJpz3K5urqTPGL126ai";
const LAMPORTS_PER_SOL = 1_000_000_000;
const RPC_URL = "https://api.mainnet-beta.solana.com";

async function rpcFetch(body: object): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { target_sol, limit = 100 } = await req.json();

    const sigRes = await rpcFetch({
      jsonrpc: "2.0",
      id: 1,
      method: "getSignaturesForAddress",
      params: [SOLANA_ADDRESS, { limit }],
    });
    const sigData = await sigRes.json();
    const allSigs: Array<{ signature: string; blockTime: number | null; err: null | object }> = sigData?.result ?? [];

    const targetNum = parseFloat(target_sol);
    const results = [];

    for (const sig of allSigs) {
      if (sig.err !== null) continue;

      const txRes = await rpcFetch({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [sig.signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
      });
      const txData = await txRes.json();
      const tx = txData?.result;
      if (!tx) continue;

      const accountKeys: string[] = tx.transaction?.message?.accountKeys?.map(
        (k: { pubkey?: string } | string) => (typeof k === "string" ? k : k.pubkey ?? "")
      ) ?? [];
      const recipientIndex = accountKeys.indexOf(SOLANA_ADDRESS);
      if (recipientIndex === -1) continue;

      const preBalances: number[] = tx.meta?.preBalances ?? [];
      const postBalances: number[] = tx.meta?.postBalances ?? [];
      const receivedSol = ((postBalances[recipientIndex] ?? 0) - (preBalances[recipientIndex] ?? 0)) / LAMPORTS_PER_SOL;

      if (receivedSol < 0.01) continue;

      const diff = Math.abs(receivedSol - targetNum);
      results.push({
        signature: sig.signature,
        blockTimeISO: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
        receivedSol,
        diff,
        match: diff <= 0.0005,
      });
    }

    results.sort((a, b) => a.diff - b.diff);

    return new Response(JSON.stringify({
      totalSigsScanned: allSigs.length,
      oldestTime: allSigs.length > 0 ? new Date((allSigs[allSigs.length - 1].blockTime ?? 0) * 1000).toISOString() : null,
      newestTime: allSigs.length > 0 ? new Date((allSigs[0].blockTime ?? 0) * 1000).toISOString() : null,
      significantTransactions: results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
