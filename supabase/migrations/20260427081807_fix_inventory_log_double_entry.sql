/*
  # Avoid double-logging inventory changes

  ## Problem
  The existing `log_inventory_change` trigger writes a row to `inventory_log`
  whenever `products.stock` is updated. The new `decrement_product_stock` RPC
  was also inserting an `inventory_log` row, causing duplicate entries.

  ## Fix
    1. Update the trigger to read an optional `app.current_order_id` config
       setting and use it as `order_id`. This lets edge functions tag the
       log row with the order that caused the stock change.
    2. Update `decrement_product_stock` to set the config inside the
       transaction (LOCAL scope) and let the trigger do the logging. The
       explicit INSERT is removed.

  ## Notes
    - Functions remain SECURITY DEFINER with pinned search_path.
    - `set_config(..., true)` makes the value local to the current transaction
      so it never leaks across requests.
*/

CREATE OR REPLACE FUNCTION public.log_inventory_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id uuid;
  v_reason text;
BEGIN
  IF NEW.stock IS DISTINCT FROM OLD.stock THEN
    BEGIN
      v_order_id := nullif(current_setting('app.current_order_id', true), '')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_order_id := NULL;
    END;

    BEGIN
      v_reason := nullif(current_setting('app.current_reason', true), '');
    EXCEPTION WHEN OTHERS THEN
      v_reason := NULL;
    END;

    INSERT INTO public.inventory_log (
      product_id,
      change_type,
      quantity_delta,
      stock_before,
      stock_after,
      order_id,
      reason,
      metadata
    ) VALUES (
      NEW.id,
      CASE
        WHEN NEW.stock > OLD.stock THEN 'restock'
        WHEN NEW.stock < OLD.stock THEN 'order'
        ELSE 'manual_adjustment'
      END,
      NEW.stock - OLD.stock,
      OLD.stock,
      NEW.stock,
      v_order_id,
      COALESCE(v_reason, 'auto-logged from products.stock UPDATE'),
      jsonb_build_object('product_name', NEW.name)
    );
  END IF;
  RETURN NEW;
END;
$$;


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

  PERFORM set_config('app.current_order_id', COALESCE(p_order_id::text, ''), true);
  PERFORM set_config('app.current_reason', 'payment_confirmed', true);

  UPDATE public.products
  SET stock = stock - p_quantity,
      updated_at = now()
  WHERE id = p_product_id
    AND stock >= p_quantity
  RETURNING stock INTO v_new_stock;

  PERFORM set_config('app.current_order_id', '', true);
  PERFORM set_config('app.current_reason', '', true);

  RETURN v_new_stock;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_product_stock(uuid, integer, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer, uuid) TO service_role;