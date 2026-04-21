/*
  # Mark MOTS-C 40MG as "restock soon"

  ## Purpose
  Display MOTS-C 40MG as "Netrukus turėsime" in the storefront by setting
  stock to 0. The frontend already renders the restock-soon badge when
  product.stock <= 0.

  ## 1. Changes
    - products.stock -> 0 for slug 'mots-c-40mg'.

  ## 2. Security
    - No RLS or policy changes.
*/

UPDATE products
SET stock = 0,
    updated_at = now()
WHERE slug = 'mots-c-40mg';
