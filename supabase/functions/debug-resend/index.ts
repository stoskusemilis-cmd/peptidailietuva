import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: Record<string, unknown> = {};

  // Check verified domains
  try {
    const domainsRes = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    results.domains = {
      status: domainsRes.status,
      data: await domainsRes.json(),
    };
  } catch (e) {
    results.domains_error = String(e);
  }

  // Check email status for the last sent email
  const emailId = "30f2cae7-f49f-4214-b7ca-09be6db20007";
  try {
    const emailRes = await fetch(`https://api.resend.com/emails/${emailId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    results.email_status = {
      status: emailRes.status,
      data: await emailRes.json(),
    };
  } catch (e) {
    results.email_error = String(e);
  }

  // Try sending a test email to peptidailietuva@gmail.com
  try {
    const testRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Peptidai Lietuva <onboarding@resend.dev>",
        to: ["peptidailietuva@gmail.com"],
        subject: "TEST — patikrinimas",
        text: "Tai testinis laiškas. Jei gaunate, el. paštas veikia.",
      }),
    });
    results.test_send = {
      status: testRes.status,
      data: await testRes.json(),
    };
  } catch (e) {
    results.test_send_error = String(e);
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
