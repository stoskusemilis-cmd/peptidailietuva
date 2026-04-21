/*
  # Update NAD+ 1000MG image URL

  ## Purpose
  Point product to the new high-quality image uploaded to Supabase Storage.

  ## 1. Changes
    - products.image_url for slug 'nad-plus-1000mg' set to the new
      public storage URL.

  ## 2. Security
    - No RLS or policy changes.
*/

UPDATE products
SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/nad+1000mg.png',
    updated_at = now()
WHERE slug = 'nad-plus-1000mg';
