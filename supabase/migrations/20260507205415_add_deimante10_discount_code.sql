/*
  # Add DEIMANTE10 discount code

  1. Changes
    - Insert new discount code `DEIMANTE10` with 10% discount and 20% referral commission
    - Active by default, no max uses limit
*/

INSERT INTO discount_codes (code, discount_percent, referral_commission_percent, is_active)
VALUES ('DEIMANTE10', 10, 20, true)
ON CONFLICT (code) DO UPDATE
  SET discount_percent = EXCLUDED.discount_percent,
      referral_commission_percent = EXCLUDED.referral_commission_percent,
      is_active = true;
