/*
  # Add employee discount codes MEJA10 and EIMA17

  ## Purpose
  Add two new employee referral codes, mirroring the existing
  GODA10 / JUSTAS10 / AUSTE10 pattern:
    - 10% customer discount
    - 20% referral commission reported via order confirmation email

  ## 1. New Data
    - discount_codes row: MEJA10  (10% off, 20% commission)
    - discount_codes row: EIMA17  (10% off, 20% commission)

  ## 2. Security
    - Uses existing RLS policies on discount_codes.
    - No policy changes.
*/

INSERT INTO discount_codes (code, discount_percent, is_active, referral_commission_percent)
VALUES
  ('MEJA10', 10, true, 20),
  ('EIMA17', 10, true, 20)
ON CONFLICT (code) DO UPDATE SET
  discount_percent = EXCLUDED.discount_percent,
  is_active = true,
  referral_commission_percent = EXCLUDED.referral_commission_percent;
