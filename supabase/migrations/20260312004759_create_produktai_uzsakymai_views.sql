/*
  # Create Produktai and Uzsakymai Views

  1. Views Created
    - `Produktai` — Lithuanian-labeled view of all products with price tiers summary
      - Shows all 16 products with their full info and formatted price tier ranges
    - `Uzsakymai` — Lithuanian-labeled view of all orders with full detail
      - Shows all orders with customer info, items, payment & shipping status

  2. Notes
    - These are read-only views reflecting the underlying products/orders tables
    - Column names are in Lithuanian for clarity in the dashboard
    - Price tiers are aggregated into a min/max range per product
*/

-- =====================
-- VIEW: Produktai
-- =====================
CREATE OR REPLACE VIEW "Produktai" AS
SELECT
  p.id                          AS "ID",
  p.display_order               AS "Eilės numeris",
  p.name                        AS "Pavadinimas",
  p.slug                        AS "Nuoroda (slug)",
  p.description                 AS "Trumpas aprašymas",
  p.full_description            AS "Pilnas aprašymas",
  p.price                       AS "Bazinė kaina (€)",
  COALESCE(
    (SELECT MIN(pt.price) FROM product_price_tiers pt WHERE pt.product_id = p.id),
    p.price
  )                             AS "Min. kaina su nuolaidomis (€)",
  COALESCE(
    (SELECT MAX(pt.quantity) FROM product_price_tiers pt WHERE pt.product_id = p.id),
    1
  )                             AS "Max. kiekis kainos lygiams",
  (SELECT COUNT(*) FROM product_price_tiers pt WHERE pt.product_id = p.id)
                                AS "Kainų lygių skaičius",
  p.image_url                   AS "Nuotraukos URL",
  p.stock                       AS "Sandėlyje",
  p.is_active                   AS "Aktyvus",
  p.created_at                  AS "Sukurta",
  p.updated_at                  AS "Atnaujinta"
FROM products p
ORDER BY p.display_order;

-- =====================
-- VIEW: Uzsakymai
-- =====================
CREATE OR REPLACE VIEW "Uzsakymai" AS
SELECT
  o.id                          AS "ID",
  o.order_number                AS "Užsakymo numeris",
  o.created_at                  AS "Data",
  o.customer_name               AS "Vardas Pavardė",
  o.customer_email              AS "El. paštas",
  o.customer_phone              AS "Telefono numeris",
  o.customer_city               AS "Miestas",
  o.delivery_method             AS "Pristatymo būdas",
  pl.provider                   AS "Paštomato tiekėjas",
  pl.city                       AS "Paštomato miestas",
  pl.address                    AS "Paštomato adresas",
  pl.locker_code                AS "Paštomato kodas",
  o.shipping_address            AS "Pristatymo adresas (JSON)",
  o.subtotal_amount             AS "Tarpinė suma (€)",
  o.shipping_fee                AS "Pristatymo mokestis (€)",
  o.discount_code               AS "Nuolaidos kodas",
  o.discount_percent            AS "Nuolaida (%)",
  o.discount_amount             AS "Nuolaidos suma (€)",
  o.total_amount                AS "Galutinė suma (€)",
  o.payment_method              AS "Mokėjimo būdas",
  o.payment_status              AS "Mokėjimo statusas",
  o.order_status                AS "Užsakymo statusas",
  o.crypto_amount               AS "Crypto suma",
  o.wallet_address              AS "Crypto piniginė",
  o.sol_price_eur               AS "SOL kaina (€)",
  o.transaction_signature       AS "Transakcijos parašas",
  o.payment_confirmed_at        AS "Mokėjimas patvirtintas",
  o.order_items                 AS "Užsakytos prekės (JSON)",
  o.full_order_details          AS "Pilna užsakymo info (JSON)",
  o.notes                       AS "Pastabos",
  o.updated_at                  AS "Atnaujinta"
FROM orders o
LEFT JOIN parcel_lockers pl ON pl.id = o.parcel_locker_id
ORDER BY o.created_at DESC;
