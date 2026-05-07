/*
  # Add ROZE10 discount code

  1. Changes
    - Inserts new referral discount code `ROZE10`
      - 10% discount for the customer
      - 2% referral commission
      - Active, no max uses

  2. Notes
    - Uses ON CONFLICT to be idempotent
*/

INSERT INTO discount_codes (code, discount_percent, referral_commission_percent, is_active, usage_count)
VALUES ('ROZE10', 10, 2, true, 0)
ON CONFLICT (code) DO UPDATE
  SET discount_percent = EXCLUDED.discount_percent,
      referral_commission_percent = EXCLUDED.referral_commission_percent,
      is_active = true;
