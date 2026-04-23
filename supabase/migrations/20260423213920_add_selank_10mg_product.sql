/*
  # Add SELANK 10MG product

  ## Purpose
  Introduce a new product "SELANK 10MG" to the catalog, together with its
  multi-quantity price tiers.

  ## 1. New Data
    - products: SELANK 10MG (slug: selank-10mg)
      - price: 35.00 EUR (base / 1 vnt)
      - image_url: Supabase Storage asset provided by operator
      - Multilingual short and full descriptions (LT / EN / RU)
    - product_price_tiers for selank-10mg:
      - 1 vnt  -> 35.00 EUR
      - 2 vnt  -> 65.00 EUR
      - 5 vnt  -> 150.00 EUR

  ## 2. Ordering
    - display_order set to MAX(display_order)+1 so it appears at the end
      unless re-sorted later.

  ## 3. Security
    - No RLS or policy changes. Existing products / product_price_tiers
      policies apply.
*/

INSERT INTO products (
  name, slug, description, full_description,
  description_en, description_ru,
  full_description_en, full_description_ru,
  price, stock, image_url, is_active, display_order
)
VALUES (
  'SELANK 10MG',
  'selank-10mg',
  'Nootropinis peptidas nerimui mažinti ir nuotaikai gerinti',
  'Selank yra sintetinis heptapeptidas, sukurtas Rusijos medicinos mokslų akademijoje kaip natūralaus tuftsino analogas. Tai pažangus nootropikas, pasižymintis stipriu anksiolitiniu (nerimą mažinančiu) poveikiu, nesukeliantis priklausomybės, mieguistumo ar pažintinių funkcijų slopinimo – skirtingai nei tradiciniai raminamieji. Selank moduliuoja serotonino, dopamino ir GABA neuromediatorius, kartu skatindamas BDNF raišką, todėl palaipsniui stiprina emocinį atsparumą, gerina nuotaiką ir pažintinę veiklą. Nauda: sumažintas nerimas ir stresas, aiškesnis mąstymas, geresnė atmintis bei koncentracija, stabilesnė nuotaika, geresnė miego kokybė, stiprinama imuninė sistema per interleukinų reguliavimą. 10 mg dozė yra optimali kasdieniam naudojimui – idealus pasirinkimas profesionalams, dirbantiems didelio streso aplinkoje, studentams egzaminų laikotarpiu ir visiems, siekiantiems aiškesnio proto bei emocinės pusiausvyros be stimuliantų šalutinio poveikio.',
  'Nootropic peptide for anxiety relief and mood support',
  'Ноотропный пептид для снижения тревожности и улучшения настроения',
  'Selank is a synthetic heptapeptide developed by the Russian Academy of Medical Sciences as an analogue of the natural immunomodulator tuftsin. It is an advanced nootropic with a strong anxiolytic (anti-anxiety) action that does not cause dependence, drowsiness or cognitive impairment – unlike traditional tranquilizers. Selank modulates serotonin, dopamine and GABA neurotransmitters while stimulating BDNF expression, progressively building emotional resilience, improving mood and enhancing cognition. Benefits: reduced anxiety and stress, clearer thinking, improved memory and concentration, stable mood, better sleep quality, strengthened immune system through interleukin regulation. The 10 mg dose is optimal for daily use – an ideal choice for professionals working in high-stress environments, students during exams and anyone seeking mental clarity and emotional balance without the side effects of stimulants.',
  'Селанк — синтетический гептапептид, разработанный Российской академией медицинских наук как аналог природного иммуномодулятора тафтсина. Это современный ноотроп с выраженным анксиолитическим (противотревожным) действием, не вызывающий зависимости, сонливости или снижения когнитивных функций — в отличие от классических транквилизаторов. Селанк модулирует нейромедиаторы серотонина, дофамина и ГАМК, одновременно стимулируя экспрессию BDNF, что постепенно повышает эмоциональную устойчивость, улучшает настроение и когнитивные функции. Преимущества: снижение тревоги и стресса, ясность мышления, улучшение памяти и концентрации, стабильное настроение, качественный сон, укрепление иммунитета через регуляцию интерлейкинов. Доза 10 мг оптимальна для ежедневного применения — идеальный выбор для профессионалов в условиях высокого стресса, студентов в период экзаменов и всех, кто стремится к ясности ума и эмоциональному балансу без побочных эффектов стимуляторов.',
  35.00,
  100,
  'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/selank10mg.png',
  true,
  (SELECT COALESCE(MAX(display_order), 0) + 1 FROM products)
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  full_description = EXCLUDED.full_description,
  description_en = EXCLUDED.description_en,
  description_ru = EXCLUDED.description_ru,
  full_description_en = EXCLUDED.full_description_en,
  full_description_ru = EXCLUDED.full_description_ru,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  is_active = true,
  updated_at = now();

INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT p.id, v.quantity, v.price
FROM products p
CROSS JOIN (VALUES
  (1, 35.00),
  (2, 65.00),
  (5, 150.00)
) AS v(quantity, price)
WHERE p.slug = 'selank-10mg'
  AND NOT EXISTS (
    SELECT 1 FROM product_price_tiers t
    WHERE t.product_id = p.id AND t.quantity = v.quantity
  );
