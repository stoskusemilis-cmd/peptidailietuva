-- Replace the recommendation text with new formatted version in all nasal spray products
UPDATE products SET
  description = REPLACE(description, 'Rekomenduojama įpilti 5ml BAC vandens, 5ml sterilaus vandens. Koncentracija 1mg/ml. Vienas paspaudimas 120mcg. Viso 80 įpurškimų. Dozavimas: 1-2 purškimai per dieną.', 'Bendras tūris 10ml. 5ml BAC vandens, 5ml sterilaus vandens. Koncentracija 1mg/ml. Vienas paspaudimas 120mcg. Viso 80 įpurškimų. Dozavimas: 1-2 purškimai per dieną.'),
  full_description = REPLACE(full_description, 'Rekomenduojama įpilti 5ml BAC vandens, 5ml sterilaus vandens. Koncentracija 1mg/ml. Vienas paspaudimas 120mcg. Viso 80 įpurškimų. Dozavimas: 1-2 purškimai per dieną.', E'Bendras tūris 10ml\n5ml BAC vandens, 5ml sterilaus vandens.\nKoncentracija 1mg/ml.\nVienas paspaudimas 120mcg. Viso 80 įpurškimų.\nDozavimas: 1-2 purškimai per dieną.')
WHERE name LIKE '%NOSIES PURŠKALAS%';

-- Also update EN versions
UPDATE products SET
  description_en = REPLACE(description_en, 'Recommended: add 5ml BAC water, 5ml sterile water. Concentration 1mg/ml. One spray 120mcg. Total 80 sprays. Dosage: 1-2 sprays per day.', 'Total volume 10ml. 5ml BAC water, 5ml sterile water. Concentration 1mg/ml. One spray 120mcg. Total 80 sprays. Dosage: 1-2 sprays per day.'),
  full_description_en = REPLACE(full_description_en, 'Recommended: add 5ml BAC water, 5ml sterile water. Concentration 1mg/ml. One spray 120mcg. Total 80 sprays. Dosage: 1-2 sprays per day.', E'Total volume 10ml\n5ml BAC water, 5ml sterile water.\nConcentration 1mg/ml.\nOne spray 120mcg. Total 80 sprays.\nDosage: 1-2 sprays per day.')
WHERE name LIKE '%NOSIES PURŠKALAS%';

-- Also update RU versions
UPDATE products SET
  description_ru = REPLACE(description_ru, 'Рекомендуется добавить 5мл BAC воды, 5мл стерильной воды. Концентрация 1мг/мл. Одно нажатие 120мкг. Всего 80 впрыскиваний. Дозировка: 1-2 впрыскивания в день.', 'Общий объём 10мл. 5мл BAC воды, 5мл стерильной воды. Концентрация 1мг/мл. Одно нажатие 120мкг. Всего 80 впрыскиваний. Дозировка: 1-2 впрыскивания в день.'),
  full_description_ru = REPLACE(full_description_ru, 'Рекомендуется добавить 5мл BAC воды, 5мл стерильной воды. Концентрация 1мг/мл. Одно нажатие 120мкг. Всего 80 впрыскиваний. Дозировка: 1-2 впрыскивания в день.', E'Общий объём 10мл\n5мл BAC воды, 5мл стерильной воды.\nКонцентрация 1мг/мл.\nОдно нажатие 120мкг. Всего 80 впрыскиваний.\nДозировка: 1-2 впрыскивания в день.')
WHERE name LIKE '%NOSIES PURŠKALAS%';
