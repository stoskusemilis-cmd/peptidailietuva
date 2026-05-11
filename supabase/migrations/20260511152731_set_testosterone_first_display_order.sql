/*
  # Set TESTOSTERONE E 2500MG as the first product

  1. Changes
    - Updates `products.display_order` so that TESTOSTERONE E 2500MG is rendered first
    - Uses order 0 for TESTOSTERONE E 2500MG while leaving all other products'
      existing display_order values unchanged, so NAD+ 1000MG remains second
      and the rest follow as before.

  2. Security
    - No RLS or schema changes.
*/

UPDATE products
SET display_order = 0
WHERE name = 'TESTOSTERONE E 2500MG';
