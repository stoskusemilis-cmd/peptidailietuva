/*
  # Peptide Shop Database Schema

  ## Overview
  Complete e-commerce database for peptide products with crypto payment support

  ## New Tables
  
  ### `products`
  - `id` (uuid, primary key) - Unique product identifier
  - `name` (text) - Product name
  - `slug` (text, unique) - URL-friendly product identifier
  - `description` (text) - Short product description
  - `full_description` (text) - Detailed product information
  - `price` (numeric) - Price in EUR
  - `stock` (integer) - Available quantity
  - `image_url` (text) - Product image URL
  - `is_active` (boolean) - Whether product is available for purchase
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `orders`
  - `id` (uuid, primary key) - Unique order identifier
  - `order_number` (text, unique) - Human-readable order number
  - `customer_email` (text) - Customer email address
  - `customer_name` (text) - Customer name
  - `total_amount` (numeric) - Total order amount in EUR
  - `crypto_amount` (numeric) - Amount in SOL cryptocurrency
  - `wallet_address` (text) - Customer's Solana wallet address
  - `transaction_signature` (text) - Solana transaction signature
  - `status` (text) - Order status (pending, paid, processing, shipped, completed, cancelled)
  - `shipping_address` (jsonb) - Shipping address details
  - `created_at` (timestamptz) - Order creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `order_items`
  - `id` (uuid, primary key) - Unique order item identifier
  - `order_id` (uuid, foreign key) - Reference to orders table
  - `product_id` (uuid, foreign key) - Reference to products table
  - `quantity` (integer) - Quantity ordered
  - `price` (numeric) - Price per unit at time of order
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Public read access for products
  - Customers can view their own orders by email
  - Order creation requires valid email

  ## Indexes
  - Products: slug for fast lookups
  - Orders: order_number, customer_email, status for filtering
  - Order items: order_id and product_id for relationships

  ## Initial Data
  - 5 peptide products pre-populated with descriptions and pricing
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  full_description text NOT NULL,
  price numeric(10,2) NOT NULL,
  stock integer DEFAULT 100,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  crypto_amount numeric(20,10),
  wallet_address text,
  transaction_signature text,
  status text DEFAULT 'pending',
  shipping_address jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL,
  price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products (public read)
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- RLS Policies for orders
CREATE POLICY "Customers can view own orders by email"
  ON orders FOR SELECT
  USING (customer_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Customers can update own orders"
  ON orders FOR UPDATE
  USING (customer_email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (customer_email = current_setting('request.jwt.claims', true)::json->>'email');

-- RLS Policies for order_items
CREATE POLICY "Customers can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Insert initial products
INSERT INTO products (name, slug, description, full_description, price, stock) VALUES
(
  'Retatrutide 15mg',
  'retatrutide-15mg',
  'Naujos kartos peptidas svorio valdymui',
  'Retatrutide yra naujausia kartos peptidų technologija, skirta efektyviam svorio valdymui. Šis unikalus junginys veikia per tris skirtingus receptorių tipus (GLP-1, GIP, ir glucagon), užtikrindamas maksimalų poveikį metabolizmui. Klininiuose tyrimuose parodė puikius rezultatus mažinant kūno masę ir gerinant metabolinius rodiklius. 15mg pakuotė užtikrina optimalų dozavimą ir ilgalaikį poveikį. Tinka tiek pradedantiesiems, tiek patyrusiems vartotojams.',
  55.00,
  100
),
(
  'Glow 70mg (BPC-157 + TB-500 + GHK-Cu)',
  'glow-70mg',
  'Universalus gydymo ir regeneracijos kompleksas',
  'Glow yra unikalus trijų galingų peptidų derinys, sukurtas maksimaliai regeneracijai ir atjaunėjimui. BPC-157 (10mg) skatina audinių gijimą ir mažina uždegimą. TB-500 (10mg) pagerina lankstumą, mažina raumenų įtampą ir spartina atsigavimą po traumų. GHK-Cu (50mg) - stiprus antioksidantas, gerinantis odos būklę, skatinantis kolageno sintezę ir lėtinantis senėjimo procesus. Šis kompleksas puikiai tinka sportininkams, sužeidimų gydymui ir bendrų regeneracijos procesų palaikymui.',
  60.00,
  100
),
(
  'HGH Human Growth Hormone 15iu',
  'hgh-15iu',
  'Žmogaus augimo hormonas raumenų auginimui',
  'HGH (žmogaus augimo hormonas) yra vienas svarbiausių hormonų mūsų organizme, atsakingas už augimą, regeneraciją ir ląstelių atnaujinimą. Šis produktas padeda didinti raumenų masę, mažinti riebalų kiekį, gerinti miego kokybę ir bendrą energijos lygį. 15iu dozė yra optimali pradedantiesiems ir vidutinio lygio vartotojams. HGH taip pat pagerina odos būklę, stiprina imunitetą ir didina bendrą gyvybingumą. Idealus pasirinkimas tiems, kurie siekia maksimalių rezultatų fitnese ir bendroje sveikatoje.',
  35.00,
  100
),
(
  'IGF-1 LR3 1mg',
  'igf-1-lr3-1mg',
  'Pažangus peptidas raumenų augimui ir regeneracijai',
  'IGF-1 LR3 (Insulin-like Growth Factor) yra modifikuota IGF-1 forma su prailgintu poveikio laiku. Šis peptidas skatina raumenų ląstelių hiperplaziją (naujų ląstelių susidarymą) ir hipertrofiją (esančių ląstelių augimą). Skirtingai nuo įprasto IGF-1, LR3 versija veikia iki 20 valandų, užtikrindama ilgalaikį anabolinį poveikį. Puikiai tinka raumenų masės didinimui, regeneracijai po intensyvių treniruočių ir riebalų deginimui. 1mg pakuotė užtikrina tikslų dozavimą ir maksimalią efektyvumą.',
  60.00,
  100
),
(
  'Semax 10mg',
  'semax-10mg',
  'Nootropinis peptidas protinei veiklai gerinti',
  'Semax yra sintetinis peptidas, sukurtas Rusijos mokslininkų, skirtas smegenų veiklos gerinimui. Šis nootropinis junginys pagerina atmintį, dėmesį, koncentraciją ir bendrą pažintinę funkciją. Semax veikia per BDNF (smegenų neurotrofinį faktorių) kelią, skatindamas naujų neuronų susidarymą ir apsaugodamas esamus. Taip pat mažina stresą, gerina nuotaiką ir didina atsparumą psichinėms apkrovoms. 10mg dozė yra optimali kasdieniniam naudojimui. Idealus studentams, profesionalams ir visiems, siekiantiems maksimalios protinės galios.',
  35.00,
  100
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();