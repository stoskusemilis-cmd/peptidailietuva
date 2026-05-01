/*
  # Restock TESTOSTERONE E 2500MG

  1. Changes
    - Update `products` row for `TESTOSTERONE E 2500MG` (slug: testosterone-e-2500mg)
      to set `stock` to a positive value so the product becomes purchasable
      and the "coming soon / out of stock" badge no longer shows.
  2. Notes
    - No schema changes.
    - No security changes.
*/

UPDATE products
SET stock = 100,
    is_active = true,
    updated_at = now()
WHERE slug = 'testosterone-e-2500mg';