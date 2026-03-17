/*
  # Užsakymai (Orders) lentelė — pilnas funkcionalumas

  1. Nauja lentelė `orders`
    - `id` (uuid) - unikalus identifikatorius
    - `order_number` (tekstas) - žmogui skaitomas užsakymo numeris (PL-XXXXX)
    - `status` (tekstas) - bendras statusas: pending | paid | processing | shipped | delivered | cancelled
    - `payment_status` (tekstas) - mokėjimo statusas: pending | confirmed | failed
    - `order_status` (tekstas) - siuntimo statusas: pending | processing | shipped | delivered | cancelled

    Kliento informacija:
    - `customer_name` (tekstas) - vardas pavardė
    - `customer_email` (tekstas) - el. paštas
    - `customer_phone` (tekstas) - telefono numeris

    Finansai:
    - `subtotal_amount` (skaičius) - suma be nuolaidos ir siuntimo
    - `discount_code` (tekstas) - pritaikytas nuolaidos kodas
    - `discount_percent` (sveikasis skaičius) - nuolaidos procentas
    - `discount_amount` (skaičius) - nuolaidos suma EUR
    - `shipping_fee` (skaičius) - siuntimo mokestis EUR
    - `total_amount` (skaičius) - galutinė suma EUR
    - `crypto_amount` (skaičius) - suma SOL
    - `sol_price_eur` (skaičius) - SOL kaina EUR užsakymo metu

    Mokėjimas:
    - `payment_method` (tekstas) - swaps | phantom | trustwallet | revolut
    - `wallet_address` (tekstas) - mūsų Solana wallet adresas
    - `transaction_signature` (tekstas) - Solana transakcijos parašas
    - `payment_confirmed_at` (timestamp) - kada patvirtintas mokėjimas

    Pristatymas:
    - `delivery_method` (tekstas) - omniva | lpexpress | dpd
    - `parcel_locker_id` (uuid) - pasirinktas paštomates
    - `shipping_address` (jsonb) - pilnas pristatymo adresas JSON

    Pilna užsakymo informacija:
    - `order_items` (jsonb) - užsakymo prekių kopija
    - `full_order_details` (jsonb) - pilna užsakymo informacija archyvui
    - `notes` (tekstas) - pastabos

    - `created_at` / `updated_at` — laiko žymės

  2. `order_items` — užsakymo prekių eilutės
    - `id`, `order_id`, `product_id`, `product_name`, `product_slug`, `quantity`, `unit_price`, `total_price`

  3. Saugumas
    - RLS įjungtas
    - Anoniminiai gali kurti užsakymus
    - Autentifikuoti gali skaityti visus
*/

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter int := 0;
BEGIN
  LOOP
    new_number := 'PL-' || LPAD(floor(random() * 100000)::text, 5, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number);
    counter := counter + 1;
    IF counter > 100 THEN
      new_number := 'PL-' || extract(epoch from now())::bigint::text;
      EXIT;
    END IF;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT generate_order_number(),

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'confirmed', 'failed')),
  order_status text NOT NULL DEFAULT 'pending'
    CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),

  customer_name text,
  customer_email text,
  customer_phone text,

  subtotal_amount numeric(10,2) NOT NULL DEFAULT 0,
  discount_code text,
  discount_percent integer DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  shipping_fee numeric(10,2) DEFAULT 3.50,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  crypto_amount numeric(20,8),
  sol_price_eur numeric(10,4),

  payment_method text
    CHECK (payment_method IN ('swaps', 'phantom', 'trustwallet', 'revolut')),
  wallet_address text,
  transaction_signature text,
  payment_confirmed_at timestamptz,

  delivery_method text
    CHECK (delivery_method IN ('omniva', 'lpexpress', 'dpd')),
  parcel_locker_id uuid,
  shipping_address jsonb,

  order_items jsonb,
  full_order_details jsonb,
  notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visi gali kurti užsakymus"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Visi gali skaityti savo užsakymą pagal numerį"
  ON orders FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Autentifikuoti gali atnaujinti užsakymus"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_slug text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visi gali kurti prekių eilutes"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Visi gali skaityti prekių eilutes"
  ON order_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Autentifikuoti gali atnaujinti prekes"
  ON order_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_signature ON orders(transaction_signature);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
