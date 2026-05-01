/*
  # Trim HCG 1000IU description

  ## Purpose
  Remove the dosage/form sentence from all three language descriptions
  for HCG 1000IU.

  ## 1. Changes
    - products.full_description / full_description_en / full_description_ru
      updated for slug 'hcg-1000iu', dropping the final sentence about
      form and typical protocol.

  ## 2. Security
    - No RLS or policy changes.
*/

UPDATE products
SET
  full_description = 'HCG (chorioninis gonadotropinas) yra hormonas, kuris imituoja LH (liuteinizuojantį hormoną) ir tiesiogiai stimuliuoja sėklidžių Leidigo ląsteles gaminti endogeninį testosteroną. Naudojamas po TRT arba anabolinių steroidų ciklų, siekiant atstatyti natūralią HPTA (hipotalamo-hipofizės-sėklidžių) ašies funkciją, išvengti sėklidžių atrofijos ir palaikyti vaisingumą. Moterims naudojamas ovuliacijos indukcijai ir vaisingumo gydymui. Papildoma nauda: padeda išlaikyti libido, energijos lygį, nuotaikos stabilumą ir raumenų masę post-cikle.',
  full_description_en = 'HCG (Human Chorionic Gonadotropin) is a hormone that mimics LH (luteinizing hormone) and directly stimulates the Leydig cells in the testes to produce endogenous testosterone. It is used after TRT or anabolic steroid cycles to restore the natural HPTA (hypothalamic-pituitary-testicular) axis, prevent testicular atrophy and preserve fertility. In women it is used to induce ovulation and in fertility treatment. Additional benefits: helps maintain libido, energy, mood stability and muscle mass post-cycle.',
  full_description_ru = 'HCG (хорионический гонадотропин человека) - это гормон, который имитирует ЛГ (лютеинизирующий гормон) и напрямую стимулирует клетки Лейдига в яичках к выработке эндогенного тестостерона. Применяется после курсов ТЗТ или анаболических стероидов для восстановления естественной оси ГГЯ (гипоталамус-гипофиз-яички), предотвращения атрофии яичек и сохранения фертильности. У женщин используется для индукции овуляции и лечения бесплодия. Дополнительные преимущества: помогает поддерживать либидо, уровень энергии, стабильность настроения и мышечную массу после курса.',
  updated_at = now()
WHERE slug = 'hcg-1000iu';
