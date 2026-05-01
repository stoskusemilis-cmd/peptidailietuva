/*
  # Create inventory_log and payment_events tracking tables

  ## Purpose
  Full audit trail for every stock change and every payment state change,
  so each order can be reconstructed with exact timing and values. This
  data powers AI analytics, fraud detection, and stock forecasting.

  ## 1. New Tables

  ### inventory_log
  Tracks every change to a product's stock quantity.
    - `id` (uuid, primary key)
    - `product_id` (uuid) - references products(id)
    - `change_type` (text) - one of: order, restock, manual_adjustment, return, correction
    - `quantity_delta` (integer) - signed change (-3, +100, etc.)
    - `stock_before` (integer) - stock before the change
    - `stock_after` (integer) - stock after the change
    - `order_id` (uuid, nullable) - related order if change came from an order
    - `reason` (text, nullable) - free-form note
    - `metadata` (jsonb) - flexible extra data (admin id, source, etc.)
    - `created_at` (timestamptz)

  ### payment_events
  Tracks every state transition or notable event for an order's payment.
    - `id` (uuid, primary key)
    - `order_id` (uuid) - references orders(id)
    - `event_type` (text) - e.g. created, pending, checking, confirmed,
      failed, expired, refunded, amount_mismatch, signature_received
    - `previous_status` (text, nullable)
    - `new_status` (text, nullable)
    - `amount` (numeric, nullable) - amount involved in this event
    - `currency` (text, nullable) - EUR, SOL, etc.
    - `transaction_signature` (text, nullable)
    - `source` (text) - who/what triggered: system, cron, user, webhook, admin
    - `details` (jsonb) - full payload / diagnostic data
    - `created_at` (timestamptz)

  ## 2. Security
    - RLS enabled on both tables
    - No public/anon access — these are audit logs
    - Only service role (edge functions, cron jobs, admin) can read/write
    - Authenticated users cannot read or modify logs directly
    - This follows defense-in-depth: logs must never be tamperable by clients

  ## 3. Indexes
    - inventory_log: product_id, order_id, created_at
    - payment_events: order_id, event_type, created_at
    - Supports fast lookups for AI analytics and order reconstruction

  ## 4. Important Notes
    1. Both tables are append-only in spirit — application code should
       never UPDATE or DELETE rows, only INSERT new events.
    2. `stock_before` and `stock_after` make each row self-contained —
       even if the log is replayed out of order, each entry tells the
       full story.
    3. `metadata` / `details` jsonb columns allow flexible future fields
       without new migrations.
*/

CREATE TABLE IF NOT EXISTS inventory_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change_type text NOT NULL DEFAULT 'manual_adjustment',
  quantity_delta integer NOT NULL DEFAULT 0,
  stock_before integer NOT NULL DEFAULT 0,
  stock_after integer NOT NULL DEFAULT 0,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  reason text DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_log_product_id ON inventory_log(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_log_order_id ON inventory_log(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_log_created_at ON inventory_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_log_change_type ON inventory_log(change_type);

ALTER TABLE inventory_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'unknown',
  previous_status text DEFAULT '',
  new_status text DEFAULT '',
  amount numeric(20, 9) DEFAULT 0,
  currency text DEFAULT '',
  transaction_signature text DEFAULT '',
  source text NOT NULL DEFAULT 'system',
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON payment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_event_type ON payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON payment_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_events_tx_signature ON payment_events(transaction_signature);

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
