/*
  # Fix HGH 24IU base price mismatch

  1. Modified Tables
    - `products`
      - Update `price` for HGH 24IU from 65.00 to 35.00 to match tier 1 price

  2. Reason
    - The `products.price` column is used as a fallback when no tier matches
    - HGH 24IU had products.price = 65.00 but tier 1 (quantity=1) price = 35.00
    - This mismatch could cause incorrect pricing if the tier lookup ever fails
    - All other 15 products have matching base price and tier 1 price
*/

UPDATE products 
SET price = 35.00, updated_at = now()
WHERE name = 'HGH 24IU' AND price = 65.00;
