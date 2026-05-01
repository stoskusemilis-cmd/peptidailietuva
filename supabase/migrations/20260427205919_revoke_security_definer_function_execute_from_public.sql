/*
  # Lock down SECURITY DEFINER functions from anon/authenticated

  ## Summary
  Removes EXECUTE privilege on four SECURITY DEFINER functions from the public
  REST surface (`anon` and `authenticated` roles). These functions are either
  trigger-only helpers or backend-only RPCs and must never be invokable via
  PostgREST.

  ## What this does
  1. Revokes EXECUTE on `public.increment_discount_usage(text)` from PUBLIC,
     anon, authenticated. Only the service_role (used by edge functions) can
     still call it.
  2. Revokes EXECUTE on the three audit/log trigger functions
     (`public.log_inventory_change()`, `public.log_order_creation()`,
     `public.log_payment_status_change()`) from PUBLIC, anon, authenticated.
     They run inside triggers as SECURITY DEFINER and never need direct RPC.

  ## Security
  No data loss. No behavior change for legitimate flows: triggers continue
  to fire automatically, and the discount RPC continues to be invoked by
  the `create-order` edge function under service_role.
*/

REVOKE EXECUTE ON FUNCTION public.increment_discount_usage(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_discount_usage(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_discount_usage(text) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.log_inventory_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_inventory_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_inventory_change() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.log_order_creation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_order_creation() FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_order_creation() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.log_payment_status_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_payment_status_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_payment_status_change() FROM authenticated;
