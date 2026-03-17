/*
  # Remove Solana fields from orders table

  1. Changes
    - Remove `solana_wallet_address` column (no longer needed)
    - Remove `transaction_signature` column (no longer needed)
    - Orders will now be created with `payment_status` = 'pending_payment'
    - Payment details will be sent via Telegram after order creation

  2. Notes
    - This migration safely removes columns that are no longer used
    - Existing orders with these fields will have the data preserved in case of rollback
*/

-- Remove Solana-specific columns from orders table
ALTER TABLE orders 
  DROP COLUMN IF EXISTS solana_wallet_address,
  DROP COLUMN IF EXISTS transaction_signature;
