/*
  # Add Discount Codes Table

  1. New Tables
    - `discount_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique) — stored uppercase for lookup
      - `discount_percent` (integer) — e.g. 10 for 10% off
      - `is_active` (boolean) — can be deactivated
      - `usage_count` (integer) — how many times used
      - `created_at` (timestamptz)

  2. Seed Data
    - GODA10 — 10% off
    - JUSTAS10 — 10% off
    - FTUZEY5 — 5% off
    - AUSTE10 — 10% off

  3. Security
    - Enable RLS
    - Allow anonymous users to SELECT (to validate codes at checkout)
    - No write access from client
*/

CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percent integer NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active discount codes"
  ON discount_codes
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

INSERT INTO discount_codes (code, discount_percent) VALUES
  ('GODA10', 10),
  ('JUSTAS10', 10),
  ('FTUZEY5', 5),
  ('AUSTE10', 10)
ON CONFLICT (code) DO NOTHING;
