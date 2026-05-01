/*
  # Update NAD+ 1000MG short description

  ## Purpose
  Set main product card (short) description to a concise tagline:
  "Ląstelių energijos ir anti-senėjimo peptidas".

  ## 1. Changes
    - products.description (LT) updated for slug 'nad-plus-1000mg'
    - products.description_en updated to English equivalent
    - products.description_ru updated to Russian equivalent

  ## 2. Security
    - No RLS or policy changes.
*/

UPDATE products
SET description = 'Ląstelių energijos ir anti-senėjimo peptidas',
    description_en = 'Cellular energy and anti-aging peptide',
    description_ru = 'Пептид клеточной энергии и антистарения',
    updated_at = now()
WHERE slug = 'nad-plus-1000mg';
