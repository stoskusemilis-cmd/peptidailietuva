/*
  # Add increment_discount_usage RPC Function

  1. New Functions
    - `increment_discount_usage(p_code text)` — safely increments usage_count for a discount code
      Called from the frontend after a successful order creation.
      Uses SECURITY DEFINER so anon users can call it without direct UPDATE access.
*/

CREATE OR REPLACE FUNCTION increment_discount_usage(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE discount_codes
  SET usage_count = usage_count + 1
  WHERE code = p_code;
END;
$$;
