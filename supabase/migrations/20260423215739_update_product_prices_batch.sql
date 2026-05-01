/*
  # Update product prices (multi-product batch)

  ## Purpose
  Refresh base prices and quantity tier prices for the following products so
  the catalog and checkout quote the new pricing across the whole system.

  ## 1. Updated products / tiers
    - SELANK 10MG:       1=40, 2=75,  5=160
    - SEMAX 10MG:        1=40, 2=75,  5=160
    - MASTERONE E 200MG: 1=60, 2=115, 5=270
    - IGF-1 LR3 1MG:     1=70, 2=135, 5=300
    - CJC1295+IPA 5MG:   1=60, 2=115, 5=270
    - KLOW 80MG:         1=70, 2=135, 5=300
    - GLOW 70MG:         1=60, 2=115, 5=270

  ## 2. Notes
    - Base `products.price` is synced to the 1-unit tier price.
    - Missing tiers (1/2/5) are inserted; existing tiers are updated in place.
    - No destructive operations (no DELETE) are performed.

  ## 3. Security
    - No RLS or policy changes.
*/

-- Base price sync
UPDATE products SET price = 40.00, updated_at = now() WHERE slug IN ('selank-10mg', 'semax-10mg');
UPDATE products SET price = 60.00, updated_at = now() WHERE slug IN ('masterone-e-2000mg', 'cjc1295-ipa-5mg', 'glow-70mg');
UPDATE products SET price = 70.00, updated_at = now() WHERE slug IN ('igf-1-lr3-1mg', 'klow-80mg');

-- Upsert tiers via a temp mapping
DO $$
DECLARE
  r RECORD;
  pid uuid;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('selank-10mg',        1, 40.00),
      ('selank-10mg',        2, 75.00),
      ('selank-10mg',        5, 160.00),
      ('semax-10mg',         1, 40.00),
      ('semax-10mg',         2, 75.00),
      ('semax-10mg',         5, 160.00),
      ('masterone-e-2000mg', 1, 60.00),
      ('masterone-e-2000mg', 2, 115.00),
      ('masterone-e-2000mg', 5, 270.00),
      ('igf-1-lr3-1mg',      1, 70.00),
      ('igf-1-lr3-1mg',      2, 135.00),
      ('igf-1-lr3-1mg',      5, 300.00),
      ('cjc1295-ipa-5mg',    1, 60.00),
      ('cjc1295-ipa-5mg',    2, 115.00),
      ('cjc1295-ipa-5mg',    5, 270.00),
      ('klow-80mg',          1, 70.00),
      ('klow-80mg',          2, 135.00),
      ('klow-80mg',          5, 300.00),
      ('glow-70mg',          1, 60.00),
      ('glow-70mg',          2, 115.00),
      ('glow-70mg',          5, 270.00)
    ) AS v(slug, quantity, price)
  LOOP
    SELECT id INTO pid FROM products WHERE slug = r.slug;
    IF pid IS NULL THEN
      CONTINUE;
    END IF;

    IF EXISTS (SELECT 1 FROM product_price_tiers WHERE product_id = pid AND quantity = r.quantity) THEN
      UPDATE product_price_tiers
         SET price = r.price
       WHERE product_id = pid AND quantity = r.quantity;
    ELSE
      INSERT INTO product_price_tiers (product_id, quantity, price)
      VALUES (pid, r.quantity, r.price);
    END IF;
  END LOOP;
END $$;
