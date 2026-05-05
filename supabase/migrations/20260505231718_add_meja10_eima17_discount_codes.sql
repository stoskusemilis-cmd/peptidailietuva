/*
  # Add new employee discount codes

  1. New Codes
    - MEJA10 - 10% discount, 20% referral commission
    - EIMA17 - 10% discount, 20% referral commission

  2. Notes
    - Active by default, no usage limit, no expiry
    - Uses ON CONFLICT so the migration is safely re-runnable
*/

INSERT INTO discount_codes (code, discount_percent, is_active, max_uses, usage_count, referral_commission_percent)
VALUES
  ('MEJA10', 10, true, NULL, 0, 20),
  ('EIMA17', 10, true, NULL, 0, 20)
ON CONFLICT (code) DO UPDATE SET
  discount_percent = EXCLUDED.discount_percent,
  is_active = EXCLUDED.is_active,
  referral_commission_percent = EXCLUDED.referral_commission_percent;
