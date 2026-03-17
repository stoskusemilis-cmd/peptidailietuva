/*
  # Update Orders Table for Complete Solana Payment Flow

  1. Changes to `orders` table
    - Add `customer_phone` (text) - Customer phone number
    - Add `customer_address` (text) - Street address
    - Add `customer_city` (text) - City
    - Add `customer_postal_code` (text) - Postal code
    - Add `delivery_method` (text) - 'courier' or 'parcel_locker'
    - Add `parcel_locker_id` (uuid) - Reference to parcel locker
    - Add `order_items` (jsonb) - Detailed order items
    - Add `payment_status` (text) - Payment tracking
    - Add `order_status` (text) - Order fulfillment tracking
    - Rename `wallet_address` to `solana_wallet_address` for clarity

  2. Security
    - Maintain existing RLS policies

  3. Important Notes
    - Preserves existing data
    - Adds missing fields for complete order tracking
    - Separates payment status from order status
*/

-- Add new columns if they don't exist
DO $$
BEGIN
  -- Add customer contact fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_phone') THEN
    ALTER TABLE orders ADD COLUMN customer_phone text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_address') THEN
    ALTER TABLE orders ADD COLUMN customer_address text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_city') THEN
    ALTER TABLE orders ADD COLUMN customer_city text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_postal_code') THEN
    ALTER TABLE orders ADD COLUMN customer_postal_code text;
  END IF;

  -- Add delivery fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_method') THEN
    ALTER TABLE orders ADD COLUMN delivery_method text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'parcel_locker_id') THEN
    ALTER TABLE orders ADD COLUMN parcel_locker_id uuid;
  END IF;

  -- Add order items
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_items') THEN
    ALTER TABLE orders ADD COLUMN order_items jsonb;
  END IF;

  -- Add payment and order status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
    ALTER TABLE orders ADD COLUMN payment_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_status') THEN
    ALTER TABLE orders ADD COLUMN order_status text DEFAULT 'pending';
  END IF;

  -- Rename wallet_address to solana_wallet_address if needed
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'wallet_address') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'solana_wallet_address') THEN
    ALTER TABLE orders RENAME COLUMN wallet_address TO solana_wallet_address;
  END IF;
END $$;

-- Add foreign key constraint for parcel_locker_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parcel_lockers') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'orders_parcel_locker_id_fkey'
    ) THEN
      ALTER TABLE orders ADD CONSTRAINT orders_parcel_locker_id_fkey 
        FOREIGN KEY (parcel_locker_id) REFERENCES parcel_lockers(id);
    END IF;
  END IF;
END $$;

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_orders_delivery_method ON orders(delivery_method);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);