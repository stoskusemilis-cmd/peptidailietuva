/*
  # Add transaction_signature to orders

  1. Changes
    - Add `transaction_signature` column (text, nullable) to orders table
      - Stores the Solana transaction signature once payment is confirmed on-chain
    - Add `payment_confirmed_at` column (timestamptz, nullable)
      - Records when payment was automatically confirmed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'transaction_signature'
  ) THEN
    ALTER TABLE orders ADD COLUMN transaction_signature text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_confirmed_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_confirmed_at timestamptz;
  END IF;
END $$;
