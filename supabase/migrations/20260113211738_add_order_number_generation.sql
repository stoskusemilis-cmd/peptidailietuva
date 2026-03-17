/*
  # Add automatic order number generation

  1. Changes
    - Create function to generate unique order numbers (format: ORD-YYYYMMDD-XXXX)
    - Set order_number to have a default value using the generation function
    - Order numbers will be automatically assigned when creating new orders

  2. Security
    - No changes to RLS policies

  3. Important Notes
    - Order numbers follow format: ORD-20260113-0001, ORD-20260113-0002, etc.
    - Ensures uniqueness and readability
*/

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  date_part text;
  sequence_part text;
  max_number integer;
  new_order_number text;
BEGIN
  -- Get current date in YYYYMMDD format
  date_part := to_char(now(), 'YYYYMMDD');
  
  -- Find the highest sequence number for today
  SELECT COALESCE(MAX(
    CASE 
      WHEN order_number ~ ('^ORD-' || date_part || '-[0-9]{4}$')
      THEN substring(order_number from '[0-9]{4}$')::integer
      ELSE 0
    END
  ), 0) INTO max_number
  FROM orders
  WHERE order_number LIKE 'ORD-' || date_part || '-%';
  
  -- Increment and format as 4 digits
  sequence_part := lpad((max_number + 1)::text, 4, '0');
  
  -- Construct the order number
  new_order_number := 'ORD-' || date_part || '-' || sequence_part;
  
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Set default value for order_number column
ALTER TABLE orders 
  ALTER COLUMN order_number SET DEFAULT generate_order_number();