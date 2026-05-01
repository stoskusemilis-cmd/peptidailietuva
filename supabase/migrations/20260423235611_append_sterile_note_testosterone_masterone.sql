/*
  # Append sterility note to TESTOSTERONE E and MASTERONE E descriptions

  ## Purpose
  Clarify in each product's full description (all three languages) that the
  10ml oil is fully sterile and ready to use.

  ## Changes
    1. Append Lithuanian sterility note to `full_description` of
       `testosterone-e-2500mg` and `masterone-e-2000mg`.
    2. Append English equivalent to `full_description_en`.
    3. Append Russian equivalent to `full_description_ru`.

  ## Notes
    - Pure content update. No schema, price, stock or policy changes.
    - Idempotent: only appends when the note is not already present.
*/

UPDATE products
SET full_description = full_description || E'\n\n10ml oil yra pilnai maksimaliai sterilus ir paruoštas naudojimui.',
    updated_at = now()
WHERE slug IN ('testosterone-e-2500mg','masterone-e-2000mg')
  AND full_description NOT ILIKE '%pilnai maksimaliai sterilus%';

UPDATE products
SET full_description_en = full_description_en || E'\n\nThe 10ml oil is fully sterile and ready for use.',
    updated_at = now()
WHERE slug IN ('testosterone-e-2500mg','masterone-e-2000mg')
  AND full_description_en NOT ILIKE '%fully sterile and ready for use%';

UPDATE products
SET full_description_ru = full_description_ru || E'\n\nМасло 10мл полностью стерильно и готово к применению.',
    updated_at = now()
WHERE slug IN ('testosterone-e-2500mg','masterone-e-2000mg')
  AND full_description_ru NOT ILIKE '%полностью стерильно и готово%';
