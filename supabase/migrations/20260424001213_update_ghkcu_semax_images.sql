/*
  # Update GHK-CU 100MG and SEMAX 10MG image URLs

  ## Purpose
  Point both products at their new photos hosted in Supabase Storage.

  ## Changes
    1. Set `image_url` for `ghk-cu-100mg` to the new GHK-CU photo.
    2. Set `image_url` for `semax-10mg` to the new SEMAX photo.

  ## Notes
    - Metadata-only update; no schema, pricing, stock, or RLS changes.
*/

UPDATE products
SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/ghkcu100mg.png',
    updated_at = now()
WHERE slug = 'ghk-cu-100mg';

UPDATE products
SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/semax10mg.png',
    updated_at = now()
WHERE slug = 'semax-10mg';
