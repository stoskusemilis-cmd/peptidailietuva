/*
  # Papildomos lentelės

  1. `parcel_lockers` — paštomatų sąrašas visoje Lietuvoje
    - `id`, `provider` (Omniva | LP Express | DPD), `city`, `address`, `locker_code`, `is_active`

  2. `discount_codes` — nuolaidų kodai
    - `id`, `code`, `percent`, `is_active`, `max_uses`, `current_uses`, `expires_at`
    - `referral_commission` — affiliate komisija procentais

  3. Saugumas — RLS ant visų lentelių
*/

CREATE TABLE IF NOT EXISTS parcel_lockers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('Omniva', 'LP Express', 'DPD')),
  city text NOT NULL,
  address text NOT NULL,
  locker_code text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE parcel_lockers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visi gali skaityti paštomates"
  ON parcel_lockers FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Autentifikuoti gali valdyti paštomates"
  ON parcel_lockers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Autentifikuoti gali atnaujinti paštomates"
  ON parcel_lockers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  percent integer NOT NULL CHECK (percent > 0 AND percent <= 100),
  is_active boolean DEFAULT true,
  max_uses integer DEFAULT NULL,
  current_uses integer DEFAULT 0,
  expires_at timestamptz DEFAULT NULL,
  referral_commission integer DEFAULT 0 CHECK (referral_commission >= 0 AND referral_commission <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visi gali tikrinti nuolaidų kodus"
  ON discount_codes FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Autentifikuoti gali valdyti nuolaidų kodus"
  ON discount_codes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Autentifikuoti gali atnaujinti nuolaidų kodus"
  ON discount_codes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION increment_discount_usage(p_code text)
RETURNS void AS $$
BEGIN
  UPDATE discount_codes
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE code = p_code AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
