/*
  # Fix RETATRUTIDE 15MG prices

  ## Purpose
  Previous migration used slug 'retatrutide-15mg' which does not exist.
  The actual slug is 'retatrutide-15mg-standard'.

  ## Changes
    1. Update base price to 65.00 for RETATRUTIDE 15MG (slug retatrutide-15mg-standard)
    2. Upsert tier prices: 1 -> 65.00, 2 -> 125.00, 5 -> 295.00
*/

UPDATE products SET price = 65.00, updated_at = now() WHERE slug = 'retatrutide-15mg-standard';

DO $$
DECLARE
  v_reta uuid;
BEGIN
  SELECT id INTO v_reta FROM products WHERE slug = 'retatrutide-15mg-standard';

  IF v_reta IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM product_price_tiers WHERE product_id = v_reta AND quantity = 1) THEN
      UPDATE product_price_tiers SET price = 65.00 WHERE product_id = v_reta AND quantity = 1;
    ELSE
      INSERT INTO product_price_tiers(product_id, quantity, price) VALUES (v_reta, 1, 65.00);
    END IF;

    IF EXISTS (SELECT 1 FROM product_price_tiers WHERE product_id = v_reta AND quantity = 2) THEN
      UPDATE product_price_tiers SET price = 125.00 WHERE product_id = v_reta AND quantity = 2;
    ELSE
      INSERT INTO product_price_tiers(product_id, quantity, price) VALUES (v_reta, 2, 125.00);
    END IF;

    IF EXISTS (SELECT 1 FROM product_price_tiers WHERE product_id = v_reta AND quantity = 5) THEN
      UPDATE product_price_tiers SET price = 295.00 WHERE product_id = v_reta AND quantity = 5;
    ELSE
      INSERT INTO product_price_tiers(product_id, quantity, price) VALUES (v_reta, 5, 295.00);
    END IF;
  END IF;
END $$;
