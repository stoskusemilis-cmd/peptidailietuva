/*
  # Add VASARA15 discount code

  1. Changes
    - Insert new discount code `VASARA15` with 15% discount, no referral commission
    - Active by default, no max_uses limit (applies to all products via existing checkout logic)
*/

INSERT INTO discount_codes (code, discount_percent, referral_commission_percent, is_active)
VALUES ('VASARA15', 15, 0, true)
ON CONFLICT (code) DO UPDATE
  SET discount_percent = EXCLUDED.discount_percent,
      referral_commission_percent = EXCLUDED.referral_commission_percent,
      is_active = true;
