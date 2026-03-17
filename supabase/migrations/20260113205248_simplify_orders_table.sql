/*
  # Simplify orders table

  1. Changes
    - Remove customer_email column (no longer needed)
    - Remove customer_name column (no longer needed)
    - Remove customer_address column (no longer needed)
    - Remove customer_postal_code column (no longer needed)
    - Keep only customer_phone and customer_city for delivery
    
  2. Notes
    - This migration is safe because we're only removing columns
    - All required delivery information is now in parcel locker selection
*/

-- Remove unnecessary customer information columns
ALTER TABLE orders 
  DROP COLUMN IF EXISTS customer_email,
  DROP COLUMN IF EXISTS customer_name,
  DROP COLUMN IF EXISTS customer_address,
  DROP COLUMN IF EXISTS customer_postal_code;
