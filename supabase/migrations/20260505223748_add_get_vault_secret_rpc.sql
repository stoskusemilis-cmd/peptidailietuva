/*
  # Secure vault accessor for edge functions

  1. New Function
    - `public.get_vault_secret(p_name text)` - SECURITY DEFINER function that returns the
      decrypted value of a vault secret by name. Restricted to `service_role` only so
      anonymous/authenticated users cannot read secrets via PostgREST.

  2. Security
    - REVOKE all from PUBLIC/anon/authenticated
    - GRANT EXECUTE only to service_role

  3. Notes
    - Edge functions that use the service role key will be able to call this RPC to read
      MASTER_SEED_MNEMONIC and MAIN_WALLET_ADDRESS without exposing them to clients.
*/

CREATE OR REPLACE FUNCTION public.get_vault_secret(p_name text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = vault, public, pg_temp
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = p_name
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_vault_secret(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_vault_secret(text) FROM anon;
REVOKE ALL ON FUNCTION public.get_vault_secret(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_vault_secret(text) TO service_role;