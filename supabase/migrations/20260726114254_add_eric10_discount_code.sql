/*
  # Add ERIC10 discount code

  1. New Code
    - ERIC10 - 10% discount for the customer, 20% referral commission for the employee
    - Active by default, no usage limit, no expiry

  2. Notes
    - Uses ON CONFLICT so the migration is safely re-runnable
*/

INSERT INTO discount_codes (code, discount_percent, is_active, max_uses, usage_count, referral_commission_percent)
VALUES ('ERIC10', 10, true, NULL, 0, 20)
ON CONFLICT (code) DO UPDATE SET
  discount_percent = EXCLUDED.discount_percent,
  is_active = EXCLUDED.is_active,
  referral_commission_percent = EXCLUDED.referral_commission_percent;
