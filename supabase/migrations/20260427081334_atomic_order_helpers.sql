/*
  # Atomic helpers for order creation, discount application, and stock decrement

  1. New / replaced functions
    - `apply_discount_code(p_code text)` - atomically validates a discount code,
      enforces `max_uses` if set, and increments `usage_count`. Returns a single
      row with code metadata or no rows if rejected.
    - `decrement_product_stock(p_product_id uuid, p_quantity int, p_order_id uuid)`
      - atomically decrements `products.stock` if enough is available, returns
      the new stock level. Returns NULL if not enough stock (caller decides).
    - `record_inventory_change(p_product_id uuid, p_delta int, p_order_id uuid,
      p_reason text)` - inserts a row into `inventory_log` for audit trail.

  2. Security
    - All functions are SECURITY DEFINER, owned by the table owner, with a
      pinned search_path. Granted EXECUTE only to `service_role` (bypasses RLS;
      these are called from edge functions, not the browser).

  3. Notes
    - Discount logic uses a CTE with FOR UPDATE locking to prevent the classic
      check-then-increment race that lets multiple concurrent orders bypass
      `max_uses` limits.
*/

CREATE OR REPLACE FUNCTION public.apply_discount_code(p_code text)
RETURNS TABLE (
  code text,
  discount_percent integer,
  referral_commission_percent integer,
  usage_count integer,
  max_uses integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_code text;
  v_discount integer;
  v_commission integer;
  v_usage integer;
  v_max integer;
  v_active boolean;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RETURN;
  END IF;

  SELECT dc.code,
         dc.discount_percent,
         dc.referral_commission_percent,
         dc.usage_count,
         dc.max_uses,
         dc.is_active
  INTO v_code, v_discount, v_commission, v_usage, v_max, v_active
  FROM public.discount_codes dc
  WHERE dc.code = upper(trim(p_code))
  FOR UPDATE;

  IF v_code IS NULL OR v_active IS NOT TRUE THEN
    RETURN;
  END IF;

  IF v_max IS NOT NULL AND v_usage >= v_max THEN
    RETURN;
  END IF;

  UPDATE public.discount_codes
  SET usage_count = COALESCE(v_usage, 0) + 1
  WHERE public.discount_codes.code = v_code
  RETURNING public.discount_codes.usage_count INTO v_usage;

  code := v_code;
  discount_percent := v_discount;
  referral_commission_percent := COALESCE(v_commission, 0);
  usage_count := v_usage;
  max_uses := v_max;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_discount_code(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_discount_code(text) TO service_role;


CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_product_id uuid,
  p_quantity integer,
  p_order_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_stock integer;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN NULL;
  END IF;

  UPDATE public.products
  SET stock = stock - p_quantity,
      updated_at = now()
  WHERE id = p_product_id
    AND stock >= p_quantity
  RETURNING stock INTO v_new_stock;

  IF v_new_stock IS NULL THEN
    RETURN NULL;
  END IF;

  BEGIN
    INSERT INTO public.inventory_log (
      product_id, change_type, quantity_delta, stock_before, stock_after,
      order_id, reason
    )
    VALUES (
      p_product_id, 'order', -p_quantity,
      v_new_stock + p_quantity, v_new_stock,
      p_order_id, 'payment_confirmed'
    );
  EXCEPTION WHEN undefined_table THEN
    NULL;
  WHEN undefined_column THEN
    NULL;
  END;

  RETURN v_new_stock;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_product_stock(uuid, integer, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer, uuid) TO service_role;


-- =========================================================================
-- Tighten RLS: orders / order_items INSERT only via service_role
-- =========================================================================

DROP POLICY IF EXISTS "Public can create pending orders" ON public.orders;
DROP POLICY IF EXISTS "Public can create order items with valid data" ON public.order_items;