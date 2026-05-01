/*
  # Add HCG 1000IU product

  ## Purpose
  Introduce new product HCG 1000IU, positioned directly after HGH 24IU
  (display_order 11) on the storefront. All products with display_order
  >= 12 are shifted by +1 to make room.

  ## 1. New Data
    - products row:
        slug        = 'hcg-1000iu'
        name        = 'HCG 1000IU'
        price       = 60.00  (base / 1 vnt)
        display_order = 12
        image_url   = public Supabase storage URL
        LT / EN / RU short + long descriptions
    - product_price_tiers rows:
        1 vnt -> 60.00
        2 vnt -> 115.00
        5 vnt -> 260.00

  ## 2. Changes
    - Increment display_order by 1 for every active product whose
      display_order is >= 12 so the new product slots into position 12.

  ## 3. Security
    - Uses existing RLS policies on products / product_price_tiers.
    - No policy changes.
*/

UPDATE products
SET display_order = display_order + 1,
    updated_at = now()
WHERE display_order >= 12;

INSERT INTO products (
  slug, name, description, description_en, description_ru,
  full_description, full_description_en, full_description_ru,
  price, stock, image_url, is_active, display_order
)
VALUES (
  'hcg-1000iu',
  'HCG 1000IU',
  'Chorioninis gonadotropinas - lytinių hormonų ašies atstatymui',
  'Human Chorionic Gonadotropin - restores the natural hormonal axis',
  'Хорионический гонадотропин - восстанавливает гормональную ось',
  'HCG (chorioninis gonadotropinas) yra hormonas, kuris imituoja LH (liuteinizuojantį hormoną) ir tiesiogiai stimuliuoja sėklidžių Leidigo ląsteles gaminti endogeninį testosteroną. Naudojamas po TRT arba anabolinių steroidų ciklų, siekiant atstatyti natūralią HPTA (hipotalamo-hipofizės-sėklidžių) ašies funkciją, išvengti sėklidžių atrofijos ir palaikyti vaisingumą. Moterims naudojamas ovuliacijos indukcijai ir vaisingumo gydymui. Papildoma nauda: padeda išlaikyti libido, energijos lygį, nuotaikos stabilumą ir raumenų masę post-cikle. Forma: liofilizuoti milteliai, praskiedžiami bakteriostatiniu vandeniu. Tipinis protokolas: 250-500 IU 2-3 kartus per savaitę subkutaniškai (po oda).',
  'HCG (Human Chorionic Gonadotropin) is a hormone that mimics LH (luteinizing hormone) and directly stimulates the Leydig cells in the testes to produce endogenous testosterone. It is used after TRT or anabolic steroid cycles to restore the natural HPTA (hypothalamic-pituitary-testicular) axis, prevent testicular atrophy and preserve fertility. In women it is used to induce ovulation and in fertility treatment. Additional benefits: helps maintain libido, energy, mood stability and muscle mass post-cycle. Form: lyophilized powder, reconstituted with bacteriostatic water. Typical protocol: 250-500 IU 2-3 times per week subcutaneously.',
  'HCG (хорионический гонадотропин человека) - это гормон, который имитирует ЛГ (лютеинизирующий гормон) и напрямую стимулирует клетки Лейдига в яичках к выработке эндогенного тестостерона. Применяется после курсов ТЗТ или анаболических стероидов для восстановления естественной оси ГГЯ (гипоталамус-гипофиз-яички), предотвращения атрофии яичек и сохранения фертильности. У женщин используется для индукции овуляции и лечения бесплодия. Дополнительные преимущества: помогает поддерживать либидо, уровень энергии, стабильность настроения и мышечную массу после курса. Форма: лиофилизированный порошок, разводится бактериостатической водой. Типичный протокол: 250-500 МЕ 2-3 раза в неделю подкожно.',
  60.00,
  100,
  'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/hcg1000iu.png',
  true,
  12
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  description_ru = EXCLUDED.description_ru,
  full_description = EXCLUDED.full_description,
  full_description_en = EXCLUDED.full_description_en,
  full_description_ru = EXCLUDED.full_description_ru,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  is_active = true,
  display_order = EXCLUDED.display_order,
  updated_at = now();

INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT p.id, v.quantity, v.price
FROM products p
CROSS JOIN (VALUES (1, 60.00), (2, 115.00), (5, 260.00)) AS v(quantity, price)
WHERE p.slug = 'hcg-1000iu'
ON CONFLICT DO NOTHING;
