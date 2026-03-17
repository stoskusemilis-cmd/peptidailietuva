/*
  # Kainų pakopos visiem produktams

  Kiekvienas produktas turi kainos pakopas pagal kiekį.
  2 vnt. paprastai ~5% pigiau, 5 vnt. ~15% pigiau.
*/

DO $$
DECLARE
  p_nad uuid;
  p_glut uuid;
  p_reta15 uuid;
  p_reta30 uuid;
  p_mel uuid;
  p_ghk uuid;
  p_glow uuid;
  p_klow uuid;
  p_hgh15 uuid;
  p_hgh24 uuid;
  p_igf uuid;
  p_cjc uuid;
  p_semax uuid;
  p_amino uuid;
  p_test uuid;
  p_mast uuid;
BEGIN
  SELECT id INTO p_nad FROM products WHERE slug = 'nad-plus-500mg';
  SELECT id INTO p_glut FROM products WHERE slug = 'glutathione-600mg';
  SELECT id INTO p_reta15 FROM products WHERE slug = 'retatrutide-15mg-standard';
  SELECT id INTO p_reta30 FROM products WHERE slug = 'retatrutide-15mg-premium';
  SELECT id INTO p_mel FROM products WHERE slug = 'melanotan-ii-10mg';
  SELECT id INTO p_ghk FROM products WHERE slug = 'ghk-cu-100mg';
  SELECT id INTO p_glow FROM products WHERE slug = 'glow-70mg';
  SELECT id INTO p_klow FROM products WHERE slug = 'klow-80mg';
  SELECT id INTO p_hgh15 FROM products WHERE slug = 'hgh-15iu';
  SELECT id INTO p_hgh24 FROM products WHERE slug = 'hgh-24iu';
  SELECT id INTO p_igf FROM products WHERE slug = 'igf-1-lr3-1mg';
  SELECT id INTO p_cjc FROM products WHERE slug = 'cjc1295-ipa-5mg';
  SELECT id INTO p_semax FROM products WHERE slug = 'semax-10mg';
  SELECT id INTO p_amino FROM products WHERE slug = '5-amino-1mq-10mg';
  SELECT id INTO p_test FROM products WHERE slug = 'testosterone-e-2500mg';
  SELECT id INTO p_mast FROM products WHERE slug = 'masterone-e-2000mg';

  INSERT INTO product_price_tiers (product_id, quantity, price) VALUES
    (p_nad,   1, 50.00),
    (p_nad,   2, 95.00),
    (p_nad,   5, 220.00),
    (p_glut,  1, 50.00),
    (p_glut,  2, 95.00),
    (p_glut,  5, 220.00),
    (p_reta15, 1, 60.00),
    (p_reta15, 2, 115.00),
    (p_reta15, 5, 270.00),
    (p_reta30, 1, 110.00),
    (p_reta30, 2, 210.00),
    (p_mel,   1, 40.00),
    (p_mel,   2, 75.00),
    (p_mel,   5, 175.00),
    (p_ghk,   1, 45.00),
    (p_ghk,   2, 85.00),
    (p_ghk,   5, 200.00),
    (p_glow,  1, 55.00),
    (p_glow,  2, 105.00),
    (p_glow,  5, 245.00),
    (p_klow,  1, 60.00),
    (p_klow,  2, 115.00),
    (p_klow,  5, 270.00),
    (p_hgh15, 1, 25.00),
    (p_hgh15, 2, 47.00),
    (p_hgh15, 5, 110.00),
    (p_hgh24, 1, 35.00),
    (p_hgh24, 2, 65.00),
    (p_hgh24, 5, 140.00),
    (p_igf,   1, 55.00),
    (p_igf,   2, 105.00),
    (p_igf,   5, 245.00),
    (p_cjc,   1, 50.00),
    (p_cjc,   2, 95.00),
    (p_cjc,   5, 220.00),
    (p_semax, 1, 35.00),
    (p_semax, 2, 65.00),
    (p_semax, 5, 150.00),
    (p_amino, 1, 45.00),
    (p_amino, 2, 85.00),
    (p_amino, 5, 200.00),
    (p_test,  1, 45.00),
    (p_test,  2, 85.00),
    (p_test,  5, 200.00),
    (p_mast,  1, 55.00),
    (p_mast,  2, 105.00),
    (p_mast,  5, 245.00)
  ON CONFLICT (product_id, quantity) DO NOTHING;
END $$;
