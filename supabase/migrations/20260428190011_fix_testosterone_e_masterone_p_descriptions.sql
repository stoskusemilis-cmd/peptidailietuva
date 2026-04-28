/*
  # Fix Testosterone E and Masterone P description dosages

  ## Summary
  Corrects two product descriptions where the dosage value did not match
  the actual product strength.

  ## Changes
  1. `TESTOSTERONE E 2500MG`: replaces `Testosterone Enanthate 250MG 10ml oil`
     with `Testosterone Enanthate 2500MG 10ml oil` in the Lithuanian
     `full_description`.
  2. `MASTERONE P 1000MG`: replaces `Masterone Propionate 100MG 10ml oil`
     with `Masterone Propionate 1000MG 10ml oil` in the Lithuanian
     `full_description`.

  ## Notes
  - Only the LT long description text is touched. Names, prices, stock and
    other descriptions remain intact.
  - Safe text replace; no destructive operations.
*/

UPDATE products
SET full_description = REPLACE(full_description, 'Testosterone Enanthate 250MG 10ml oil', 'Testosterone Enanthate 2500MG 10ml oil'),
    updated_at = now()
WHERE name = 'TESTOSTERONE E 2500MG'
  AND full_description LIKE '%Testosterone Enanthate 250MG 10ml oil%';

UPDATE products
SET full_description = REPLACE(full_description, 'Masterone Propionate 100MG 10ml oil', 'Masterone Propionate 1000MG 10ml oil'),
    updated_at = now()
WHERE name = 'MASTERONE P 1000MG'
  AND full_description LIKE '%Masterone Propionate 100MG 10ml oil%';
