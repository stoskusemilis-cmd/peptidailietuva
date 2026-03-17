/*
  # Update Product Display Order and Names

  ## Overview
  Sets display order to match the requested product listing order
  and ensures product names are uppercase and correct.

  ## Changes
  - Updates display_order for all products to match requested sequence
  - Fixes product names to be uppercase where needed
*/

UPDATE products SET name = 'NAD+ 500MG', display_order = 1 WHERE slug = 'nad-plus-500mg';
UPDATE products SET name = 'GLUTATHIONE 600MG', display_order = 2 WHERE slug = 'glutathione-600mg';
UPDATE products SET name = 'RETATRUTIDE 15MG', display_order = 3 WHERE slug = 'retatrutide-15mg-standard';
UPDATE products SET name = 'RETATRUTIDE 30MG', display_order = 4 WHERE slug = 'retatrutide-15mg-premium';
UPDATE products SET name = 'MELANOTAN II 10MG', display_order = 5 WHERE slug = 'melanotan-ii-10mg';
UPDATE products SET name = 'GHK-CU 100MG', display_order = 6 WHERE slug = 'ghk-cu-100mg';
UPDATE products SET name = 'GLOW 70MG', display_order = 7 WHERE slug = 'glow-70mg';
UPDATE products SET name = 'KLOW 80MG', display_order = 8 WHERE slug = 'klow-80mg';
UPDATE products SET name = 'HGH 15IU', display_order = 9 WHERE slug = 'hgh-15iu';
UPDATE products SET name = 'HGH 24IU', display_order = 10 WHERE slug = 'hgh-24iu';
UPDATE products SET name = 'IGF-1 LR3 1MG', display_order = 11 WHERE slug = 'igf-1-lr3-1mg';
UPDATE products SET name = 'CJC1295 (WITHOUT DAC) 5MG + IPAMORELIN 5MG', display_order = 12 WHERE slug = 'cjc1295-ipa-5mg';
UPDATE products SET name = 'SEMAX 10MG', display_order = 13 WHERE slug = 'semax-10mg';
UPDATE products SET name = '5-AMINO-1MQ 10MG', display_order = 14 WHERE slug = '5-amino-1mq-10mg';
UPDATE products SET name = 'TESTOSTERONE C 2500MG', display_order = 15 WHERE slug = 'testosterone-e-2500mg';
UPDATE products SET name = 'MASTERONE E 2000MG', display_order = 16 WHERE slug = 'masterone-e-2000mg';
