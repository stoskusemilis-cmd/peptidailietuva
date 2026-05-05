/*
  # Add HD-derived deposit address columns to orders

  1. New Columns on `orders`
    - `derivation_index` (bigint, nullable) - sequential index used to derive a unique Solana address per order
    - `deposit_address` (text, nullable) - the derived Solana public key that the customer pays to
    - `swept_at` (timestamptz, nullable) - when funds were swept to the main wallet
    - `sweep_signature` (text, nullable) - signature of the sweep transaction to main wallet

  2. New Sequence
    - `order_derivation_seq` - generates the next unique derivation index. Starts at 1.

  3. Indexes
    - Unique index on `derivation_index` (partial, where not null)
    - Index on `deposit_address`
    - Index on `payment_status` (to speed up sweep scans)

  4. Notes
    - These columns are populated by the `create-order-wallet` edge function which derives the
      keypair server-side from a MASTER_SEED secret. Private keys are never stored.
    - The `sweep-payments` edge function uses `derivation_index` to re-derive the keypair,
      check the balance, and sweep funds to the main merchant wallet.
*/

CREATE SEQUENCE IF NOT EXISTS public.order_derivation_seq START 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders' AND column_name='derivation_index'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN derivation_index bigint;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders' AND column_name='deposit_address'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN deposit_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders' AND column_name='swept_at'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN swept_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders' AND column_name='sweep_signature'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN sweep_signature text;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS orders_derivation_index_uq
  ON public.orders(derivation_index)
  WHERE derivation_index IS NOT NULL;

CREATE INDEX IF NOT EXISTS orders_deposit_address_idx
  ON public.orders(deposit_address);

CREATE INDEX IF NOT EXISTS orders_payment_status_idx
  ON public.orders(payment_status);