/*
  # Deactivate NAD+ 500MG

  ## Purpose
  Remove NAD+ 500MG from the storefront - no longer for sale.

  ## 1. Changes
    - Set is_active = false on products.slug = 'nad-plus-500mg'.
    - Frontend filters by is_active = true so it will disappear.

  ## 2. Notes
    - Soft-delete only. The row is retained to preserve referential
      integrity for any historical order_items / audit rows.
    - Price tiers remain in product_price_tiers but are unreachable
      because the parent product is hidden.

  ## 3. Security
    - No RLS or policy changes.
*/

UPDATE products
SET is_active = false,
    updated_at = now()
WHERE slug = 'nad-plus-500mg';
