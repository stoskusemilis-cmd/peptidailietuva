/*
  # Reorder: place SELANK 10MG right after SEMAX 10MG

  ## Purpose
  Position SELANK 10MG immediately after SEMAX 10MG in the product list,
  shifting the following products down by one slot.

  ## 1. Changes
    - SEMAX 10MG stays at display_order = 16
    - SELANK 10MG is moved to display_order = 17
    - 5-AMINO-1MQ 10MG          17 -> 18
    - TESTOSTERONE E 250MG      18 -> 19
    - MASTERONE E 200MG         19 -> 20

  ## 2. Security
    - No RLS or policy changes.
*/

UPDATE products SET display_order = 20, updated_at = now() WHERE slug = 'masterone-e-2000mg';
UPDATE products SET display_order = 19, updated_at = now() WHERE slug = 'testosterone-e-2500mg';
UPDATE products SET display_order = 18, updated_at = now() WHERE slug = '5-amino-1mq-10mg';
UPDATE products SET display_order = 17, updated_at = now() WHERE slug = 'selank-10mg';
