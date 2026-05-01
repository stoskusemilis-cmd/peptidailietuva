/*
  # Update TESTOSTERONE E 2500MG and MASTERONE E 2000MG image URLs

  ## Purpose
  Point both products at their new product photos hosted in Supabase Storage.

  ## Changes
    1. Set `image_url` for `testosterone-e-2500mg` to the new testosterone photo.
    2. Set `image_url` for `masterone-e-2000mg` to the new masterone photo.

  ## Notes
    - Metadata-only update; no schema, pricing, stock, or RLS changes.
*/

UPDATE products
SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/testosteronee2500mg.png',
    updated_at = now()
WHERE slug = 'testosterone-e-2500mg';

UPDATE products
SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/masteronee2000mg.png',
    updated_at = now()
WHERE slug = 'masterone-e-2000mg';
