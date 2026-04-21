/*
  # Add MOTS-C 40MG product

  ## Purpose
  Introduce new product MOTS-C 40MG, positioned directly after
  GLUTATHIONE 600MG (display_order 3). All products with display_order
  >= 4 are shifted by +1 to make room.

  ## 1. New Data
    - products row:
        slug          = 'mots-c-40mg'
        name          = 'MOTS-C 40MG'
        price         = 90.00  (base / 1 vnt)
        display_order = 4
        image_url     = public Supabase storage URL
        LT / EN / RU short + long descriptions
    - product_price_tiers rows:
        1 vnt -> 90.00
        2 vnt -> 170.00
        5 vnt -> 400.00

  ## 2. Changes
    - Increment display_order by 1 for every product whose
      display_order is >= 4 so the new product slots into position 4.

  ## 3. Security
    - Uses existing RLS policies on products / product_price_tiers.
    - No policy changes.
*/

UPDATE products
SET display_order = display_order + 1,
    updated_at = now()
WHERE display_order >= 4;

INSERT INTO products (
  slug, name, description, description_en, description_ru,
  full_description, full_description_en, full_description_ru,
  price, stock, image_url, is_active, display_order
)
VALUES (
  'mots-c-40mg',
  'MOTS-C 40MG',
  'Mitochondrinis peptidas energijai, medžiagų apykaitai ir ilgaamžiškumui',
  'Mitochondrial peptide for energy, metabolism and longevity',
  'Митохондриальный пептид для энергии, метаболизма и долголетия',
  'MOTS-C yra 16 aminorūgščių mitochondrinis peptidas, koduojamas mitochondrijų DNR, kuris veikia kaip pagrindinis medžiagų apykaitos reguliatorius. Aktyvuoja AMPK signalinį kelią, gerina insulino jautrumą ir skatina gliukozės pasisavinimą raumenyse. Moksliniai tyrimai rodo, kad MOTS-C padidina mitochondrijų efektyvumą, sumažina riebalinį audinį (ypač visceralinį), apsaugo nuo su amžiumi susijusio insulino atsparumo ir nutukimo. Nauda: daugiau energijos ir ištvermės, greitesnis atsigavimas po treniruočių, pagerėjęs medžiagų apykaitos greitis, uždegimo mažinimas, potencialus anti-aging efektas per mitochondrijų biogenezę. Ypač naudingas sportininkams, norintiems gerinti aerobinį pajėgumą, bei žmonėms, siekiantiems pagerinti kūno sudėtį ir metabolinę sveikatą.',
  'MOTS-C is a 16 amino acid mitochondrial-derived peptide encoded by mitochondrial DNA that acts as a master metabolic regulator. It activates the AMPK signaling pathway, improves insulin sensitivity and promotes glucose uptake in muscle tissue. Research shows MOTS-C enhances mitochondrial efficiency, reduces body fat (especially visceral fat), and protects against age-related insulin resistance and obesity. Benefits: increased energy and endurance, faster recovery from training, improved metabolic rate, reduced inflammation, potential anti-aging effect through mitochondrial biogenesis. Particularly useful for athletes looking to improve aerobic capacity and for individuals seeking better body composition and metabolic health.',
  'MOTS-C - это митохондриальный пептид из 16 аминокислот, кодируемый митохондриальной ДНК, который действует как главный регулятор метаболизма. Активирует сигнальный путь AMPK, улучшает чувствительность к инсулину и способствует усвоению глюкозы мышечной тканью. Исследования показывают, что MOTS-C повышает эффективность митохондрий, снижает жировую массу (особенно висцеральный жир) и защищает от возрастной инсулинорезистентности и ожирения. Преимущества: больше энергии и выносливости, быстрое восстановление после тренировок, ускоренный метаболизм, снижение воспаления, потенциальный антивозрастной эффект через биогенез митохондрий. Особенно полезен спортсменам для улучшения аэробных показателей и людям, стремящимся улучшить композицию тела и метаболическое здоровье.',
  90.00,
  100,
  'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/motsc40mg.png',
  true,
  4
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
CROSS JOIN (VALUES (1, 90.00), (2, 170.00), (5, 400.00)) AS v(quantity, price)
WHERE p.slug = 'mots-c-40mg'
ON CONFLICT DO NOTHING;
