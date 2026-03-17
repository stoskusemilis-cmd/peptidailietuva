/*
  # Add referral commission to discount_codes

  ## Changes
  - Adds `referral_commission_percent` column to `discount_codes` table
    - Stores the commission percentage owed to the referrer when this code is used
    - Defaults to 0
  - Updates FTUZEY5 code to have 25% referral commission
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discount_codes' AND column_name = 'referral_commission_percent'
  ) THEN
    ALTER TABLE discount_codes ADD COLUMN referral_commission_percent integer NOT NULL DEFAULT 0;
  END IF;
END $$;

UPDATE discount_codes
SET referral_commission_percent = 25
WHERE code = 'FTUZEY5';
