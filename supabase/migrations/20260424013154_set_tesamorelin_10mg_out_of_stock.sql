/*
  # Mark TESAMORELIN 10MG as "Netrukus turėsime"

  ## Purpose
  Frontend renders "Netrukus turėsime" when `stock` is 0. Set stock to 0
  for TESAMORELIN 10MG so it appears as coming soon.

  ## Changes
    1. products: set stock = 0 for slug 'tesamorelin-10mg'.

  ## Notes
    - Product remains active so it stays visible in the catalog.
*/

UPDATE products
SET stock = 0, updated_at = now()
WHERE slug = 'tesamorelin-10mg';
