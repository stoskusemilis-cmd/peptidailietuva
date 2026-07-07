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