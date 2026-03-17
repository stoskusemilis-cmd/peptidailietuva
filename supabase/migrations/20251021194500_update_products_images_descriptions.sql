/*
  # Update Products with Images and Enhanced Descriptions

  ## Changes
  - Add product image URLs for all 5 peptides
  - Update full descriptions with biohacking, sports, and future medicine information
  - Enhanced descriptions focus on molecular benefits and optimization

  ## Products Updated
  1. Retatrutide 15mg - Revolutionary weight management peptide
  2. Glow 70mg - Complete regeneration and anti-aging stack
  3. HGH 15iu - Human growth hormone for performance
  4. IGF-1 LR3 - Advanced muscle growth peptide
  5. Semax 10mg - Cognitive enhancement nootropic
*/

UPDATE products SET
  image_url = '/src/assets/Retatrutide15mg.png',
  full_description = 'Retatrutide yra revoliucinis naujos kartos peptidas, laikomas ateities medicinos proveržiu svorio valdyme ir metabolizmo optimizavime. Šis unikalus junginys veikia per tris skirtingus receptorių tipus (GLP-1, GIP ir glucagon), užtikrindamas maksimalų poveikį metabolizmui.

🔬 BIOHACKING & SPORTO NAUDA:
• Drastiškai padidina riebalų deginimą, išlaikant raumenų masę
• Reguliuoja apetitą ir sumažina alkio pojūtį
• Pagerina insulino jautrumą ir gliukozės metabolizmą
• Mažina висceralinių riebalų kiekį (pavojingiausią riebalų tipą)
• Didina energijos lygį ir bendrą aktyvumą
• Pagerina miego kokybę ir atsigavimą

💪 SPORTININKAMS:
Puikus pasirinkimas „cutting" fazėje - greitai sumažinsite kūno riebalų procentą, išlaikydami visus raumenų audinių. Padeda pasiekti konkurencinę formą be ekstremalių dietų.

🧬 BIOHACKING ENTHUSIASTAMS:
Optimizuokite savo metabolizmą molekuliniu lygiu. Klininiuose tyrimuose dalyviai neteko iki 24% kūno svorio per 48 savaites. Tai ne paprastas peptidas - tai ateities medicina šiandien.

15mg pakuotė užtikrina optimalų dozavimą ir ilgalaikį poveikį. Tinka tiek pradedantiesiems, tiek patyrusiems vartotojams.'
WHERE slug = 'retatrutide-15mg';

UPDATE products SET
  image_url = '/src/assets/Glow70mg.png',
  full_description = 'Glow yra unikalus trijų galingų peptidų derinys (BPC-157, TB-500, GHK-Cu), sukurtas maksimaliai regeneracijai ir atjaunėjimui. Tai ateities medicinos technologija, skirta biologinio amžiaus mažinimui ir organizmo optimizavimui.

🔬 BIOHACKING & ANTI-AGING:
• BPC-157 (10mg) - „Kūno sargybinis" peptidas, skatinantis audinių gijimą ir mažinantis uždegimą
• TB-500 (10mg) - Didina lankstumą, skatina naujų kraujagyslių formavimąsi ir greitina regeneraciją
• GHK-Cu (50mg) - Galingas antioksidantas, skatinantis kolageno sintezę ir DNR atnaujinimą

💪 SPORTININKAMS:
• Spartina atsigavimą po intensyvių treniruočių
• Gydo mikrotraumas ir uždeginius procesus
• Pagerina sąnarių ir sausgyslių būklę
• Mažina lėtinio skausmo simptomus
• Didina audinių elastingumą ir atsparumą

🧬 BIOHACKING EFEKTAI:
• Lėtina senėjimo procesus ląstelių lygmeniu
• Pagerina odos būklę, mažina raukšles
• Skatina naujų neuronų susidarymą smegenyse
• Stiprina imunitetą ir bendrą organizmo atsparumą
• Optimizuoja mitochondrijų funkciją

Tai vienas galingiausių regeneracijos kompleksų rinkoje. Idealus pasirinkimas sportininkams, biohackers bendruomenei ir visiems, siekiantiems maksimalios fizinės būklės.'
WHERE slug = 'glow-70mg';

UPDATE products SET
  image_url = '/src/assets/hgh15iu.png',
  full_description = 'HGH (žmogaus augimo hormonas) yra vienas svarbiausių hormonų mūsų organizme, atsakingas už augimą, regeneraciją ir ląstelių atnaujinimą. Tai ateities medicina, leidžianti optimizuoti savo kūną ant molekulinio lygio.

🔬 BIOHACKING & ANTI-AGING:
• Skatina raumenų masės augimą ir riebalų deginimą
• Didina ląstelių regeneraciją ir kūno atnaujinimą
• Pagerina kaulų tankį ir stiprumą
• Optimizuoja baltymų sintezę organizme
• Lėtina biologinio senėjimo procesus

💪 SPORTININKAMS:
• Drastiškai padidina raumenų masę ir jėgą
• Spartina atsigavimą po treniruočių
• Pagerina ištvermę ir bendrą atletinę formą
• Sumažina riebalų procentą, išlaikant raumenų masę
• Didina energijos lygį ir motyvaciją

🧬 OPTIMIZAVIMO EFEKTAI:
• Pagerina miego kokybę ir gilųjį miegą
• Stiprina imunitetą ir atsparumą ligoms
• Gerina odos elastingumą ir išvaizdą
• Didina libido ir bendrą gyvybingumą
• Pagerina pažintinius gebėjimus ir dėmesį

15iu dozė yra optimali pradedantiesiems ir vidutinio lygio vartotojams. HGH laikomas „svarbiausiuoju" peptidu biohacking bendruomenėje - tai investicija į ilgaamžiškumą ir maksimalią gyvenimo kokybę.'
WHERE slug = 'hgh-15iu';

UPDATE products SET
  image_url = '/src/assets/igf1lr3.png',
  full_description = 'IGF-1 LR3 (Insulin-like Growth Factor) yra modifikuota IGF-1 forma su prailgintu poveikio laiku - tai vienas galingiausių peptidų raumenų augimui ir kūno transformacijai. Šis ateities medicinos produktas veikia ląstelių lygmeniu, optimizuodamas anabolinius procesus.

🔬 BIOHACKING & MOKSLAS:
• Skatina raumenų ląstelių hiperplaziją (naujų ląstelių susidarymą)
• Didina esančių ląstelių dydį (hipertrofija)
• Veikia iki 20 valandų, užtikrindamas ilgalaikį anabolinį poveikį
• Pagerina nutrientų pasisavinimą ir baltymų sintezę
• Optimizuoja gliukozės metabolizmą raumenų audiniuose

💪 SPORTININKAMS:
• Maksimalus raumenų masės augimas
• Spartina atsigavimą ir regeneraciją
• Mažina riebalų kiekį, didinant raumenų masę
• Pagerina raumenų pilnatvę ir tankį
• Didina jėgą ir ištvermę

🧬 BIOHACKING EFEKTAI:
• Optimizuoja anabolinę būseną organizme 24/7
• Pagerina mitochondrijų funkciją
• Didina audinių atsigavimo greitį
• Pagerina sausgyslių ir raiščių stiprumą
• Mažina uždegiminius procesus

Skirtingai nuo įprasto IGF-1, LR3 versija nekonkuruoja su natūraliu IGF-1 ir veikia sistemiškai visame kūne. 1mg pakuotė užtikrina tikslų dozavimą ir maksimalią efektyvumą. Tai pagrindinė priemonė rimtų sportininkų ir biohackers arsenale.'
WHERE slug = 'igf-1-lr3-1mg';

UPDATE products SET
  image_url = '/src/assets/Semax10mg.png',
  full_description = 'Semax yra sintetinis peptidas, sukurtas Rusijos mokslininkų, skirtas smegenų veiklos gerinimui ir pažintinių gebėjimų optimizavimui. Tai nootropinis ateities vaistas, leidžiantis atskleisti visą smegenų potencialą.

🔬 BIOHACKING & NEUROHACKING:
• Skatina BDNF (smegenų neurotrofinio faktoriaus) gamybą
• Didina naujų neuronų susidarymą ir neuroplastiškumą
• Pagerina neurotransmiterių balansą
• Apsaugo nervų ląsteles nuo oksidacinio streso
• Optimizuoja smegenų kraujotaką ir deguonies tiekimą

💪 PROTINEI VEIKLAI:
• Drastiškai pagerina atmintį ir informacijos įsiminimą
• Didina koncentraciją ir dėmesio išlaikymą
• Greitina mąstymo procesus ir sprendimų priėmimą
• Pagerina verbalias ir analitines funkcijas
• Didina mokymosi greitį ir efektyvumą

🧬 OPTIMIZAVIMO EFEKTAI:
• Mažina psichinį ir fizinį nuovargį
• Pagerina nuotaiką ir motyvaciją
• Didina atsparumą stresui ir adaptaciją
• Pagerina pažintinius gebėjimus ilgalaikėje perspektyvoje
• Apsaugo smegenis nuo senėjimo ir neurodegeneracijos

10mg dozė yra optimali kasdieniniam naudojimui. Idealus studentams, profesionalams, sportininkams ir visiems, siekiantiems maksimalios protinės galios. Semax yra vienas labiausiai ištirtų nootropinių peptidų su įrodyta klinikine nauda.

Tai ne stimuliantas - tai pažintinių funkcijų optimizavimo priemonė, veikianti giliu fiziologiniu lygmeniu.'
WHERE slug = 'semax-10mg';
