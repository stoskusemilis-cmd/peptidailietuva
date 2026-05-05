import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

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
    const { order_id, type } = await req.json();
    const isPaymentConfirmed = type === "payment_confirmed";
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select("*, parcel_lockers(*)")
      .eq("id", order_id)
      .maybeSingle();

    if (error || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const details = order.full_order_details || {};
    const items: Array<{ product_name: string; quantity: number; price: number; line_total: number }> = details.items || order.order_items || [];
    const pricing = details.pricing || {};
    const locker = details.parcel_locker || (order.parcel_lockers ? { provider: order.parcel_lockers.provider, address: order.parcel_lockers.address, locker_code: order.parcel_lockers.locker_code } : null);

    const itemsHtml = items.map((item) =>
      `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #1e3a5f;">${escapeHtml(item.product_name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e3a5f;text-align:center;">${escapeHtml(item.quantity)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e3a5f;text-align:right;">${Number(item.price || 0).toFixed(2)}€</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e3a5f;text-align:right;">${Number(item.line_total || (item.price * item.quantity) || 0).toFixed(2)}€</td>
      </tr>`
    ).join("");

    const discountRow = pricing.discount_code
      ? `<tr><td colspan="3" style="padding:6px 12px;color:#4ade80;">Nuolaida (${escapeHtml(pricing.discount_code)}, ${escapeHtml(pricing.discount_percent)}%):</td><td style="padding:6px 12px;text-align:right;color:#4ade80;">-${Number(pricing.discount_amount_eur || 0).toFixed(2)}€</td></tr>`
      : "";

    const shippingLabel = Number(pricing.shipping_fee_eur || order.full_order_details?.pricing?.shipping_fee_eur || 0) === 0
      ? "NEMOKAMAS"
      : `${Number(pricing.shipping_fee_eur || 0).toFixed(2)}€`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#070f1a;font-family:Arial,sans-serif;color:#e2e8f0;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;font-weight:900;color:#fff;margin:0;">PEPTIDAI <span style="color:#22d3ee;">LIETUVA</span></h1>
      <p style="color:#64748b;font-size:13px;margin:4px 0 0;">${isPaymentConfirmed ? 'Mokėjimas gautas ir patvirtintas' : 'Naujas užsakymas gautas'}</p>
    </div>

    ${isPaymentConfirmed ? `
    <div style="background:#052e16;border:2px solid #16a34a;border-radius:16px;padding:20px;margin-bottom:20px;text-align:center;">
      <p style="margin:0 0 4px;font-size:22px;font-weight:900;color:#4ade80;">MOKEJIMAS PATVIRTINTAS</p>
      <p style="margin:0;color:#86efac;font-size:14px;">Uzsakymas #${order.order_number} — tikslus mokejimas gautas</p>
    </div>` : ''}

    <div style="background:#0a1929;border:1px solid #1e3a5f;border-radius:16px;padding:24px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h2 style="margin:0;font-size:18px;color:#22d3ee;">Užsakymas #${order.order_number}</h2>
        <span style="background:${isPaymentConfirmed ? '#16a34a' : '#1e3a5f'};color:${isPaymentConfirmed ? '#bbf7d0' : '#93c5fd'};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;">${isPaymentConfirmed ? 'APMOKETA' : 'NAUJAS'}</span>
      </div>
      <p style="margin:0;color:#94a3b8;font-size:13px;">${new Date(order.created_at).toLocaleString("lt-LT", { timeZone: "Europe/Vilnius" })}</p>
    </div>

    <div style="background:#0a1929;border:1px solid #1e3a5f;border-radius:16px;padding:24px;margin-bottom:20px;">
      <h3 style="margin:0 0 16px;font-size:15px;color:#22d3ee;text-transform:uppercase;letter-spacing:1px;">Kliento informacija</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#64748b;width:140px;">Telefonas:</td><td style="padding:6px 0;color:#fff;font-weight:600;">${escapeHtml(order.customer_phone) || "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Miestas:</td><td style="padding:6px 0;color:#fff;">${escapeHtml(order.customer_city) || "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Paštomatas:</td><td style="padding:6px 0;color:#fff;">${locker ? `${escapeHtml(locker.provider)} — ${escapeHtml(locker.address)}${locker.locker_code ? ` (kodas: ${escapeHtml(locker.locker_code)})` : ""}` : "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Nuolaidos kodas:</td><td style="padding:6px 0;${pricing.discount_code ? 'color:#4ade80;font-weight:700;' : 'color:#fff;'}">${escapeHtml(pricing.discount_code) || "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Mokėjimo būdas:</td><td style="padding:6px 0;color:#fff;">${escapeHtml(details.payment_method) || "—"}</td></tr>
      </table>
    </div>

    <div style="background:#0a1929;border:1px solid #1e3a5f;border-radius:16px;padding:24px;margin-bottom:20px;">
      <h3 style="margin:0 0 16px;font-size:15px;color:#22d3ee;text-transform:uppercase;letter-spacing:1px;">Užsakyti produktai</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#0d2137;">
            <th style="padding:8px 12px;text-align:left;color:#64748b;font-weight:600;">Produktas</th>
            <th style="padding:8px 12px;text-align:center;color:#64748b;font-weight:600;">Kiekis</th>
            <th style="padding:8px 12px;text-align:right;color:#64748b;font-weight:600;">Vnt. kaina</th>
            <th style="padding:8px 12px;text-align:right;color:#64748b;font-weight:600;">Suma</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr><td colspan="3" style="padding:8px 12px;color:#94a3b8;border-top:2px solid #1e3a5f;">Produktų suma:</td><td style="padding:8px 12px;text-align:right;border-top:2px solid #1e3a5f;color:#fff;">${Number(pricing.subtotal_eur || order.subtotal_amount || 0).toFixed(2)}€</td></tr>
          ${discountRow}
          <tr><td colspan="3" style="padding:6px 12px;color:#94a3b8;">Pristatymas:</td><td style="padding:6px 12px;text-align:right;color:#fff;">${shippingLabel}</td></tr>
          <tr style="background:#0d2137;"><td colspan="3" style="padding:10px 12px;color:#22d3ee;font-weight:700;font-size:16px;">VISO:</td><td style="padding:10px 12px;text-align:right;color:#22d3ee;font-weight:700;font-size:16px;">${Number(order.total_amount || 0).toFixed(2)}€</td></tr>
          <tr><td colspan="3" style="padding:6px 12px;color:#64748b;font-size:12px;">SOL suma:</td><td style="padding:6px 12px;text-align:right;color:#93c5fd;font-family:monospace;">${Number(order.crypto_amount || 0).toFixed(4)} SOL</td></tr>
        </tfoot>
      </table>
    </div>

    ${pricing.discount_code && pricing.commission_percent ? `
    <div style="background:#052e16;border:1px solid #166534;border-radius:12px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 10px;color:#4ade80;font-weight:700;">Panaudotas nuolaidos kodas: ${escapeHtml(pricing.discount_code)} (${escapeHtml(pricing.discount_percent)}% nuolaida, sutaupyta ${Number(pricing.discount_amount_eur || 0).toFixed(2)}€)</p>
      <div style="border-top:1px solid #166534;padding-top:10px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr>
            <td style="padding:4px 0;color:#86efac;">Galutinė suma (su nuolaida):</td>
            <td style="padding:4px 0;text-align:right;color:#fff;font-weight:700;">${Number(order.total_amount || 0).toFixed(2)}€</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#fca5a5;">Komisinis (${pricing.commission_percent}% nuo galutinės):</td>
            <td style="padding:4px 0;text-align:right;color:#fca5a5;font-weight:700;">-${(Number(order.total_amount || 0) * Number(pricing.commission_percent) / 100).toFixed(2)}€</td>
          </tr>
          <tr style="border-top:1px solid #166534;">
            <td style="padding:6px 0 0;color:#86efac;font-weight:700;">Jums lieka:</td>
            <td style="padding:6px 0 0;text-align:right;color:#4ade80;font-weight:900;font-size:15px;">${(Number(order.total_amount || 0) * (1 - Number(pricing.commission_percent) / 100)).toFixed(2)}€</td>
          </tr>
        </table>
      </div>
    </div>` : ""}

    <div style="background:#0a1929;border:1px solid #1e3a5f;border-radius:16px;padding:20px;margin-bottom:20px;">
      <h3 style="margin:0 0 12px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Solana mokėjimo informacija</h3>
      <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">Mokėjimo statusas: <span style="color:${order.payment_status === 'confirmed' || order.payment_status === 'paid' ? '#4ade80' : '#fbbf24'};font-weight:700;">${order.payment_status === 'confirmed' || order.payment_status === 'paid' ? 'PATVIRTINTAS' : 'LAUKIAMA'}</span></p>
      <p style="margin:0 0 6px;color:#64748b;font-size:12px;">Unikalus depozito adresas (į jį klientas siuntė SOL):</p>
      <p style="margin:0 0 10px;color:#22d3ee;font-size:12px;font-family:monospace;word-break:break-all;background:#0d2137;padding:8px 10px;border-radius:6px;border:1px solid #1e3a5f;">${escapeHtml(order.deposit_address) || "—"}</p>
      ${order.transaction_signature ? `<p style="margin:0 0 6px;color:#64748b;font-size:12px;">Transakcijos parašas:</p><p style="margin:0 0 10px;color:#93c5fd;font-size:11px;font-family:monospace;word-break:break-all;"><a href="https://solscan.io/tx/${escapeHtml(order.transaction_signature)}" style="color:#93c5fd;">${escapeHtml(order.transaction_signature)}</a></p>` : ''}
      <p style="margin:0;color:#64748b;font-size:11px;font-family:monospace;word-break:break-all;">Pagrindinė piniginė: A8CDFpdaLuzfZWDX2xbCXf8nXSJpz3K5urqTPGL126ai</p>
    </div>

    <div style="text-align:center;color:#334155;font-size:11px;margin-top:24px;">
      <p style="margin:0;">Peptidai Lietuva &bull; peptidailietuva@gmail.com &bull; <a href="https://t.me/Peptidai" style="color:#22d3ee;">@Peptidai</a></p>
    </div>
  </div>
</body>
</html>`;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set — skipping email send. Order:", order.order_number);
      return new Response(JSON.stringify({ sent: false, reason: "RESEND_API_KEY not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailController = new AbortController();
    const emailTimeout = setTimeout(() => emailController.abort(), 15000);
    let emailRes: Response;
    try {
      emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Peptidai Lietuva <onboarding@resend.dev>",
          to: ["peptidailietuva@gmail.com"],
          subject: isPaymentConfirmed
            ? `APMOKETA #${order.order_number} — ${Number(order.total_amount).toFixed(2)}€ gauta!`
            : `Naujas užsakymas #${order.order_number} — ${Number(order.total_amount).toFixed(2)}€`,
          html: htmlBody,
        }),
        signal: emailController.signal,
      });
    } finally {
      clearTimeout(emailTimeout);
    }

    const emailData = await emailRes.json();

    return new Response(JSON.stringify({ sent: emailRes.ok, resend: emailData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-order-email error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
