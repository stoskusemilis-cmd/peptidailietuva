/*
  # Update prices: HCG 1000IU, TESTOSTERONE E 250MG, MASTERONE E 200MG

  ## Purpose
  Refresh base prices and quantity tier prices so the catalog and checkout
  quote the updated pricing.

  ## Updated products / tiers
    - HCG 1000IU:            1=70, 2=135, 5=300
    - TESTOSTERONE E 250MG:  1=50, 2=95,  5=220
    - MASTERONE E 200MG:     1=70, 2=135, 5=300

  ## Notes
    - `products.price` (base) synced to 1-unit tier price.
    - Missing tiers inserted; existing tiers updated in place. No deletes.

  ## Security
    - No RLS or policy changes.
*/

UPDATE products SET price = 70.00, updated_at = now() WHERE slug IN ('hcg-1000iu', 'masterone-e-2000mg');
UPDATE products SET price = 50.00, updated_at = now() WHERE slug = 'testosterone-e-2500mg';

DO $$
DECLARE
  r RECORD;
  pid uuid;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('hcg-1000iu',            1, 70.00),
      ('hcg-1000iu',            2, 135.00),
      ('hcg-1000iu',            5, 300.00),
      ('testosterone-e-2500mg', 1, 50.00),
      ('testosterone-e-2500mg', 2, 95.00),
      ('testosterone-e-2500mg', 5, 220.00),
      ('masterone-e-2000mg',    1, 70.00),
      ('masterone-e-2000mg',    2, 135.00),
      ('masterone-e-2000mg',    5, 300.00)
    ) AS v(slug, quantity, price)
  LOOP
    SELECT id INTO pid FROM products WHERE slug = r.slug;
    IF pid IS NULL THEN
      CONTINUE;
    END IF;

    IF EXISTS (SELECT 1 FROM product_price_tiers WHERE product_id = pid AND quantity = r.quantity) THEN
      UPDATE product_price_tiers SET price = r.price WHERE product_id = pid AND quantity = r.quantity;
    ELSE
      INSERT INTO product_price_tiers (product_id, quantity, price) VALUES (pid, r.quantity, r.price);
    END IF;
  END LOOP;
END $$;
