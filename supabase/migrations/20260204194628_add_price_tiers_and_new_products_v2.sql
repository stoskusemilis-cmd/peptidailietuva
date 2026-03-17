/*
  # Add Price Tiers and New Products

  ## Overview
  Adds pricing tiers system to support quantity-based pricing and introduces new peptide products.

  ## Changes

  ### 1. New Tables
  
  #### `product_price_tiers`
  - `id` (uuid, primary key) - Unique identifier
  - `product_id` (uuid, foreign key) - Reference to products table
  - `quantity` (integer) - Minimum quantity for this price tier
  - `price` (numeric) - Price for this tier in EUR
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. New Products
  All products below include their respective price tiers:
  
  - **GHK-CU 100MG** - Copper peptide for skin regeneration and healing
    - 1 unit: 45€
    - 2 units: 85€
  
  - **NAD+ 500MG** - Cellular energy and anti-aging support
    - 1 unit: 45€
    - 2 units: 85€
  
  - **MELANOTAN II 10MG** - Tanning and metabolic peptide
    - 1 unit: 35€
    - 2 units: 65€
  
  - **RETATRUTIDE 15MG (Standard)** - Weight management peptide
    - 1 unit: 60€
    - 2 units: 115€
  
  - **RETATRUTIDE 15MG (Premium)** - Enhanced weight management peptide
    - 1 unit: 110€
    - 2 units: 210€
  
  - **GLOW 70MG** - Healing and regeneration complex (BPC-157 10mg + TB-500 10mg + GHK-CU 50mg)
    - 1 unit: 55€
  
  - **KLOW 80MG** - Advanced healing complex (KPV 10mg + BPC-157 10mg + TB-500 10mg + GHK-CU 50mg)
    - 1 unit: 60€
  
  - **HGH 15IU** - Human growth hormone
    - 1 unit: 25€
    - 2 units: 43€
  
  - **HGH 24IU** - Human growth hormone (higher dose)
    - 1 unit: 35€
    - 2 units: 60€
    - 4 units: 100€
  
  - **IGF-1 LR3 1MG** - Muscle growth and recovery peptide
    - 1 unit: 55€
    - 2 units: 105€
  
  - **CJC1295 (without DAC) 5MG + IPA 5MG** - Growth hormone releasing peptide combo
    - 1 unit: 45€
    - 2 units: 85€
  
  - **SEMAX 10MG** - Nootropic peptide for cognitive enhancement
    - 1 unit: 35€
    - 2 units: 60€

  ### 3. Security
  - Enable RLS on `product_price_tiers` table
  - Allow public read access to price tiers for active products

  ### 4. Indexes
  - Add index on `product_id` for fast tier lookups
  - Add composite index on `product_id` and `quantity` for pricing queries
*/

-- Create product_price_tiers table
CREATE TABLE IF NOT EXISTS product_price_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10,2) NOT NULL CHECK (price > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, quantity)
);

-- Enable RLS
ALTER TABLE product_price_tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policy for price tiers (public read)
CREATE POLICY "Anyone can view price tiers for active products"
  ON product_price_tiers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_price_tiers.product_id
      AND products.is_active = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_price_tiers_product ON product_price_tiers(product_id);
CREATE INDEX IF NOT EXISTS idx_price_tiers_product_quantity ON product_price_tiers(product_id, quantity);

-- Clear existing order items first
DELETE FROM order_items;

-- Delete existing products
DELETE FROM products;

-- Insert new products with descriptions
INSERT INTO products (name, slug, description, full_description, price, stock, image_url) VALUES
(
  'GHK-CU 100mg',
  'ghk-cu-100mg',
  'Vario peptidas odos regeneracijai ir gijimui',
  'GHK-Cu (gliсil-L-histidil-L-lizino varis) yra natūraliai organizme randamas vario peptidas, kuris mažėja su amžiumi. Šis galingas junginys skatina kolageno ir elastino gamybą, pagerina žaizdų gijimą, mažina randus ir raukšles. GHK-Cu veikia kaip antioksidantas, apsaugodamas ląsteles nuo laisvųjų radikalų, skatina naujų kraujagyslių formavimąsi ir didina odos storį. 100mg dozė užtikrina ilgalaikį ir efektyvų poveikį. Idealus odos atjaunėjimui, sužeidimų gydymui ir bendrų regeneracijos procesų palaikymui.',
  45.00,
  100,
  '/images/ghk-cu-100mg.png'
),
(
  'NAD+ 500mg',
  'nad-plus-500mg',
  'Ląstelių energijos ir anti-senėjimo palaikymas',
  'NAD+ (nikotinamido adenino dinukleotidas) yra gyvybiškai svarbus kofermentas, esantis kiekvienoje organizmo ląstelėje. Jis atlieka pagrindinį vaidmenį energijos gamyboje, DNR taisyme ir ląstelių senėjimo reguliavime. NAD+ lygis natūraliai mažėja su amžiumi, todėl papildomas vartojimas gali padėti atkurti jaunystės energijos lygį. Šis peptidas gerina smegenų veiklą, pagerina metabolizmą, stiprina imuninę sistemą ir didina bendrą gyvybingumą. 500mg dozė užtikrina optimalų poveikį. Tinka visiems, siekiantiems sumažinti senėjimo požymius ir padidinti energijos lygį.',
  45.00,
  100,
  '/images/nad-plus-500mg.png'
),
(
  'Melanotan II 10mg',
  'melanotan-ii-10mg',
  'Įdegio ir metabolizmo peptidas',
  'Melanotan II yra sintetinis peptidas, stimuliuojantis melanino gamybą odoje, suteikdamas natūralų įdegį be žalingo UV spinduliavimo. Be įdegio efekto, Melanotan II taip pat padeda mažinti apetitą, didina libido ir pagerina seksualinę funkciją. Šis peptidas veikia per melanokortino receptorius, kurie reguliuoja ne tik odos pigmentaciją, bet ir energijos balansą organizme. 10mg pakuotė užtikrina saugų ir kontroliuojamą dozavimą. Idealus tiems, kurie nori įgyti įdegį, sumažinti svorį arba pagerinti seksualinę sveikatą.',
  35.00,
  100,
  '/images/melanotan-ii-10mg.png'
),
(
  'Retatrutide 15mg',
  'retatrutide-15mg-standard',
  'Naujos kartos peptidas svorio valdymui',
  'Retatrutide yra naujausia kartos peptidų technologija, skirta efektyviam svorio valdymui. Šis unikalus junginys veikia per tris skirtingus receptorių tipus (GLP-1, GIP, ir glucagon), užtikrindamas maksimalų poveikį metabolizmui. Klininiuose tyrimuose parodė puikius rezultatus mažinant kūno masę ir gerinant metabolinius rodiklius. 15mg pakuotė užtikrina optimalų dozavimą ir ilgalaikį poveikį. Tinka tiek pradedantiesiems, tiek patyrusiems vartotojams. Padeda sumažinti apetitą, didinti sočio jausmą ir spartinti riebalų deginimą.',
  60.00,
  100,
  '/images/retatrutide15.png'
),
(
  'Retatrutide 15mg Premium',
  'retatrutide-15mg-premium',
  'Aukščiausios kokybės svorio valdymo peptidas',
  'Retatrutide Premium yra aukščiausios kokybės formulė, pasižyminti didžiausiu grynumu ir efektyvumu. Šis produktas pagamintas naudojant pažangiausias technologijas ir užtikrina maksimalų biologinį prieinamumą. Veikia per tris receptorių tipus (GLP-1, GIP, glucagon), užtikrindama puikius svorio mažinimo rezultatus. Premium versija pasižymi geresniu stabilumu ir ilgesniu veikimo laiku. Idealus rimtiems sportininkams ir tiems, kurie siekia geriausių rezultatų. 15mg dozė užtikrina tikslų ir efektyvų poveikį.',
  110.00,
  100,
  '/images/Retatrutide15mg.png'
),
(
  'Glow 70mg',
  'glow-70mg',
  'Universalus gijimo kompleksas (BPC-157 + TB-500 + GHK-Cu)',
  'Glow yra unikalus trijų galingų peptidų derinys, sukurtas maksimaliai regeneracijai ir atjaunėjimui. BPC-157 (10mg) skatina audinių gijimą ir mažina uždegimą. TB-500 (10mg) pagerina lankstumą, mažina raumenų įtampą ir spartina atsigavimą po traumų. GHK-Cu (50mg) - stiprus antioksidantas, gerinantis odos būklę, skatinantis kolageno sintezę ir lėtinantis senėjimo procesus. Šis 70mg kompleksas puikiai tinka sportininkams, sužeidimų gydymui ir bendrų regeneracijos procesų palaikymui. Sinerginis peptidų derinys užtikrina maksimalų efektyvumą.',
  55.00,
  100,
  '/images/glow70.png'
),
(
  'Klow 80mg',
  'klow-80mg',
  'Pažangus gijimo kompleksas (KPV + BPC-157 + TB-500 + GHK-Cu)',
  'Klow yra dar galingesnis peptidų kompleksas, papildytas KPV peptiду. KPV (10mg) yra galingas priešuždegininis peptidas, mažinantis chronišką uždegimą ir padedantis gydyti žarnyno ligas. Kartu su BPC-157 (10mg), TB-500 (10mg) ir GHK-Cu (50mg) sudaro vieną stipriausių regeneracijos kompleksų rinkoje. Šis 80mg derinys puikiai tinka chroninio uždegimo gydymui, sąnarių regeneracijai, žarnyno sveikatai ir bendrų gijimo procesų spartinimui. Idealus sportininkams ir tiems, kurie kenčia nuo chroninio skausmo ar uždegimo.',
  60.00,
  100,
  '/images/klow-80mg.png'
),
(
  'HGH 15iu',
  'hgh-15iu',
  'Žmogaus augimo hormonas raumenų auginimui',
  'HGH (žmogaus augimo hormonas) yra vienas svarbiausių hormonų mūsų organizme, atsakingas už augimą, regeneraciją ir ląstelių atnaujinimą. Šis produktas padeda didinti raumenų masę, mažinti riebalų kiekį, gerinti miego kokybę ir bendrą energijos lygį. 15iu dozė yra optimali pradedantiesiems ir vidutinio lygio vartotojams. HGH taip pat pagerina odos būklę, stiprina imunitetą ir didina bendrą gyvybingumą. Idealus pasirinkimas tiems, kurie siekia maksimalių rezultatų fitnese ir bendroje sveikatoje.',
  25.00,
  100,
  '/images/hgh15.png'
),
(
  'HGH 24iu',
  'hgh-24iu',
  'Žmogaus augimo hormonas (aukštesnė dozė)',
  'HGH 24iu yra aukštesnės dozės žmogaus augimo hormonas, skirtas patyrusiems vartotojams ir tiems, kurie siekia maksimalių rezultatų. Didesnė dozė užtikrina stipresnį anabolinį poveikį, greitesnį raumenų augimą ir efektyvesnį riebalų deginimą. 24iu pakuotė leidžia lankstesnį dozavimą ir ilgesnį naudojimo laiką. Puikiai tinka intensyviai treniruojantiems sportininkams, kūno rengybos entuziastams ir tiems, kurie nori maksimaliai pasinaudoti HGH privalumais. Pagerina atsigavimą, didina jėgą ir bendrą fizinę galią.',
  35.00,
  100,
  '/images/hgh-24iu.png'
),
(
  'IGF-1 LR3 1mg',
  'igf-1-lr3-1mg',
  'Pažangus peptidas raumenų augimui',
  'IGF-1 LR3 (Insulin-like Growth Factor) yra modifikuota IGF-1 forma su prailgintu poveikio laiku. Šis peptidas skatina raumenų ląstelių hiperplaziją (naujų ląstelių susidarymą) ir hipertrofiją (esančių ląstelių augimą). Skirtingai nuo įprasto IGF-1, LR3 versija veikia iki 20 valandų, užtikrindama ilgalaikį anabolinį poveikį. Puikiai tinka raumenų masės didinimui, regeneracijai po intensyvių treniruočių ir riebalų deginimui. 1mg pakuotė užtikrina tikslų dozavimą ir maksimalią efektyvumą. Idealus rimtiems sportininkams.',
  55.00,
  100,
  '/images/igf1lr3.png'
),
(
  'CJC1295 (no DAC) 5mg + Ipamorelin 5mg',
  'cjc1295-ipa-5mg',
  'Augimo hormono išsiskyrimo peptidų kompleksas',
  'CJC1295 (be DAC) ir Ipamorelin yra vienas populiariausių peptidų derinių, skirtų natūraliai stimuliuoti augimo hormono išsiskyrimą. CJC1295 (5mg) padidina GH išsiskyrimą be pulsų slopinimo, o Ipamorelin (5mg) stimuliuoja GH išsiskyrimą pulsuojančiu būdu, nekeliant prolaktino ar kortizolo lygio. Šis 10mg kompleksas užtikrina sinergistinį poveikį, pagerina raumenų augimą, spartina riebalų deginimą, gerina miego kokybę ir bendrą atsigavimą. Saugus ir efektyvus pasirinkimas tiems, kurie nori natūraliai padidinti GH lygį.',
  45.00,
  100,
  '/images/cjc1295-ipa.png'
),
(
  'Semax 10mg',
  'semax-10mg',
  'Nootropinis peptidas protinei veiklai',
  'Semax yra sintetinis peptidas, sukurtas Rusijos mokslininkų, skirtas smegenų veiklos gerinimui. Šis nootropinis junginys pagerina atmintį, dėmesį, koncentraciją ir bendrą pažintinę funkciją. Semax veikia per BDNF (smegenų neurotrofinį faktorių) kelią, skatindamas naujų neuronų susidarymą ir apsaugodamas esamus. Taip pat mažina stresą, gerina nuotaiką ir didina atsparumą psichinėms apkrovoms. 10mg dozė yra optimali kasdieniniam naudojimui. Idealus studentams, profesionalams ir visiems, siekiantiems maksimalios protinės galios.',
  35.00,
  100,
  '/images/semax10.png'
);

-- Insert price tiers for products
-- GHK-CU 100mg
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 45.00 FROM products WHERE slug = 'ghk-cu-100mg'
UNION ALL
SELECT id, 2, 85.00 FROM products WHERE slug = 'ghk-cu-100mg';

-- NAD+ 500mg
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 45.00 FROM products WHERE slug = 'nad-plus-500mg'
UNION ALL
SELECT id, 2, 85.00 FROM products WHERE slug = 'nad-plus-500mg';

-- Melanotan II 10mg
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 35.00 FROM products WHERE slug = 'melanotan-ii-10mg'
UNION ALL
SELECT id, 2, 65.00 FROM products WHERE slug = 'melanotan-ii-10mg';

-- Retatrutide 15mg Standard
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 60.00 FROM products WHERE slug = 'retatrutide-15mg-standard'
UNION ALL
SELECT id, 2, 115.00 FROM products WHERE slug = 'retatrutide-15mg-standard';

-- Retatrutide 15mg Premium
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 110.00 FROM products WHERE slug = 'retatrutide-15mg-premium'
UNION ALL
SELECT id, 2, 210.00 FROM products WHERE slug = 'retatrutide-15mg-premium';

-- Glow 70mg (single price)
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 55.00 FROM products WHERE slug = 'glow-70mg';

-- Klow 80mg (single price)
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 60.00 FROM products WHERE slug = 'klow-80mg';

-- HGH 15iu
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 25.00 FROM products WHERE slug = 'hgh-15iu'
UNION ALL
SELECT id, 2, 43.00 FROM products WHERE slug = 'hgh-15iu';

-- HGH 24iu
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 35.00 FROM products WHERE slug = 'hgh-24iu'
UNION ALL
SELECT id, 2, 60.00 FROM products WHERE slug = 'hgh-24iu'
UNION ALL
SELECT id, 4, 100.00 FROM products WHERE slug = 'hgh-24iu';

-- IGF-1 LR3 1mg
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 55.00 FROM products WHERE slug = 'igf-1-lr3-1mg'
UNION ALL
SELECT id, 2, 105.00 FROM products WHERE slug = 'igf-1-lr3-1mg';

-- CJC1295 + IPA
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 45.00 FROM products WHERE slug = 'cjc1295-ipa-5mg'
UNION ALL
SELECT id, 2, 85.00 FROM products WHERE slug = 'cjc1295-ipa-5mg';

-- Semax 10mg
INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 35.00 FROM products WHERE slug = 'semax-10mg'
UNION ALL
SELECT id, 2, 60.00 FROM products WHERE slug = 'semax-10mg';