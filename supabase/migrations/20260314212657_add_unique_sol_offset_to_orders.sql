/*
  # Add unique_sol_offset to orders table

  ## Purpose
  When multiple customers place orders simultaneously, they may have the same SOL
  payment amount. To uniquely identify each payment on the blockchain, each order
  receives a small unique micro-offset (0.0001 to 0.0009 SOL) added to their total.
  This offset is stored so the verification system can match the exact expected amount.

  ## Changes
  - `orders` table: add `unique_sol_offset` column (numeric, 8 decimal places)
    - Stores the micro-offset added to distinguish this order from others with the same base amount
    - Default 0 for backwards compatibility with existing orders

  ## Notes
  - The offset range is 0.0001–0.0009 SOL (~0.01–0.09 EUR at typical prices)
  - Combined with the locked SOL rate, this ensures we always receive at least the correct EUR amount
  - The verification function will match against (base_sol + unique_offset)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'unique_sol_offset'
  ) THEN
    ALTER TABLE orders ADD COLUMN unique_sol_offset numeric(20,8) DEFAULT 0;
  END IF;
END $$;
