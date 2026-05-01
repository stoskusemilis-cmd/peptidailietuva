/*
  # Add NAD+ 1000MG product

  ## Purpose
  Insert new product "NAD+ 1000MG" at the top of the product list,
  with three price tiers (1 vnt, 2 vnt, 5 vnt).

  ## 1. Changes
    - Shift all existing products' display_order by +1 to make room
      at position 1.
    - Insert new product `NAD+ 1000MG` with display_order = 1,
      Lithuanian/English/Russian descriptions, image URL from Supabase
      storage, stock = 100, price = 95 EUR (single unit).
    - Insert three rows into `product_price_tiers`:
      * 1 unit -> 95 EUR
      * 2 units -> 180 EUR
      * 5 units -> 400 EUR

  ## 2. Security
    - No RLS changes. Existing public-read policy on products and
      product_price_tiers applies.

  ## 3. Notes
    1. The product is placed first via display_order = 1 after shifting
       others, so it appears at the top of the list.
    2. Inventory_log trigger will auto-record the initial stock state
       on the first stock change.
*/

UPDATE products
SET display_order = display_order + 1,
    updated_at = now()
WHERE is_active IS NOT NULL;

INSERT INTO products (
  name,
  slug,
  description,
  description_en,
  description_ru,
  full_description,
  full_description_en,
  full_description_ru,
  price,
  stock,
  image_url,
  is_active,
  display_order
) VALUES (
  'NAD+ 1000MG',
  'nad-plus-1000mg',
  'NAD+ (nikotinamido adenino dinukleotidas) yra gyvybiškai svarbus kofermentas, esantis kiekvienoje organizmo ląstelėje. Jis atlieka pagrindinį vaidmenį energijos gamyboje, DNR taisyme ir ląstelių senėjimo reguliavime.',
  'NAD+ (nicotinamide adenine dinucleotide) is a vital coenzyme found in every cell of the body. It plays a key role in energy production, DNA repair and regulation of cellular aging.',
  'NAD+ (никотинамидадениндинуклеотид) — жизненно важный кофермент, присутствующий в каждой клетке организма. Он играет ключевую роль в производстве энергии, восстановлении ДНК и регуляции клеточного старения.',
  'NAD+ (nikotinamido adenino dinukleotidas) yra gyvybiškai svarbus kofermentas, esantis kiekvienoje organizmo ląstelėje. Jis atlieka pagrindinį vaidmenį energijos gamyboje, DNR taisyme ir ląstelių senėjimo reguliavime. NAD+ lygis natūraliai mažėja su amžiumi, todėl papildomas vartojimas gali padėti atkurti jaunystės energijos lygį. Šis peptidas gerina smegenų veiklą, pagerina metabolizmą, stiprina imuninę sistemą ir didina bendrą gyvybingumą. Tinka visiems, siekiantiems sumažinti senėjimo požymius ir padidinti energijos lygį.',
  'NAD+ (nicotinamide adenine dinucleotide) is a vital coenzyme found in every cell of the body. It plays a key role in energy production, DNA repair and regulation of cellular aging. NAD+ levels naturally decline with age, so supplementation can help restore youthful energy levels. This peptide improves brain function, boosts metabolism, strengthens the immune system and increases overall vitality. Suitable for anyone looking to reduce signs of aging and increase energy levels.',
  'NAD+ (никотинамидадениндинуклеотид) — жизненно важный кофермент, присутствующий в каждой клетке организма. Он играет ключевую роль в производстве энергии, восстановлении ДНК и регуляции клеточного старения. Уровень NAD+ естественным образом снижается с возрастом, поэтому дополнительный приём может помочь восстановить молодой уровень энергии. Этот пептид улучшает работу мозга, ускоряет метаболизм, укрепляет иммунную систему и повышает общую жизнеспособность. Подходит всем, кто стремится уменьшить признаки старения и повысить уровень энергии.',
  95.00,
  100,
  'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/nad+1000mg.png',
  true,
  1
);

INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 95.00 FROM products WHERE slug = 'nad-plus-1000mg'
UNION ALL
SELECT id, 2, 180.00 FROM products WHERE slug = 'nad-plus-1000mg'
UNION ALL
SELECT id, 5, 400.00 FROM products WHERE slug = 'nad-plus-1000mg';
