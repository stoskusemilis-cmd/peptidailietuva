/*
  # Update All Product Prices and Tiers

  ## Overview
  Updates all product base prices and price tiers to match the new pricing structure.

  ## Changes

  ### Updated Price Tiers (complete replacement):
  - NAD+ 500MG: 1vnt 50€, 2vnt 95€
  - GLUTATHIONE 600MG: 1vnt 50€, 2vnt 95€
  - RETATRUTIDE 15MG: 1vnt 60€ (single tier only)
  - RETATRUTIDE 30MG: 1vnt 110€ (single tier only)
  - MELANOTAN II 10MG: 1vnt 40€, 2vnt 75€
  - GHK-CU 100MG: 1vnt 45€, 2vnt 85€
  - GLOW 70MG: 1vnt 55€, 2vnt 105€
  - KLOW 80MG: 1vnt 60€, 2vnt 115€
  - HGH 15IU: 1vnt 25€ (single tier only)
  - HGH 24IU: 1vnt 35€, 2vnt 65€, 5vnt 140€
  - IGF-1 LR3 1MG: 1vnt 55€, 2vnt 105€
  - CJC1295 + IPAMORELIN: 1vnt 50€, 2vnt 95€
  - SEMAX 10MG: 1vnt 35€, 2vnt 65€
  - 5-AMINO-1MQ 10MG: 1vnt 45€, 2vnt 85€
  - TESTOSTERONE C 2500MG (renamed): 1vnt 45€, 2vnt 85€
  - MASTERONE E 2000MG: 1vnt 55€, 2vnt 105€

  ### Product Renames:
  - "TESTOSTERONE E 2500MG" → "TESTOSTERONE C 2500MG"

  ### Notes:
  - All existing tiers deleted and replaced per product
  - Base prices updated to match 1vnt tier price
*/

-- Update product name
UPDATE products SET name = 'TESTOSTERONE C 2500MG' WHERE slug = 'testosterone-e-2500mg';

-- Update base prices
UPDATE products SET price = 50.00 WHERE slug = 'nad-plus-500mg';
UPDATE products SET price = 50.00 WHERE slug = 'glutathione-600mg';
UPDATE products SET price = 40.00 WHERE slug = 'melanotan-ii-10mg';
UPDATE products SET price = 50.00 WHERE slug = 'cjc1295-ipa-5mg';
UPDATE products SET price = 35.00 WHERE slug = 'semax-10mg';
UPDATE products SET price = 45.00 WHERE slug = '5-amino-1mq-10mg';
UPDATE products SET price = 45.00 WHERE slug = 'testosterone-e-2500mg';
UPDATE products SET price = 65.00 WHERE slug = 'hgh-24iu';

-- Delete ALL existing tiers for all products (will re-insert correct ones)
DELETE FROM product_price_tiers WHERE product_id IN (SELECT id FROM products);

-- NAD+ 500MG: 1vnt 50€, 2vnt 95€
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 50.00 FROM products WHERE slug = 'nad-plus-500mg'
UNION ALL
SELECT id, 2, 95.00 FROM products WHERE slug = 'nad-plus-500mg';

-- GLUTATHIONE 600MG: 1vnt 50€, 2vnt 95€
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 50.00 FROM products WHERE slug = 'glutathione-600mg'
UNION ALL
SELECT id, 2, 95.00 FROM products WHERE slug = 'glutathione-600mg';

-- RETATRUTIDE 15MG: 1vnt 60€
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 60.00 FROM products WHERE slug = 'retatrutide-15mg-standard';

-- RETATRUTIDE 30MG: 1vnt 110€
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 110.00 FROM products WHERE slug = 'retatrutide-15mg-premium';

-- MELANOTAN II 10MG: 1vnt 40€, 2vnt 75€
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 40.00 FROM products WHERE slug = 'melanotan-ii-10mg'
UNION ALL
SELECT id, 2, 75.00 FROM products WHERE slug = 'melanotan-ii-10mg';

-- GHK-CU 100MG: 1vnt 45€, 2vnt 85€
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 45.00 FROM products WHERE slug = 'ghk-cu-100mg'
UNION ALL
SELECT id, 2, 85.00 FROM products WHERE slug = 'ghk-cu-100mg';

-- GLOW 70MG: 1vnt 55€, 2vnt 105€
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 55.00 FROM products WHERE slug = 'glow-70mg'
UNION ALL
SELECT id, 2, 105.00 FROM products WHERE slug = 'glow-70mg';

-- KLOW 80MG: 1vnt 60€, 2vnt 115€
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 60.00 FROM products WHERE slug = 'klow-80mg'
UNION ALL
SELECT id, 2, 115.00 FROM products WHERE slug = 'klow-80mg';

-- HGH 15IU: 1vnt 25€
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 25.00 FROM products WHERE slug = 'hgh-15iu';

-- HGH 24IU: 1vnt 35€, 2vnt 65€, 5vnt 140€
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 35.00 FROM products WHERE slug = 'hgh-24iu'
UNION ALL
SELECT id, 2, 65.00 FROM products WHERE slug = 'hgh-24iu'
UNION ALL
SELECT id, 5, 140.00 FROM products WHERE slug = 'hgh-24iu';

-- IGF-1 LR3 1MG: 1vnt 55€, 2vnt 105€
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 55.00 FROM products WHERE slug = 'igf-1-lr3-1mg'
UNION ALL
SELECT id, 2, 105.00 FROM products WHERE slug = 'igf-1-lr3-1mg';

-- CJC1295 + IPAMORELIN: 1vnt 50€, 2vnt 95€
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 50.00 FROM products WHERE slug = 'cjc1295-ipa-5mg'
UNION ALL
SELECT id, 2, 95.00 FROM products WHERE slug = 'cjc1295-ipa-5mg';

-- SEMAX 10MG: 1vnt 35€, 2vnt 65€
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 35.00 FROM products WHERE slug = 'semax-10mg'
UNION ALL
SELECT id, 2, 65.00 FROM products WHERE slug = 'semax-10mg';

-- 5-AMINO-1MQ 10MG: 1vnt 45€, 2vnt 85€
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 45.00 FROM products WHERE slug = '5-amino-1mq-10mg'
UNION ALL
SELECT id, 2, 85.00 FROM products WHERE slug = '5-amino-1mq-10mg';

-- TESTOSTERONE C 2500MG: 1vnt 45€, 2vnt 85€
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 45.00 FROM products WHERE slug = 'testosterone-e-2500mg'
UNION ALL
SELECT id, 2, 85.00 FROM products WHERE slug = 'testosterone-e-2500mg';

-- MASTERONE E 2000MG: 1vnt 55€, 2vnt 105€
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 55.00 FROM products WHERE slug = 'masterone-e-2000mg'
UNION ALL
SELECT id, 2, 105.00 FROM products WHERE slug = 'masterone-e-2000mg';
