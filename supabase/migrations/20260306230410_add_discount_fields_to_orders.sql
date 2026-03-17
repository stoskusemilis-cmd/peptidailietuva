/*
  # Add Discount Fields to Orders Table

  1. Modified Tables
    - `orders`
      - `discount_code` (text, nullable) — the code used
      - `discount_percent` (integer, nullable) — percentage applied
      - `discount_amount` (numeric, nullable) — EUR amount saved
      - `subtotal_amount` (numeric, nullable) — amount before discount + shipping
      - `full_order_details` (jsonb, nullable) — complete snapshot: items, locker, city, phone, pricing breakdown

  2. Notes
    - full_order_details stores everything needed for admin review
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_code') THEN
    ALTER TABLE orders ADD COLUMN discount_code text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_percent') THEN
    ALTER TABLE orders ADD COLUMN discount_percent integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
    ALTER TABLE orders ADD COLUMN discount_amount numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal_amount') THEN
    ALTER TABLE orders ADD COLUMN subtotal_amount numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'full_order_details') THEN
    ALTER TABLE orders ADD COLUMN full_order_details jsonb;
  END IF;
END $$;
