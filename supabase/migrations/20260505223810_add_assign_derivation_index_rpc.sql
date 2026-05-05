/*
  # Atomic derivation index assignment

  1. New Function
    - `public.assign_order_derivation(p_order_id uuid)` - assigns the next value from
      `order_derivation_seq` to the order's `derivation_index` ONLY if it is currently null,
      and returns the assigned index. If already assigned, returns the existing index.

  2. Security
    - SECURITY DEFINER to allow update; callable by service_role only
    - Wrapped logic ensures one derivation index per order (no duplicates)

  3. Notes
    - Called by the `create-order-wallet` edge function right before deriving the keypair
*/

CREATE OR REPLACE FUNCTION public.assign_order_derivation(p_order_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_index bigint;
BEGIN
  SELECT derivation_index INTO v_index FROM public.orders WHERE id = p_order_id;
  IF v_index IS NOT NULL THEN
    RETURN v_index;
  END IF;

  v_index := nextval('public.order_derivation_seq');
  UPDATE public.orders SET derivation_index = v_index WHERE id = p_order_id AND derivation_index IS NULL;

  SELECT derivation_index INTO v_index FROM public.orders WHERE id = p_order_id;
  RETURN v_index;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_order_derivation(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_order_derivation(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.assign_order_derivation(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.assign_order_derivation(uuid) TO service_role;