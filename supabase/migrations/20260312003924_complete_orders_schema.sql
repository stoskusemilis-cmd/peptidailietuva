/*
  # Pilnas užsakymų schemos užbaigimas

  Pridedami trūkstami stulpeliai prie esamos `orders` lentelės:
  - customer_name: kliento vardas pavardė
  - customer_email: el. paštas
  - payment_method: mokėjimo metodas (swaps/phantom/trustwallet/revolut)
  - wallet_address: Solana wallet adresas
  - sol_price_eur: SOL kaina EUR užsakymo metu
  - shipping_fee: siuntimo mokestis EUR
  - notes: pastabos

  Taip pat patikslinami esami stulpeliai ir pridedami indeksai.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_name') THEN
    ALTER TABLE orders ADD COLUMN customer_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_email') THEN
    ALTER TABLE orders ADD COLUMN customer_email text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
    ALTER TABLE orders ADD COLUMN payment_method text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'wallet_address') THEN
    ALTER TABLE orders ADD COLUMN wallet_address text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'sol_price_eur') THEN
    ALTER TABLE orders ADD COLUMN sol_price_eur numeric(10,4);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_fee') THEN
    ALTER TABLE orders ADD COLUMN shipping_fee numeric(10,2) DEFAULT 3.50;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'notes') THEN
    ALTER TABLE orders ADD COLUMN notes text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_confirmed_at') THEN
    ALTER TABLE orders ADD COLUMN payment_confirmed_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_sig ON orders(transaction_signature) WHERE transaction_signature IS NOT NULL;
