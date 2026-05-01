/*
  # Security hardening: views, functions, extensions, RLS, storage

  1. Views
    - Recreate `Produktai`, `Uzsakymai`, `v_daily_revenue`, `v_low_stock_alerts`,
      `v_order_full`, `v_payment_timeline`, `v_product_stock_history` with
      `security_invoker = on` so they run with the caller's privileges.

  2. Functions (pin search_path)
    - `increment_discount_usage`
    - `generate_order_number`
    - `update_updated_at`
    - `update_updated_at_column`
    - `log_inventory_change`
    - `log_payment_status_change`
    - `log_order_creation`

  3. Extensions
    - Move `pg_net` from `public` schema to a new `extensions` schema by
      dropping and recreating the extension (pg_net does not support
      ALTER EXTENSION ... SET SCHEMA). The cron job that calls `net.http_post`
      is unscheduled before the drop and rescheduled afterwards.

  4. RLS Policies
    - Drop "always-true" admin write policies for `discount_codes`, `order_items`,
      `orders`, `parcel_lockers`, `product_price_tiers`, `products`. These tables
      are managed via service_role (Edge Functions / dashboard), which bypasses RLS.
    - Replace permissive INSERT policies for anonymous order creation with
      restrictive WITH CHECK clauses that force initial state and basic validation.

  5. Storage
    - Drop broad public SELECT policy on `product-images`. The bucket is public,
      so direct object URLs continue to work without listing capability.

  6. RLS for log tables
    - Add explicit deny-all policies to `inventory_log` and `payment_events`
      so the lint stops complaining about RLS-enabled tables without policies.
      Triggers (table-owner) and service_role still write/read these tables.
*/

-- =========================================================================
-- 1. VIEWS: switch to security_invoker
-- =========================================================================

ALTER VIEW public."Produktai" SET (security_invoker = on);
ALTER VIEW public."Uzsakymai" SET (security_invoker = on);
ALTER VIEW public.v_daily_revenue SET (security_invoker = on);
ALTER VIEW public.v_low_stock_alerts SET (security_invoker = on);
ALTER VIEW public.v_order_full SET (security_invoker = on);
ALTER VIEW public.v_payment_timeline SET (security_invoker = on);
ALTER VIEW public.v_product_stock_history SET (security_invoker = on);

-- =========================================================================
-- 2. FUNCTIONS: pin search_path
-- =========================================================================

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'increment_discount_usage',
        'generate_order_number',
        'update_updated_at',
        'update_updated_at_column',
        'log_inventory_change',
        'log_payment_status_change',
        'log_order_creation'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', fn.sig);
  END LOOP;
END $$;

-- =========================================================================
-- 3. EXTENSIONS: move pg_net out of public
-- =========================================================================

CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-pending-solana-payments') THEN
    PERFORM cron.unschedule('check-pending-solana-payments');
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pg_net' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'DROP EXTENSION pg_net';
    EXECUTE 'CREATE EXTENSION pg_net SCHEMA extensions';
  END IF;

  PERFORM cron.schedule(
    'check-pending-solana-payments',
    '*/2 * * * *',
    $job$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1) || '/functions/v1/check-pending-payments',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
      ),
      body := '{}'::jsonb
    );
    $job$
  );
END $$;

-- =========================================================================
-- 4. RLS POLICIES
-- =========================================================================

-- discount_codes
DROP POLICY IF EXISTS "Autentifikuoti gali atnaujinti nuolaidų kodus" ON public.discount_codes;
DROP POLICY IF EXISTS "Autentifikuoti gali valdyti nuolaidų kodus" ON public.discount_codes;

-- order_items
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Visi gali kurti prekių eilutes" ON public.order_items;
DROP POLICY IF EXISTS "Autentifikuoti gali atnaujinti prekes" ON public.order_items;

CREATE POLICY "Public can create order items with valid data"
  ON public.order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    quantity > 0
    AND price >= 0
    AND order_id IS NOT NULL
    AND product_id IS NOT NULL
  );

-- orders
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Visi gali kurti užsakymus" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
DROP POLICY IF EXISTS "Autentifikuoti gali atnaujinti užsakymus" ON public.orders;

CREATE POLICY "Public can create pending orders"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    total_amount >= 0
    AND coalesce(payment_status, 'pending') = 'pending'
    AND coalesce(order_status, 'pending') IN ('pending', 'awaiting_payment')
    AND customer_email IS NOT NULL
  );

-- parcel_lockers
DROP POLICY IF EXISTS "Autentifikuoti gali atnaujinti paštomates" ON public.parcel_lockers;
DROP POLICY IF EXISTS "Autentifikuoti gali valdyti paštomates" ON public.parcel_lockers;

-- product_price_tiers
DROP POLICY IF EXISTS "Autentifikuoti gali atnaujinti kainų pakopas" ON public.product_price_tiers;
DROP POLICY IF EXISTS "Autentifikuoti gali redaguoti kainų pakopas" ON public.product_price_tiers;

-- products
DROP POLICY IF EXISTS "Autentifikuoti gali prideti produktus" ON public.products;
DROP POLICY IF EXISTS "Autentifikuoti gali redaguoti produktus" ON public.products;

-- =========================================================================
-- 5. STORAGE: drop broad SELECT policy
-- =========================================================================

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;

-- =========================================================================
-- 6. LOG TABLES: explicit deny-all policies (no client access; service_role bypasses)
-- =========================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='inventory_log') THEN
    EXECUTE 'ALTER TABLE public.inventory_log ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies
                   WHERE schemaname='public' AND tablename='inventory_log'
                   AND policyname='Deny all client access to inventory_log') THEN
      EXECUTE $p$
        CREATE POLICY "Deny all client access to inventory_log"
          ON public.inventory_log
          FOR SELECT
          TO anon, authenticated
          USING (false)
      $p$;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='payment_events') THEN
    EXECUTE 'ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies
                   WHERE schemaname='public' AND tablename='payment_events'
                   AND policyname='Deny all client access to payment_events') THEN
      EXECUTE $p$
        CREATE POLICY "Deny all client access to payment_events"
          ON public.payment_events
          FOR SELECT
          TO anon, authenticated
          USING (false)
      $p$;
    END IF;
  END IF;
END $$;