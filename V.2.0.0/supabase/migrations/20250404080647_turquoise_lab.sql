/*
  # Add mock data for testing

  1. Data Cleanup
    - Cleans existing metrics data
    - Removes existing product costs for test user
  
  2. Product Cost Data
    - Adds sample fashion products with costs
    - Includes various categories and sizes
  
  3. Platform Metrics Data
    - Adds 90 days of historical sales data
    - Includes daily metrics for each product
    - Simulates realistic sales patterns with seasonality
*/

-- Clear existing data to avoid conflicts
DELETE FROM platform_metrics;
DELETE FROM product_costs WHERE user_id = 'e2c3c496-5050-4025-8b1b-7811f68b2e8f';

-- Insert mock product costs
INSERT INTO product_costs (item_id, name, size, color, cost, user_id)
VALUES
  ('DRESS001', 'Summer Floral Dress', 'S', 'Blue', 450, 'e2c3c496-5050-4025-8b1b-7811f68b2e8f'),
  ('DRESS002', 'Summer Floral Dress', 'M', 'Blue', 450, 'e2c3c496-5050-4025-8b1b-7811f68b2e8f'),
  ('DRESS003', 'Summer Floral Dress', 'L', 'Blue', 500, 'e2c3c496-5050-4025-8b1b-7811f68b2e8f'),
  ('JEANS001', 'Classic Denim Jeans', '28', 'Dark Blue', 600, 'e2c3c496-5050-4025-8b1b-7811f68b2e8f'),
  ('JEANS002', 'Classic Denim Jeans', '30', 'Dark Blue', 600, 'e2c3c496-5050-4025-8b1b-7811f68b2e8f'),
  ('JEANS003', 'Classic Denim Jeans', '32', 'Dark Blue', 600, 'e2c3c496-5050-4025-8b1b-7811f68b2e8f'),
  ('TSHIRT001', 'Basic Cotton T-Shirt', 'S', 'White', 150, 'e2c3c496-5050-4025-8b1b-7811f68b2e8f'),
  ('TSHIRT002', 'Basic Cotton T-Shirt', 'M', 'White', 150, 'e2c3c496-5050-4025-8b1b-7811f68b2e8f'),
  ('TSHIRT003', 'Basic Cotton T-Shirt', 'L', 'White', 150, 'e2c3c496-5050-4025-8b1b-7811f68b2e8f'),
  ('BLOUSE001', 'Silk Blouse', 'S', 'Pink', 800, 'e2c3c496-5050-4025-8b1b-7811f68b2e8f'),
  ('BLOUSE002', 'Silk Blouse', 'M', 'Pink', 800, 'e2c3c496-5050-4025-8b1b-7811f68b2e8f'),
  ('SKIRT001', 'A-Line Midi Skirt', 'S', 'Black', 550, 'e2c3c496-5050-4025-8b1b-7811f68b2e8f'),
  ('SKIRT002', 'A-Line Midi Skirt', 'M', 'Black', 550, 'e2c3c496-5050-4025-8b1b-7811f68b2e8f'),
  ('JACKET001', 'Denim Jacket', 'M', 'Light Blue', 900, 'e2c3c496-5050-4025-8b1b-7811f68b2e8f'),
  ('JACKET002', 'Denim Jacket', 'L', 'Light Blue', 900, 'e2c3c496-5050-4025-8b1b-7811f68b2e8f');

-- Function to generate random sales data with seasonality
CREATE OR REPLACE FUNCTION generate_sales_metrics(
  base_price NUMERIC,
  base_quantity INTEGER,
  date_offset INTEGER,
  variation_percent INTEGER DEFAULT 20
) RETURNS JSONB AS $$
DECLARE
  final_price NUMERIC;
  final_quantity INTEGER;
  day_of_week INTEGER;
  seasonal_factor NUMERIC;
BEGIN
  -- Get day of week (0 = Sunday)
  day_of_week := EXTRACT(DOW FROM (CURRENT_DATE - date_offset));
  
  -- Apply seasonal factors
  CASE
    WHEN day_of_week IN (5, 6) THEN -- Weekend
      seasonal_factor := 1.3;
    WHEN day_of_week = 0 THEN -- Sunday
      seasonal_factor := 1.1;
    ELSE -- Weekday
      seasonal_factor := 0.9;
  END CASE;

  -- Calculate final price with random variation
  final_price := base_price * (1 + (random() * variation_percent - variation_percent/2)/100);
  
  -- Calculate quantity with seasonality and random variation
  final_quantity := GREATEST(0, 
    ROUND(
      base_quantity * seasonal_factor * (1 + (random() * variation_percent - variation_percent/2)/100)
    )::INTEGER
  );

  RETURN jsonb_build_object(
    'price', final_price,
    'quantity', final_quantity,
    'sales', final_price * final_quantity,
    'product_type', CASE 
      WHEN base_price < 300 THEN 'Basic'
      WHEN base_price < 600 THEN 'Casual'
      ELSE 'Premium'
    END
  );
END;
$$ LANGUAGE plpgsql;

-- Insert 90 days of historical metrics for each product
DO $$
DECLARE
  product_record RECORD;
  current_date DATE := CURRENT_DATE;
  platform_names TEXT[] := ARRAY['Shopee', 'Lazada'];
  platform_name TEXT;
  base_prices NUMERIC[] := ARRAY[
    1200, 1200, 1300,  -- Dresses
    1500, 1500, 1500,  -- Jeans
    400, 400, 400,     -- T-Shirts
    2000, 2000,        -- Blouses
    1300, 1300,        -- Skirts
    2200, 2200         -- Jackets
  ];
  base_quantities INTEGER[] := ARRAY[
    5, 8, 4,    -- Dresses
    6, 8, 5,    -- Jeans
    12, 15, 10, -- T-Shirts
    4, 6,       -- Blouses
    7, 9,       -- Skirts
    3, 4        -- Jackets
  ];
  i INTEGER := 1;
BEGIN
  -- For each product
  FOR product_record IN SELECT item_id FROM product_costs LOOP
    -- For each platform
    FOREACH platform_name IN ARRAY platform_names LOOP
      -- For each day in the last 90 days
      FOR day_offset IN 0..89 LOOP
        INSERT INTO platform_metrics (
          platform,
          metrics,
          timestamp
        ) VALUES (
          platform_name,
          jsonb_build_object(
            'item_id', product_record.item_id,
            'product_id', product_record.item_id
          ) || generate_sales_metrics(
            base_prices[i],
            base_quantities[i],
            day_offset
          ),
          current_date - day_offset
        );
      END LOOP;
    END LOOP;
    i := i + 1;
  END LOOP;
END $$;

-- Update total metrics for each day
WITH daily_totals AS (
  SELECT
    date_trunc('day', timestamp) as day,
    SUM((metrics->>'sales')::numeric) as total_sales,
    SUM((metrics->>'quantity')::numeric) as total_orders,
    COUNT(DISTINCT (metrics->>'item_id')) as unique_products
  FROM platform_metrics
  GROUP BY date_trunc('day', timestamp)
)
INSERT INTO platform_metrics (platform, metrics, timestamp)
SELECT
  'ALL' as platform,
  jsonb_build_object(
    'sales', total_sales,
    'orders', total_orders,
    'unique_products', unique_products,
    'conversion_rate', 2.5 + random() * 2,
    'average_order_value', ROUND((total_sales / NULLIF(total_orders, 0))::numeric, 2)
  ) as metrics,
  day as timestamp
FROM daily_totals;