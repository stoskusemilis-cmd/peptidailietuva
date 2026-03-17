/*
  # Add multilingual description columns to products

  Adds English and Russian translations for both short and full descriptions.

  ## Changes
  - `description_en` - Short description in English
  - `description_ru` - Short description in Russian
  - `full_description_en` - Full description in English
  - `full_description_ru` - Full description in Russian
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS description_en text DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_ru text DEFAULT '',
  ADD COLUMN IF NOT EXISTS full_description_en text DEFAULT '',
  ADD COLUMN IF NOT EXISTS full_description_ru text DEFAULT '';
