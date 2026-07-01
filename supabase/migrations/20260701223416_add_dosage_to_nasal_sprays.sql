-- Add dosage info to all nasal spray descriptions
UPDATE products SET
  description = description || ' Dozavimas: 1-2 purškimai per dieną.',
  full_description = full_description || ' Dozavimas: 1-2 purškimai per dieną.',
  description_en = description_en || ' Dosage: 1-2 sprays per day.',
  full_description_en = full_description_en || ' Dosage: 1-2 sprays per day.',
  description_ru = description_ru || ' Дозировка: 1-2 впрыскивания в день.',
  full_description_ru = full_description_ru || ' Дозировка: 1-2 впрыскивания в день.'
WHERE name LIKE '%NOSIES PURŠKALAS%';