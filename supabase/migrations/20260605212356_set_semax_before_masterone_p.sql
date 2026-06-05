/*
  Move SEMAX 10MG to display right before MASTERONE P 1000MG.
  Shift MASTERONE P and everything at or above its current position up by 1.
*/

-- Bump everything currently at display_order >= 22 up by 1 to make room
UPDATE products
SET display_order = display_order + 1
WHERE display_order >= 22 AND slug != 'semax-10mg';

-- Place SEMAX at position 22 (right before the old MASTERONE P which is now 23)
UPDATE products
SET display_order = 22
WHERE slug = 'semax-10mg';