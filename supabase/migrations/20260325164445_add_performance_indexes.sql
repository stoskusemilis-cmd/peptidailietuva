/*
  # Add performance indexes for orders table

  ## Summary
  Critical database optimizations for production load.
  These indexes dramatically speed up the most frequent queries.

  1. Indexes added:
     - orders.payment_status - every payment check queries this
     - orders.created_at DESC - background checker time filters
     - orders.payment_confirmed_at DESC - paid orders lookups
     - orders.transaction_signature - avoid double-spend checks
     - Composite (payment_status, created_at DESC) - most common query pattern
*/

CREATE INDEX IF NOT EXISTS idx_orders_payment_status
  ON orders (payment_status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment_confirmed_at
  ON orders (payment_confirmed_at DESC)
  WHERE payment_confirmed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_transaction_signature
  ON orders (transaction_signature)
  WHERE transaction_signature IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders (payment_status, created_at DESC);
