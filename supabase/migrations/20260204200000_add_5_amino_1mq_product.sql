/*
  # Add 5-Amino-1MQ Product

  ## Overview
  Adds a new peptide product: 5-Amino-1MQ 10mg with quantity-based pricing tiers.

  ## Changes

  ### 1. New Product
  
  **5-Amino-1MQ 10mg** - Metabolic optimization peptide
  - Full description: 5-Amino-1MQ yra inovatyvus peptidas, skirtas metabolizmo optimizavimui ir svorio valdymui. Šis junginys veikia kaip NNMT (nikotinamido N-metiltransferazės) inhibitorius, padidindamas NAD+ lygį ląstelėse ir gerinant energijos gamybą. Klininiuose tyrimuose parodė efektyvumą mažinant kūno riebalus, didinant energijos lygį ir gerinant metabolinę sveikatą. 10mg dozė užtikrina optimalų poveikį. Idealus tiems, kurie siekia pagerinti savo metabolizmą, padidinti mitochondrijų funkciją ir efektyviau deginti riebalus be kitų peptidų šalutinių poveikių.
  
  ### 2. Price Tiers
  - 1 unit: 35€
  - 3 units: 75€

  ### 3. Security
  - Inherits existing RLS policies from products and product_price_tiers tables
*/

-- Insert new product
INSERT INTO products (name, slug, description, full_description, price, stock, image_url, is_active) VALUES
(
  '5-Amino-1MQ 10mg',
  '5-amino-1mq-10mg',
  'Metabolizmo optimizavimo peptidas',
  '5-Amino-1MQ yra inovatyvus peptidas, skirtas metabolizmo optimizavimui ir svorio valdymui. Šis junginys veikia kaip NNMT (nikotinamido N-metiltransferazės) inhibitorius, padidindamas NAD+ lygį ląstelėse ir gerinant energijos gamybą. Klininiuose tyrimuose parodė efektyvumą mažinant kūno riebalus, didinant energijos lygį ir gerinant metabolinę sveikatą. 10mg dozė užtikrina optimalų poveikį. Idealus tiems, kurie siekia pagerinti savo metabolizmą, padidinti mitochondrijų funkciją ir efektyviau deginti riebalus be kitų peptidų šalutinių poveikių.',
  35.00,
  100,
  '/images/5-amino-1mq-10mg.png',
  true
);

-- Insert price tiers for 5-Amino-1MQ 10mg
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 35.00 FROM products WHERE slug = '5-amino-1mq-10mg'
UNION ALL
SELECT id, 3, 75.00 FROM products WHERE slug = '5-amino-1mq-10mg';