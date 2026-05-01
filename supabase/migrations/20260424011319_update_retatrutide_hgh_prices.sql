/*
  # Update prices for RETATRUTIDE 15MG and HGH 24IU

  ## Purpose
  Adjust base price and tiered pricing for two products.

  ## Changes
    1. RETATRUTIDE 15MG: 1pc 65.00, 2pc 125.00, 5pc 295.00
    2. HGH 24IU: 1pc 40.00, 2pc 75.00, 5pc 175.00

  ## Notes
    - Upserts price tiers (1, 2, 5) for each product.
    - Sets base `price` on products to the 1pc price.
*/

UPDATE products SET price = 65.00, updated_at = now() WHERE slug = 'retatrutide-15mg';
UPDATE products SET price = 40.00, updated_at = now() WHERE slug = 'hgh-24iu';

DO $$
DECLARE
  v_reta uuid;
  v_hgh uuid;
BEGIN
  SELECT id INTO v_reta FROM products WHERE slug = 'retatrutide-15mg';
  SELECT id INTO v_hgh FROM products WHERE slug = 'hgh-24iu';

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

  IF v_hgh IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM product_price_tiers WHERE product_id = v_hgh AND quantity = 1) THEN
      UPDATE product_price_tiers SET price = 40.00 WHERE product_id = v_hgh AND quantity = 1;
    ELSE
      INSERT INTO product_price_tiers(product_id, quantity, price) VALUES (v_hgh, 1, 40.00);
    END IF;

    IF EXISTS (SELECT 1 FROM product_price_tiers WHERE product_id = v_hgh AND quantity = 2) THEN
      UPDATE product_price_tiers SET price = 75.00 WHERE product_id = v_hgh AND quantity = 2;
    ELSE
      INSERT INTO product_price_tiers(product_id, quantity, price) VALUES (v_hgh, 2, 75.00);
    END IF;

    IF EXISTS (SELECT 1 FROM product_price_tiers WHERE product_id = v_hgh AND quantity = 5) THEN
      UPDATE product_price_tiers SET price = 175.00 WHERE product_id = v_hgh AND quantity = 5;
    ELSE
      INSERT INTO product_price_tiers(product_id, quantity, price) VALUES (v_hgh, 5, 175.00);
    END IF;
  END IF;
END $$;
