/*
  # Nuolaidų kodų schemos taisymas ir duomenų įkėlimas

  Esamo projekto discount_codes lentelė naudoja 'percent' ir 'referral_commission' stulpelius,
  tačiau svetainės kodas tikisi 'discount_percent' ir 'referral_commission_percent'.
  
  Pervardijame stulpelius ir įkeliame tikrus nuolaidų kodus.
*/

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discount_codes' AND column_name = 'percent') THEN
    ALTER TABLE discount_codes RENAME COLUMN percent TO discount_percent;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discount_codes' AND column_name = 'referral_commission') THEN
    ALTER TABLE discount_codes RENAME COLUMN referral_commission TO referral_commission_percent;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discount_codes' AND column_name = 'current_uses') THEN
    ALTER TABLE discount_codes RENAME COLUMN current_uses TO usage_count;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discount_codes' AND column_name = 'max_uses') THEN
    ALTER TABLE discount_codes ADD COLUMN max_uses integer DEFAULT NULL;
  END IF;
END $$;

INSERT INTO discount_codes (code, discount_percent, is_active, max_uses, usage_count, referral_commission_percent)
VALUES
  ('GODA10',   10, true, NULL, 0, 20),
  ('JUSTAS10', 10, true, NULL, 7, 20),
  ('AUSTE10',  10, true, NULL, 1, 20),
  ('FTUZEY5',   5, true, NULL, 3, 25)
ON CONFLICT (code) DO UPDATE SET
  discount_percent = EXCLUDED.discount_percent,
  is_active = EXCLUDED.is_active,
  usage_count = EXCLUDED.usage_count,
  referral_commission_percent = EXCLUDED.referral_commission_percent;
