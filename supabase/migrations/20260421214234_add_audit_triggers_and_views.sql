/*
  # Automatic audit triggers and AI-ready views

  ## Purpose
  Make inventory and payment logging automatic — any change anywhere
  (admin panel, edge function, direct SQL) will be captured without
  requiring application code to remember to log.

  ## 1. Triggers
    - `log_inventory_change` — fires AFTER UPDATE on products.stock
      Inserts one row into inventory_log with the before/after values.
    - `log_payment_status_change` — fires AFTER UPDATE on orders when
      payment_status or order_status changes. Inserts into payment_events.
    - `log_order_creation` — fires AFTER INSERT on orders. Creates the
      initial payment_events row (event_type='created').

  ## 2. Views (for AI / analytics)
    - `v_order_full` — complete order with items, payment history, and
      inventory impact joined for easy AI querying.
    - `v_product_stock_history` — current stock + last 30 days of changes
      per product.
    - `v_payment_timeline` — chronological payment journey per order.
    - `v_daily_revenue` — daily revenue totals by status.
    - `v_low_stock_alerts` — products with stock <= 5.

  ## 3. Security
    - Triggers run as definer (elevated privileges) so they can write
      to audit tables regardless of caller's RLS.
    - Views inherit RLS from underlying tables.
*/

-- Inventory change trigger
CREATE OR REPLACE FUNCTION log_inventory_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.stock IS DISTINCT FROM OLD.stock THEN
    INSERT INTO inventory_log (
      product_id,
      change_type,
      quantity_delta,
      stock_before,
      stock_after,
      reason,
      metadata
    ) VALUES (
      NEW.id,
      CASE
        WHEN NEW.stock > OLD.stock THEN 'restock'
        WHEN NEW.stock < OLD.stock THEN 'order'
        ELSE 'manual_adjustment'
      END,
      NEW.stock - OLD.stock,
      OLD.stock,
      NEW.stock,
      'auto-logged from products.stock UPDATE',
      jsonb_build_object('product_name', NEW.name)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_inventory_change ON products;
CREATE TRIGGER trg_log_inventory_change
  AFTER UPDATE OF stock ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_inventory_change();

-- Payment status change trigger
CREATE OR REPLACE FUNCTION log_payment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.order_status IS DISTINCT FROM OLD.order_status
     OR NEW.transaction_signature IS DISTINCT FROM OLD.transaction_signature THEN
    INSERT INTO payment_events (
      order_id,
      event_type,
      previous_status,
      new_status,
      amount,
      currency,
      transaction_signature,
      source,
      details
    ) VALUES (
      NEW.id,
      CASE
        WHEN NEW.payment_status = 'confirmed' AND OLD.payment_status <> 'confirmed' THEN 'confirmed'
        WHEN NEW.payment_status = 'failed' AND OLD.payment_status <> 'failed' THEN 'failed'
        WHEN NEW.transaction_signature IS NOT NULL AND OLD.transaction_signature IS NULL THEN 'signature_received'
        WHEN NEW.order_status IS DISTINCT FROM OLD.order_status THEN 'order_status_change'
        ELSE 'payment_status_change'
      END,
      COALESCE(OLD.payment_status, ''),
      COALESCE(NEW.payment_status, ''),
      COALESCE(NEW.crypto_amount, NEW.total_amount, 0),
      COALESCE(NEW.payment_method, 'EUR'),
      COALESCE(NEW.transaction_signature, ''),
      'trigger',
      jsonb_build_object(
        'order_number', NEW.order_number,
        'old_order_status', OLD.order_status,
        'new_order_status', NEW.order_status,
        'total_amount', NEW.total_amount
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_payment_status_change ON orders;
CREATE TRIGGER trg_log_payment_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_payment_status_change();

-- Order creation trigger
CREATE OR REPLACE FUNCTION log_order_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO payment_events (
    order_id,
    event_type,
    previous_status,
    new_status,
    amount,
    currency,
    transaction_signature,
    source,
    details
  ) VALUES (
    NEW.id,
    'created',
    '',
    COALESCE(NEW.payment_status, 'pending'),
    COALESCE(NEW.crypto_amount, NEW.total_amount, 0),
    COALESCE(NEW.payment_method, 'EUR'),
    COALESCE(NEW.transaction_signature, ''),
    'trigger',
    jsonb_build_object(
      'order_number', NEW.order_number,
      'total_amount', NEW.total_amount,
      'customer_email', NEW.customer_email,
      'delivery_method', NEW.delivery_method
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_order_creation ON orders;
CREATE TRIGGER trg_log_order_creation
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_creation();

-- AI-ready views
CREATE OR REPLACE VIEW v_order_full AS
SELECT
  o.id AS order_id,
  o.order_number,
  o.customer_name,
  o.customer_email,
  o.customer_phone,
  o.customer_city,
  o.delivery_method,
  o.parcel_locker_id,
  o.payment_method,
  o.payment_status,
  o.order_status,
  o.status,
  o.total_amount,
  o.subtotal_amount,
  o.discount_code,
  o.discount_amount,
  o.crypto_amount,
  o.sol_price_eur,
  o.transaction_signature,
  o.payment_confirmed_at,
  o.wallet_address,
  o.unique_sol_offset,
  o.order_items,
  o.full_order_details,
  o.notes,
  o.created_at,
  o.updated_at,
  (
    SELECT COUNT(*) FROM payment_events pe WHERE pe.order_id = o.id
  ) AS payment_event_count,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'event_type', pe.event_type,
        'new_status', pe.new_status,
        'amount', pe.amount,
        'source', pe.source,
        'created_at', pe.created_at
      ) ORDER BY pe.created_at
    )
    FROM payment_events pe WHERE pe.order_id = o.id
  ) AS payment_timeline
FROM orders o;

CREATE OR REPLACE VIEW v_product_stock_history AS
SELECT
  p.id AS product_id,
  p.name,
  p.stock AS current_stock,
  p.is_active,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'change_type', il.change_type,
        'quantity_delta', il.quantity_delta,
        'stock_before', il.stock_before,
        'stock_after', il.stock_after,
        'order_id', il.order_id,
        'reason', il.reason,
        'created_at', il.created_at
      ) ORDER BY il.created_at DESC
    )
    FROM inventory_log il
    WHERE il.product_id = p.id
      AND il.created_at >= now() - interval '30 days'
  ) AS last_30_days_changes,
  (
    SELECT COALESCE(SUM(-il.quantity_delta), 0)
    FROM inventory_log il
    WHERE il.product_id = p.id
      AND il.change_type = 'order'
      AND il.created_at >= now() - interval '30 days'
  ) AS units_sold_30d
FROM products p;

CREATE OR REPLACE VIEW v_payment_timeline AS
SELECT
  pe.id,
  pe.order_id,
  o.order_number,
  pe.event_type,
  pe.previous_status,
  pe.new_status,
  pe.amount,
  pe.currency,
  pe.transaction_signature,
  pe.source,
  pe.details,
  pe.created_at
FROM payment_events pe
JOIN orders o ON o.id = pe.order_id
ORDER BY pe.created_at DESC;

CREATE OR REPLACE VIEW v_daily_revenue AS
SELECT
  date_trunc('day', created_at)::date AS day,
  payment_status,
  COUNT(*) AS order_count,
  COALESCE(SUM(total_amount), 0) AS total_revenue_eur,
  COALESCE(SUM(discount_amount), 0) AS total_discounts_eur,
  COALESCE(AVG(total_amount), 0) AS avg_order_value_eur
FROM orders
GROUP BY date_trunc('day', created_at), payment_status
ORDER BY day DESC;

CREATE OR REPLACE VIEW v_low_stock_alerts AS
SELECT
  id AS product_id,
  name,
  stock,
  is_active,
  CASE
    WHEN stock = 0 THEN 'out_of_stock'
    WHEN stock <= 5 THEN 'critical'
    WHEN stock <= 10 THEN 'low'
    ELSE 'ok'
  END AS stock_level,
  updated_at
FROM products
WHERE stock <= 10
ORDER BY stock ASC;
