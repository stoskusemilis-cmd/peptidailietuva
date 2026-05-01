/*
  # Refresh MOTS-C 40MG image URL

  ## Purpose
  Re-set the MOTS-C 40MG image_url to the latest Supabase storage asset.

  ## 1. Changes
    - products.image_url updated for slug 'mots-c-40mg'.

  ## 2. Security
    - No RLS or policy changes.
*/

UPDATE products
SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/motsc40mg.png',
    updated_at = now()
WHERE slug = 'mots-c-40mg';
