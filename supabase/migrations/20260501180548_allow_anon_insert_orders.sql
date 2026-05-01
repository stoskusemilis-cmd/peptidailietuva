/*
  # Allow anonymous checkout inserts

  1. Security
    - Adds INSERT policies on `orders` and `order_items` for `anon` and `authenticated` roles
    - Customers are unauthenticated; without these policies, order creation fails with RLS violation
    - SELECT policies remain unchanged (already public read by order number)

  2. Notes
    - Uses WITH CHECK (true) since orders are created by anonymous checkout flow
    - Does NOT allow UPDATE or DELETE for anon users
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.orders'::regclass
      AND polname = 'Anyone can create orders'
  ) THEN
    CREATE POLICY "Anyone can create orders"
      ON public.orders
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.order_items'::regclass
      AND polname = 'Anyone can create order items'
  ) THEN
    CREATE POLICY "Anyone can create order items"
      ON public.order_items
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;