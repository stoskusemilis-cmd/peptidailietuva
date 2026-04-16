/*
  # Fix increment_discount_usage function - wrong column names

  1. Bug Fix
    - The function referenced `current_uses` but the actual column is `usage_count`
    - The function referenced `updated_at` but that column doesn't exist in discount_codes
    - This caused the function to silently fail on every call
    - Discount usage counts were never being incremented

  2. Changes
    - Replace `current_uses` with `usage_count`
    - Remove `updated_at` reference since the column doesn't exist
*/

CREATE OR REPLACE FUNCTION public.increment_discount_usage(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE discount_codes
  SET usage_count = usage_count + 1
  WHERE code = p_code AND is_active = true;
END;
$function$;
