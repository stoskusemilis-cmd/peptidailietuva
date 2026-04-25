/*
  # Add MASTERONE P 1000MG product

  1. New Product
    - `MASTERONE P 1000MG` (slug: masterone-p-1000mg)
    - Drostanolone Propionate – short ester variant of masterone
    - 10ml oil, sterile, ready to use
    - Inserted right after TESTOSTERONE E 2500MG (display_order 21)
    - MASTERONE E 2000MG shifted from display_order 21 to 22

  2. Price Tiers
    - 1 unit -> 60.00 EUR
    - 2 units -> 115.00 EUR
    - 5 units -> 270.00 EUR

  3. Translations
    - Lithuanian (default), English, Russian descriptions provided.

  4. Notes
    - Stock set to 100 so the product is purchasable immediately.
    - No schema changes; only data inserts/updates.
*/

UPDATE products
SET display_order = 22,
    updated_at = now()
WHERE slug = 'masterone-e-2000mg';

INSERT INTO products (
  name, slug, description, full_description,
  price, stock, image_url, is_active, display_order,
  description_en, description_ru, full_description_en, full_description_ru
)
VALUES (
  'MASTERONE P 1000MG',
  'masterone-p-1000mg',
  'Drostanolone Propionate - trumpo veikimo raumenu kokybes ir jegos steroidas',
  'Masterone Propionate 100MG 10ml oil - tai trumpo veikimo Drostanolono propionato preparatas, pasizymintis itin geru ir greitu veikimu. Skirtingai nei ilgo veikimo Masterone Enanthate, propionato versija pradeda veikti zymiai greiciau, todel rezultatai pastebimi vos per kelias dienas. Stabilus hormono lygis pasiekiamas dazniau leidziant, taciau tai leidzia tiksliai kontroliuoti ciklo eiga. Puikiai pagerina raumenu kokybe, didina tankuma ir apibreztuma, mazina vandens susilaikyma, suteikia kietuma ir sausa ismaivinta isvaizda. Antiestrogenines savybes padeda issaugoti svariu raumenu mase ir apsaugo nuo estrogeniniu salutiniu poveikiu. Ypac vertinamas profesionalu prieskonkursiniame periode, kai reikia maksimalaus apibreztumo ir greitos reakcijos i ciklo koregavimus.

10ml oil yra pilnai maksimaliai sterilus ir paruostas naudojimui.',
  60.00,
  100,
  'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/masteronep1000mg.png',
  true,
  21,
  'Drostanolone Propionate - short-acting steroid for muscle quality and strength',
  'Дростанолона пропионат — стероид короткого действия для качества мышц и силы',
  'Masterone Propionate 100MG 10ml oil is a short-acting drostanolone propionate preparation known for its fast and powerful action. Unlike the long-acting Masterone Enanthate, the propionate version begins working much faster, with results visible within just a few days. Stable hormone levels are achieved through more frequent injections, allowing precise cycle control. It significantly improves muscle quality, density and definition, reduces water retention and delivers a hard, dry, conditioned look. Anti-estrogenic properties help preserve lean muscle mass and protect against estrogen-related side effects. Especially valued by professionals during the pre-contest period when maximum definition and rapid cycle adjustments are required.

The 10ml oil is fully sterile and ready for use.',
  'Мастерон Пропионат 100МГ 10мл масло — препарат дростанолона пропионата короткого действия, известный своим быстрым и мощным эффектом. В отличие от длительного Мастерона Энантата, пропионатная версия начинает действовать значительно быстрее, и результаты заметны уже через несколько дней. Стабильный уровень гормона достигается за счёт более частых инъекций, что позволяет точно контролировать ход цикла. Значительно улучшает качество мышц, увеличивает их плотность и рельефность, уменьшает задержку воды и придаёт жёсткий, сухой и проработанный вид. Антиэстрогенные свойства помогают сохранить сухую мышечную массу и защищают от побочных эффектов, связанных с эстрогеном. Особенно ценится профессионалами в предсоревновательный период, когда требуется максимальная рельефность и быстрая реакция на корректировку цикла.

Масло 10мл полностью стерильно и готово к применению.'
);

INSERT INTO product_price_tiers (product_id, quantity, price)
SELECT id, 1, 60.00 FROM products WHERE slug = 'masterone-p-1000mg'
UNION ALL
SELECT id, 2, 115.00 FROM products WHERE slug = 'masterone-p-1000mg'
UNION ALL
SELECT id, 5, 270.00 FROM products WHERE slug = 'masterone-p-1000mg';