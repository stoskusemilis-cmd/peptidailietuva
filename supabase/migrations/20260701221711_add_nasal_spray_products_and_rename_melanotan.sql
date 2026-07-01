-- Rename MELANOTAN 1 10MG to MELANOTAN I 10MG
UPDATE products SET name = 'MELANOTAN I 10MG', slug = 'melanotan-i-10mg' WHERE id = 'e01030fb-5e7c-4515-8a8f-9ad8f727c33d';

-- Add MELANOTAN I 10MG nosies purškalas (after MELANOTAN I 10MG at display_order 110)
INSERT INTO products (id, name, slug, description, full_description, price, stock, image_url, is_active, display_order, description_en, description_ru, full_description_en, full_description_ru)
VALUES (
  gen_random_uuid(),
  'MELANOTAN I 10MG NOSIES PURŠKALAS',
  'melanotan-i-10mg-nosies-purskalas',
  'Melanotan I 10mg nosies purškalas (10ml) - paruoštas naudojimui nazalinis purškalas natūraliam įdegiui. Siunčiame atskirai: peptidą ir paruošimo priemones (BAC vandenį, sterilų vandenį, švirkštą) nemokamai, kad produktas būtų šviežias.',
  'Melanotan I 10mg nosies purškalas (10ml) - paruoštas naudojimui nazalinis purškalas natūraliam įdegiui be saulės. Siunčiame produktus atskirai: peptidą ir paruošimo priemones (BAC vandenį, sterilų vandenį, švirkštą) nemokamai. Taip užtikriname, kad produktas nestovėjo ilgai ir patys lengvai įpilsite. Melanotan I (Afamelanotide) yra saugesnė melanocitus stimuliuojanti alternatyva su mažiau šalutinių poveikių nei MT-II.',
  50.00,
  100,
  'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/melanotan1purskalas.png',
  true,
  115,
  'Melanotan I 10mg nasal spray (10ml) - ready-to-use nasal spray for natural tanning. Shipped separately: peptide and preparation supplies (BAC water, sterile water, syringe) included free for freshness.',
  'Melanotan I 10mg назальный спрей (10мл) - готовый к использованию назальный спрей для натурального загара. Отправляем отдельно: пептид и средства подготовки (BAC вода, стерильная вода, шприц) бесплатно.',
  'Melanotan I 10mg nasal spray (10ml) - ready-to-use nasal spray for natural tanning without sun exposure. We ship products separately: peptide and preparation supplies (BAC water, sterile water, syringe) included free. This ensures the product stays fresh and you can easily prepare it yourself. Melanotan I (Afamelanotide) is a safer melanocyte-stimulating alternative with fewer side effects than MT-II.',
  'Melanotan I 10mg назальный спрей (10мл) - готовый к использованию назальный спрей для натурального загара без солнца. Отправляем продукты отдельно: пептид и средства подготовки (BAC вода, стерильная вода, шприц) бесплатно. Так обеспечиваем свежесть продукта и легкость подготовки.'
);

-- Add MELANOTAN II 10MG NOSIES PURŠKALAS (after MELANOTAN II 10MG at display_order 120)
INSERT INTO products (id, name, slug, description, full_description, price, stock, image_url, is_active, display_order, description_en, description_ru, full_description_en, full_description_ru)
VALUES (
  gen_random_uuid(),
  'MELANOTAN II 10MG NOSIES PURŠKALAS',
  'melanotan-ii-10mg-nosies-purskalas',
  'Melanotan II 10mg nosies purškalas (10ml) - paruoštas naudojimui nazalinis purškalas įdegiui ir metabolizmui. Siunčiame atskirai: peptidą ir paruošimo priemones (BAC vandenį, sterilų vandenį, švirkštą) nemokamai, kad produktas būtų šviežias.',
  'Melanotan II 10mg nosies purškalas (10ml) - paruoštas naudojimui nazalinis purškalas įdegiui ir metabolizmui. Siunčiame produktus atskirai: peptidą ir paruošimo priemones (BAC vandenį, sterilų vandenį, švirkštą) nemokamai. Taip užtikriname, kad produktas nestovėjo ilgai ir patys lengvai įpilsite. Melanotan II yra populiariausias melanocitus stimuliuojantis peptidas vasaros sezonui.',
  50.00,
  100,
  'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/melanotan210mg.PNG',
  true,
  125,
  'Melanotan II 10mg nasal spray (10ml) - ready-to-use nasal spray for tanning and metabolism. Shipped separately: peptide and preparation supplies (BAC water, sterile water, syringe) included free for freshness.',
  'Melanotan II 10mg назальный спрей (10мл) - готовый к использованию назальный спрей для загара и метаболизма. Отправляем отдельно: пептид и средства подготовки (BAC вода, стерильная вода, шприц) бесплатно.',
  'Melanotan II 10mg nasal spray (10ml) - ready-to-use nasal spray for tanning and metabolism. We ship products separately: peptide and preparation supplies (BAC water, sterile water, syringe) included free. This ensures the product stays fresh and you can easily prepare it yourself. Melanotan II is the most popular melanocyte-stimulating peptide for summer season.',
  'Melanotan II 10mg назальный спрей (10мл) - готовый к использованию назальный спрей для загара и метаболизма. Отправляем продукты отдельно: пептид и средства подготовки (BAC вода, стерильная вода, шприц) бесплатно. Так обеспечиваем свежесть продукта.'
);

-- Add SEMAX 10MG NOSIES PURŠKALAS (after SEMAX 10MG at display_order 210)
INSERT INTO products (id, name, slug, description, full_description, price, stock, image_url, is_active, display_order, description_en, description_ru, full_description_en, full_description_ru)
VALUES (
  gen_random_uuid(),
  'SEMAX 10MG NOSIES PURŠKALAS',
  'semax-10mg-nosies-purskalas',
  'Semax 10mg nosies purškalas (10ml) - paruoštas naudojimui nazalinis purškalas protinei veiklai ir koncentracijai. Siunčiame atskirai: peptidą ir paruošimo priemones (BAC vandenį, sterilų vandenį, švirkštą) nemokamai, kad produktas būtų šviežias.',
  'Semax 10mg nosies purškalas (10ml) - paruoštas naudojimui nazalinis purškalas protinei veiklai, atminčiai ir koncentracijai gerinti. Siunčiame produktus atskirai: peptidą ir paruošimo priemones (BAC vandenį, sterilų vandenį, švirkštą) nemokamai. Taip užtikriname, kad produktas nestovėjo ilgai ir patys lengvai įpilsite. Semax yra nootropinis neuropeptidas, sukurtas Rusijoje, pagerinantis kognityvinę funkciją.',
  50.00,
  100,
  'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/semax10purskalas.png',
  true,
  215,
  'Semax 10mg nasal spray (10ml) - ready-to-use nasal spray for cognitive function and focus. Shipped separately: peptide and preparation supplies (BAC water, sterile water, syringe) included free for freshness.',
  'Semax 10mg назальный спрей (10мл) - готовый к использованию назальный спрей для когнитивной функции и концентрации. Отправляем отдельно: пептид и средства подготовки (BAC вода, стерильная вода, шприц) бесплатно.',
  'Semax 10mg nasal spray (10ml) - ready-to-use nasal spray for cognitive function, memory and focus. We ship products separately: peptide and preparation supplies (BAC water, sterile water, syringe) included free. This ensures the product stays fresh and you can easily prepare it yourself. Semax is a nootropic neuropeptide developed in Russia that improves cognitive function.',
  'Semax 10mg назальный спрей (10мл) - готовый к использованию назальный спрей для когнитивной функции, памяти и концентрации. Отправляем продукты отдельно: пептид и средства подготовки (BAC вода, стерильная вода, шприц) бесплатно. Semax — ноотропный нейропептид, разработанный в России.'
);

-- Add SELANK 10MG NOSIES PURŠKALAS (after SELANK 10MG at display_order 200)
INSERT INTO products (id, name, slug, description, full_description, price, stock, image_url, is_active, display_order, description_en, description_ru, full_description_en, full_description_ru)
VALUES (
  gen_random_uuid(),
  'SELANK 10MG NOSIES PURŠKALAS',
  'selank-10mg-nosies-purskalas',
  'Selank 10mg nosies purškalas (10ml) - paruoštas naudojimui nazalinis purškalas nerimui mažinti ir nuotaikai gerinti. Siunčiame atskirai: peptidą ir paruošimo priemones (BAC vandenį, sterilų vandenį, švirkštą) nemokamai, kad produktas būtų šviežias.',
  'Selank 10mg nosies purškalas (10ml) - paruoštas naudojimui nazalinis purškalas nerimui mažinti ir nuotaikai gerinti. Siunčiame produktus atskirai: peptidą ir paruošimo priemones (BAC vandenį, sterilų vandenį, švirkštą) nemokamai. Taip užtikriname, kad produktas nestovėjo ilgai ir patys lengvai įpilsite. Selank yra nootropinis ir anksiolizinis peptidas, veiksmingas streso valdymui.',
  50.00,
  100,
  'https://ghupwlhgageynpdegxkf.supabase.co/storage/v1/object/public/produktunuotraukos/selank10purskalas.png',
  true,
  205,
  'Selank 10mg nasal spray (10ml) - ready-to-use nasal spray for anxiety relief and mood improvement. Shipped separately: peptide and preparation supplies (BAC water, sterile water, syringe) included free for freshness.',
  'Selank 10mg назальный спрей (10мл) - готовый к использованию назальный спрей для снижения тревоги и улучшения настроения. Отправляем отдельно: пептид и средства подготовки (BAC вода, стерильная вода, шприц) бесплатно.',
  'Selank 10mg nasal spray (10ml) - ready-to-use nasal spray for anxiety relief and mood improvement. We ship products separately: peptide and preparation supplies (BAC water, sterile water, syringe) included free. This ensures the product stays fresh and you can easily prepare it yourself. Selank is a nootropic and anxiolytic peptide effective for stress management.',
  'Selank 10mg назальный спрей (10мл) - готовый к использованию назальный спрей для снижения тревоги и улучшения настроения. Отправляем продукты отдельно: пептид и средства подготовки (BAC вода, стерильная вода, шприц) бесплатно. Selank — ноотропный и анксиолитический пептид для управления стрессом.'
);
