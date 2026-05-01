/*
  # Mark GLOW 70MG and KLOW 80MG as restock-soon

  ## Summary
  Sets stock to 0 for `GLOW 70MG` and `KLOW 80MG` so the product cards and
  detail page display the existing "Netrukus turesime" badge while still
  keeping the products visible (`is_active` stays true).

  ## Changes
  1. `products.stock` set to `0` for `GLOW 70MG`.
  2. `products.stock` set to `0` for `KLOW 80MG`.

  ## Notes
  - No data is removed; this is a non-destructive stock-level update.
  - Listing visibility (`is_active`) is unchanged.
*/

UPDATE products
SET stock = 0,
    updated_at = now()
WHERE name IN ('GLOW 70MG', 'KLOW 80MG');
