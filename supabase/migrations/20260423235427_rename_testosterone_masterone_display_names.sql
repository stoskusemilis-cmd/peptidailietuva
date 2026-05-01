/*
  # Correct TESTOSTERONE E and MASTERONE E display names

  ## Purpose
  The product catalog showed outdated dosage numbers in the display names
  while the slugs already reflected the correct values. Align the visible
  names so they match the actual product strength.

  ## Changes
    1. Rename product `testosterone-e-2500mg` from
       "TESTOSTERONE E 250MG" to "TESTOSTERONE E 2500MG".
    2. Rename product `masterone-e-2000mg` from
       "MASTERONE E 200MG" to "MASTERONE E 2000MG".

  ## Notes
    - Non-destructive metadata update only.
    - Slugs, pricing, stock, RLS policies remain untouched.
*/

UPDATE products
SET name = 'TESTOSTERONE E 2500MG',
    updated_at = now()
WHERE slug = 'testosterone-e-2500mg';

UPDATE products
SET name = 'MASTERONE E 2000MG',
    updated_at = now()
WHERE slug = 'masterone-e-2000mg';
