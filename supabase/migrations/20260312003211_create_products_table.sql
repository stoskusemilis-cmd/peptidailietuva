/*
  # Produktai (Products) lentelė

  1. Nauja lentelė
    - `products` - visi parduodami produktai su pilnu aprašymu, kaina, nuotraukomis
      - `id` (uuid, pirminis raktas)
      - `name` (tekstas) - produkto pavadinimas
      - `slug` (tekstas, unikalus) - URL draugiškas pavadinimas
      - `description` (tekstas) - trumpas aprašymas
      - `full_description` (tekstas) - pilnas aprašymas
      - `price` (skaičius) - bazinė kaina EUR
      - `stock` (sveikasis skaičius) - kiekis sandėlyje
      - `image_url` (tekstas) - nuotraukos URL
      - `is_active` (loginis) - ar produktas aktyvus
      - `display_order` (sveikasis skaičius) - rodymo eilė
      - `created_at` / `updated_at` - laiko žymės

  2. `product_price_tiers` - kainų pakopos (kiekio nuolaidos)
    - `id`, `product_id`, `quantity`, `price`

  3. Saugumas
    - RLS įjungtas
    - Visi gali skaityti aktyvius produktus
    - Tik autentifikuoti gali redaguoti
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  full_description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  stock integer DEFAULT 100,
  image_url text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visi gali skaityti produktus"
  ON products FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Autentifikuoti gali redaguoti produktus"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Autentifikuoti gali prideti produktus"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS product_price_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10,2) NOT NULL CHECK (price > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, quantity)
);

ALTER TABLE product_price_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visi gali skaityti kainų pakopas"
  ON product_price_tiers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Autentifikuoti gali redaguoti kainų pakopas"
  ON product_price_tiers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Autentifikuoti gali atnaujinti kainų pakopas"
  ON product_price_tiers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
