-- Fix display_order conflicts by using unique values
-- SS-31 should be right before MOTS-C (4), after GLUTATHIONE (3)
-- Solution: bump MOTS-C and everything after up, or use fractional approach
-- Simpler: give SS-31 display_order between GLUTATHIONE(3) and MOTS-C(4) -> use integer spacing

-- Let's just renumber everything cleanly with spacing of 10 for future flexibility
UPDATE products SET display_order = 10 WHERE name = 'TESTOSTERONE E 2500MG';
UPDATE products SET display_order = 20 WHERE name = 'NAD+ 1000MG';
UPDATE products SET display_order = 30 WHERE name = 'NAD+ 500MG';
UPDATE products SET display_order = 40 WHERE name = 'GLUTATHIONE 600MG';
UPDATE products SET display_order = 50 WHERE name = 'SS-31 50MG';
UPDATE products SET display_order = 60 WHERE name = 'MOTS-C 40MG';
UPDATE products SET display_order = 70 WHERE name = 'TESAMORELIN 10MG';
UPDATE products SET display_order = 80 WHERE name = 'RETATRUTIDE 15MG';
UPDATE products SET display_order = 90 WHERE name = 'RETATRUTIDE 30MG';
UPDATE products SET display_order = 100 WHERE name = 'TIRZEPATIDE 30MG';
UPDATE products SET display_order = 110 WHERE name = 'MELANOTAN 1 10MG';
UPDATE products SET display_order = 120 WHERE name = 'MELANOTAN II 10MG';
UPDATE products SET display_order = 130 WHERE name = 'GHK-CU 100MG';
UPDATE products SET display_order = 140 WHERE name = 'GLOW 70MG';
UPDATE products SET display_order = 150 WHERE name = 'KLOW 80MG';
UPDATE products SET display_order = 160 WHERE name = 'HGH 24IU';
UPDATE products SET display_order = 170 WHERE name = 'HCG 10000IU';
UPDATE products SET display_order = 180 WHERE name = 'IGF-1 LR3 1MG';
UPDATE products SET display_order = 190 WHERE name = 'CJC1295 (NO DAC) 5MG + IPAMORELIN 5MG';
UPDATE products SET display_order = 200 WHERE name = 'SELANK 10MG';
UPDATE products SET display_order = 210 WHERE name = 'SEMAX 10MG';
UPDATE products SET display_order = 220 WHERE name = 'LEMON BOTTLE 10ML';
UPDATE products SET display_order = 230 WHERE name = 'MASTERONE P 1000MG';
UPDATE products SET display_order = 240 WHERE name = 'TESAMORELIN 20MG';
UPDATE products SET display_order = 250 WHERE name = 'PT-141 10MG';
UPDATE products SET display_order = 260 WHERE name = 'BPC-157 10MG';
UPDATE products SET display_order = 270 WHERE name = 'TB-500 10MG';
UPDATE products SET display_order = 280 WHERE name = 'BPC-157 10MG + TB-500 10MG';
UPDATE products SET display_order = 290 WHERE name = 'KPV 10MG';
UPDATE products SET display_order = 300 WHERE name = 'AOD-9604 10MG';
UPDATE products SET display_order = 310 WHERE name = 'HGH 15IU';
UPDATE products SET display_order = 320 WHERE name = 'EPITALON 50MG';
UPDATE products SET display_order = 330 WHERE name = 'DSIP 5MG';
UPDATE products SET display_order = 340 WHERE name = '5-AMINO-1MQ 10MG';
UPDATE products SET display_order = 350 WHERE name = 'MASTERONE E 2000MG';
