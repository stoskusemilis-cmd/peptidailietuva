/*
  # Relax orders INSERT policy

  1. Issue
    - The previous hardening migration required `customer_email IS NOT NULL`
      on `orders` INSERT, but the public checkout form does not collect email.
    - This blocked all anonymous order creation, breaking the Solana flow.

  2. Change
    - Replace the policy with one that keeps the meaningful protections
      (positive total, forced initial pending state) but does not require
      `customer_email`. Initial state is what really matters for safety:
      a hostile client cannot create an already-paid or shipped order.
*/

DROP POLICY IF EXISTS "Public can create pending orders" ON public.orders;

CREATE POLICY "Public can create pending orders"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    total_amount >= 0
    AND coalesce(payment_status, 'pending') = 'pending'
    AND coalesce(order_status, 'pending') IN ('pending', 'awaiting_payment')
  );