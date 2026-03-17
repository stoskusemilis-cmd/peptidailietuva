/*
  # Create Parcel Lockers Table

  ## Description
  Creates a table to store parcel locker locations for delivery services in Lithuania

  ## New Tables
    - `parcel_lockers`
      - `id` (uuid, primary key) - Unique identifier for each locker
      - `provider` (text) - Service provider: 'DPD', 'LP Express', 'Omniva'
      - `city` (text) - City where the locker is located
      - `address` (text) - Full address of the locker
      - `locker_code` (text) - Unique code for the locker location
      - `is_active` (boolean) - Whether the locker is currently available
      - `created_at` (timestamptz) - Timestamp when record was created
      - `updated_at` (timestamptz) - Timestamp when record was last updated

  ## Security
    - Enable RLS on `parcel_lockers` table
    - Add policy for anyone to view active lockers (public access for checkout)

  ## Notes
    - This table contains public information about parcel locker locations
    - Data will be populated with major cities in Lithuania: Vilnius, Kaunas, Klaipėda, Šiauliai, Panevėžys
*/

CREATE TABLE IF NOT EXISTS parcel_lockers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('DPD', 'LP Express', 'Omniva')),
  city text NOT NULL,
  address text NOT NULL,
  locker_code text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE parcel_lockers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active parcel lockers"
  ON parcel_lockers
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_parcel_lockers_city ON parcel_lockers(city);
CREATE INDEX IF NOT EXISTS idx_parcel_lockers_provider ON parcel_lockers(provider);
CREATE INDEX IF NOT EXISTS idx_parcel_lockers_active ON parcel_lockers(is_active);
