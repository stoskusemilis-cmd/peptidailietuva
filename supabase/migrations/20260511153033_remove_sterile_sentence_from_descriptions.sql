/*
  # Remove "10ml oil is fully sterile and ready for use" sentence

  1. Changes
    - Strips the trailing sentence about sterility/ready-for-use from
      `full_description`, `full_description_en`, `full_description_ru`
      for TESTOSTERONE E 2500MG, MASTERONE P 1000MG and MASTERONE E 2000MG.
    - Uses regexp_replace to remove any variant of the sentence
      (with or without diacritics) along with the preceding blank line.

  2. Security
    - No schema or RLS changes.
*/

UPDATE products
SET
  full_description = regexp_replace(
    full_description,
    E'\\s*\\n+\\s*10ml oil yra pilnai maksimaliai sterilus ir paruo[sš]tas naudojimui\\.?\\s*$',
    '',
    'i'
  ),
  full_description_en = regexp_replace(
    full_description_en,
    E'\\s*\\n+\\s*The 10ml oil is fully sterile and ready for use\\.?\\s*$',
    '',
    'i'
  ),
  full_description_ru = regexp_replace(
    full_description_ru,
    E'\\s*\\n+\\s*Масло 10мл полностью стерильно и готово к применению\\.?\\s*$',
    '',
    'i'
  )
WHERE name IN ('TESTOSTERONE E 2500MG', 'MASTERONE P 1000MG', 'MASTERONE E 2000MG');
