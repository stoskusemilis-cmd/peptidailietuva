-- SS-31 50MG before MOTS-C 40MG (MOTS-C is at 4, so SS-31 gets 3)
UPDATE products SET display_order = 3 WHERE name = 'SS-31 50MG';

-- TIRZEPATIDE 30MG before MELANOTAN II 10MG (MELANOTAN II is at 8)
UPDATE products SET display_order = 6 WHERE name = 'TIRZEPATIDE 30MG';

-- MELANOTAN 1 10MG before MELANOTAN II 10MG
UPDATE products SET display_order = 7 WHERE name = 'MELANOTAN 1 10MG';

-- GLOW 70MG before KLOW 80MG (KLOW is at 11)
UPDATE products SET display_order = 10 WHERE name = 'GLOW 70MG';

-- LEMON BOTTLE 10ML before MASTERONE P 1000MG (MASTERONE P is at 23)
UPDATE products SET display_order = 22 WHERE name = 'LEMON BOTTLE 10ML';
