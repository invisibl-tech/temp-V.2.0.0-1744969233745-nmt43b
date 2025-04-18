/*
  # Fix product name filtering in metrics

  1. Changes
    - Update generate_sales_metrics function to include product name
    - Regenerate metrics data with product names
    - Add product_name field to metrics JSON

  2. Security
    - Maintains existing RLS policies
*/

-- Clear existing metrics data
DELETE FROM platform_metrics;

-- Update function to include product name
CREATE OR REPLACE FUNCTION generate_sales_metrics(
  base_price NUMERIC,
  base_quantity INTEGER,
  product_name TEXT,
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
    'product_name', product_name,
    'product_type', CASE 
      WHEN base_price < 300 THEN 'Basic'
      WHEN base_price < 600 THEN 'Casual'
      ELSE 'Premium'
    END
  );
END;
$$ LANGUAGE plpgsql;

-- Insert data for pinnkpp@gmail.com
DO $$
DECLARE
  v_user_id uuid;
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
  -- Get user ID for pinnkpp@gmail.com
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'pinnkpp@gmail.com';
  
  -- For each product
  FOR product_record IN 
    SELECT item_id, name 
    FROM product_costs pc 
    WHERE pc.user_id = v_user_id
  LOOP
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
            product_record.name,
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