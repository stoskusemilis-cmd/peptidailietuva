/*
  # Rename HCG 1000IU product to HCG 10000IU

  ## Summary
  Updates the display name of the HCG product so it reads `HCG 10000IU`
  everywhere the product name is shown (product list, menu, cart, order
  details, emails). Descriptions did not mention the dosage value, so they
  do not need to be modified.

  ## Changes
  1. Updates `products.name` from `HCG 1000IU` to `HCG 10000IU`.

  ## Notes
  - `slug` and `image_url` are intentionally left unchanged: they are URL
    artifacts that may be cached or linked externally.
  - No data is deleted; this is a single safe UPDATE.
*/

UPDATE products
SET name = 'HCG 10000IU',
    updated_at = now()
WHERE name = 'HCG 1000IU';
