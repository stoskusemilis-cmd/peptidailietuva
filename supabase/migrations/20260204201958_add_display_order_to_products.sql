/*
  # Add display order to products
  
  1. Changes
    - Add `display_order` column to products table
    - Set display order for all existing products according to specified sequence
    - Create index on display_order for better query performance
  
  2. Display Order
    1. GHK-CU 100mg
    2. NAD+ 500mg
    3. Melanotan II 10mg
    4. Retatrutide 15mg Standard
    5. Retatrutide 15mg Premium
    6. Glow 70mg
    7. Klow 80mg
    8. HGH 15iu
    9. HGH 24iu
    10. IGF-1 LR3 1mg
    11. CJC1295 + IPA
    12. Semax 10mg
    13. 5-Amino-1MQ 10mg
*/

-- Add display_order column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 999;

-- Set display order for each product
UPDATE products SET display_order = 1 WHERE slug = 'ghk-cu-100mg';
UPDATE products SET display_order = 2 WHERE slug = 'nad-plus-500mg';
UPDATE products SET display_order = 3 WHERE slug = 'melanotan-ii-10mg';
UPDATE products SET display_order = 4 WHERE slug = 'retatrutide-15mg-standard';
UPDATE products SET display_order = 5 WHERE slug = 'retatrutide-15mg-premium';
UPDATE products SET display_order = 6 WHERE slug = 'glow-70mg';
UPDATE products SET display_order = 7 WHERE slug = 'klow-80mg';
UPDATE products SET display_order = 8 WHERE slug = 'hgh-15iu';
UPDATE products SET display_order = 9 WHERE slug = 'hgh-24iu';
UPDATE products SET display_order = 10 WHERE slug = 'igf-1-lr3-1mg';
UPDATE products SET display_order = 11 WHERE slug = 'cjc1295-ipa-5mg';
UPDATE products SET display_order = 12 WHERE slug = 'semax-10mg';
UPDATE products SET display_order = 13 WHERE slug = '5-amino-1mq-10mg';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);