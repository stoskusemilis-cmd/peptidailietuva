/*
  # Update product image URLs to Supabase Storage

  Changes:
  - Updates all product image_url values to use the correct Supabase Storage public URLs
  - Maps each product to its correct image based on product name and URL filename
  - Display order remains unchanged
*/

UPDATE products SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/nad500mg.png'
WHERE name = 'NAD+ 500MG';

UPDATE products SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/glutathione600mg.png'
WHERE name = 'GLUTATHIONE 600MG';

UPDATE products SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/retatrutide15mg.png'
WHERE name = 'RETATRUTIDE 15MG';

UPDATE products SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/retatrutide30mg.png'
WHERE name = 'RETATRUTIDE 30MG';

UPDATE products SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/melanotan210mg.png'
WHERE name = 'MELANOTAN II 10MG';

UPDATE products SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/ghkcu100mg.png'
WHERE name = 'GHK-CU 100MG';

UPDATE products SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/glow70mg.png'
WHERE name = 'GLOW 70MG';

UPDATE products SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/klow80mg.png'
WHERE name = 'KLOW 80MG';

UPDATE products SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/hgh15iu.png'
WHERE name = 'HGH 15IU';

UPDATE products SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/hgh24iu.png'
WHERE name = 'HGH 24IU';

UPDATE products SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/igf1lr31mg.png'
WHERE name = 'IGF-1 LR3 1MG';

UPDATE products SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/cjc5ipa5.png'
WHERE name = 'CJC1295 (WITHOUT DAC) 5MG + IPAMORELIN 5MG';

UPDATE products SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/semax10mg.png'
WHERE name = 'SEMAX 10MG';

UPDATE products SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/5amino1mq.png'
WHERE name = '5-AMINO-1MQ 10MG';

UPDATE products SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/testosteronee250mg.png'
WHERE name = 'TESTOSTERONE E 250MG';

UPDATE products SET image_url = 'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/masteronee200mg.png'
WHERE name = 'MASTERONE E 200MG';
