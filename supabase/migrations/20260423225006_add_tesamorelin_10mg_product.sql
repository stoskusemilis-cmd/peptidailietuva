/*
  # Add TESAMORELIN 10MG product

  ## Purpose
  Introduce a new peptide listing, placed directly after MOTS-C 40MG in the
  catalog order.

  ## Changes
    1. Shift `display_order` for every currently active product positioned
       after MOTS-C 40MG (display_order >= 5) by +1 to make room.
    2. Insert `tesamorelin-10mg` product with LT/EN/RU descriptions,
       base price 70.00, in stock, display_order 5.
    3. Insert price tiers: 1 unit = 70.00, 2 units = 135.00, 5 units = 300.00.

  ## Notes
    - Uses ON CONFLICT guards so the migration is idempotent.
    - No destructive operations; RLS policies untouched.
*/

UPDATE products
SET display_order = display_order + 1,
    updated_at = now()
WHERE display_order >= 5
  AND slug <> 'tesamorelin-10mg';

INSERT INTO products (
  name,
  slug,
  description,
  full_description,
  description_en,
  full_description_en,
  description_ru,
  full_description_ru,
  price,
  stock,
  image_url,
  is_active,
  display_order
) VALUES (
  'TESAMORELIN 10MG',
  'tesamorelin-10mg',
  'Augimo hormono atpalaidavimo peptidas pilvo riebalų mažinimui ir kūno sudėties gerinimui',
  'Tesamorelin yra sintetinis augimo hormoną atpalaiduojančio hormono (GHRH) analogas, pasižymintis stipriu ir selektyviu poveikiu endogeninio augimo hormono sekrecijai iš hipofizės. Klinikiniai tyrimai rodo, kad Tesamorelin reikšmingai mažina visceralinį pilvo riebalinį audinį, gerina IGF-1 lygį bei lipidų profilį, neveikdamas gliukozės tolerancijos. Nauda: ryškus visceralinio riebalo sumažėjimas, geresnė kūno sudėtis, didesnis raumenų masės išlaikymas deficito metu, pagerėjęs odos elastingumas, stipresnis gilus miegas, greitesnis pasveikimas ir bendras vitališkumo padidėjimas. Ypač vertinamas tiems, kurie siekia tikslingai sumažinti užsispyrusius pilvo riebalus ir kartu pagerinti metabolinę sveikatą bei augimo hormono ašies veiklą.',
  'Growth hormone releasing peptide for visceral fat reduction and body composition improvement',
  'Tesamorelin is a synthetic analog of growth hormone-releasing hormone (GHRH) with potent and selective action on endogenous growth hormone secretion from the pituitary. Clinical studies show Tesamorelin significantly reduces visceral abdominal adipose tissue, improves IGF-1 levels and lipid profile without negatively affecting glucose tolerance. Benefits: marked reduction in visceral fat, improved body composition, better lean mass retention during caloric deficit, enhanced skin elasticity, deeper sleep, faster recovery and overall increase in vitality. Particularly valued by those aiming to target stubborn abdominal fat while simultaneously improving metabolic health and the growth hormone axis.',
  'Пептид, стимулирующий выброс гормона роста, для уменьшения висцерального жира и улучшения композиции тела',
  'Тесаморелин - синтетический аналог рилизинг-гормона гормона роста (GHRH) с мощным и избирательным действием на эндогенную секрецию гормона роста гипофизом. Клинические исследования показывают, что тесаморелин значительно снижает висцеральную абдоминальную жировую ткань, улучшает уровень IGF-1 и липидный профиль, не ухудшая толерантность к глюкозе. Преимущества: выраженное уменьшение висцерального жира, улучшенная композиция тела, лучшее сохранение мышечной массы в дефиците, повышение упругости кожи, более глубокий сон, ускоренное восстановление и общий подъём жизненного тонуса. Особенно ценится теми, кто стремится целенаправленно уменьшить упорный абдоминальный жир и одновременно улучшить метаболическое здоровье и работу оси гормона роста.',
  70.00,
  100,
  'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/tesamorelin10mg.png',
  true,
  5
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  full_description = EXCLUDED.full_description,
  description_en = EXCLUDED.description_en,
  full_description_en = EXCLUDED.full_description_en,
  description_ru = EXCLUDED.description_ru,
  full_description_ru = EXCLUDED.full_description_ru,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  is_active = true,
  display_order = EXCLUDED.display_order,
  updated_at = now();

DO $$
DECLARE
  pid uuid;
  r RECORD;
BEGIN
  SELECT id INTO pid FROM products WHERE slug = 'tesamorelin-10mg';
  IF pid IS NULL THEN
    RETURN;
  END IF;

  FOR r IN SELECT * FROM (VALUES
    (1, 70.00),
    (2, 135.00),
    (5, 300.00)
  ) AS v(quantity, price) LOOP
    IF EXISTS (SELECT 1 FROM product_price_tiers WHERE product_id = pid AND quantity = r.quantity) THEN
      UPDATE product_price_tiers SET price = r.price WHERE product_id = pid AND quantity = r.quantity;
    ELSE
      INSERT INTO product_price_tiers (product_id, quantity, price) VALUES (pid, r.quantity, r.price);
    END IF;
  END LOOP;
END $$;
