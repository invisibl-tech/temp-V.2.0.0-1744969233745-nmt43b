-- First, clear existing mock data
DELETE FROM platform_metrics;

-- Function to generate mock metrics with user_id
CREATE OR REPLACE FUNCTION generate_mock_metrics(
  base_price NUMERIC,
  base_quantity INTEGER,
  product_name TEXT,
  product_type TEXT,
  user_id UUID,
  date_offset INTEGER,
  variation_percent INTEGER DEFAULT 20
) RETURNS JSONB AS $$
DECLARE
  final_price NUMERIC;
  final_quantity INTEGER;
  day_of_week INTEGER;
  seasonal_factor NUMERIC;
  visitors INTEGER;
  final_sales NUMERIC;
  final_cogs NUMERIC;
  cost_per_unit NUMERIC;
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

  -- Calculate visitors (base: 100-200 per day)
  visitors := 100 + floor(random() * 100);
  visitors := floor(visitors * seasonal_factor);

  -- Calculate final price with random variation
  final_price := base_price * (1 + (random() * variation_percent - variation_percent/2)/100);
  
  -- Calculate quantity based on visitors and conversion rate (2-5%)
  final_quantity := floor(visitors * (2 + random() * 3) / 100);
  final_quantity := floor(final_quantity * seasonal_factor);
  final_quantity := GREATEST(1, final_quantity); -- Ensure at least 1 sale

  -- Calculate cost per unit (60-80% of base price)
  cost_per_unit := base_price * (0.6 + random() * 0.2);
  
  -- Calculate final sales and COGS
  final_sales := final_price * final_quantity;
  final_cogs := cost_per_unit * final_quantity;

  RETURN jsonb_build_object(
    'price', final_price,
    'quantity', final_quantity,
    'sales', final_sales,
    'cogs', final_cogs,
    'cost', cost_per_unit,
    'visitors', visitors,
    'product_name', product_name,
    'product_type', product_type,
    'conversion_rate', ROUND((final_quantity::numeric / visitors::numeric * 100)::numeric, 2),
    'gross_profit', final_sales - final_cogs
  );
END;
$$ LANGUAGE plpgsql;

-- Insert mock data for pinnkpp@gmail.com
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
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User pinnkpp@gmail.com not found';
  END IF;

  -- For each product
  FOR product_record IN 
    SELECT item_id, name, product_type 
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
          timestamp,
          user_id
        ) VALUES (
          platform_name,
          jsonb_build_object(
            'item_id', product_record.item_id,
            'product_id', product_record.item_id
          ) || generate_mock_metrics(
            base_prices[i],
            base_quantities[i],
            product_record.name,
            product_record.product_type,
            v_user_id,
            day_offset
          ),
          current_date - day_offset,
          v_user_id
        );
      END LOOP;
    END LOOP;
    i := i + 1;
  END LOOP;
END $$;

-- Generate daily totals for pinnkpp@gmail.com
WITH daily_totals AS (
  SELECT
    date_trunc('day', timestamp) as day,
    SUM((metrics->>'sales')::numeric) as total_sales,
    SUM((metrics->>'quantity')::numeric) as total_orders,
    SUM((metrics->>'visitors')::numeric) as total_visitors,
    SUM((metrics->>'cogs')::numeric) as total_cogs,
    SUM((metrics->>'gross_profit')::numeric) as total_gross_profit,
    COUNT(DISTINCT (metrics->>'item_id')) as unique_products,
    user_id
  FROM platform_metrics
  GROUP BY date_trunc('day', timestamp), user_id
)
INSERT INTO platform_metrics (platform, metrics, timestamp, user_id)
SELECT
  'ALL' as platform,
  jsonb_build_object(
    'sales', total_sales,
    'orders', total_orders,
    'visitors', total_visitors,
    'cogs', total_cogs,
    'gross_profit', total_gross_profit,
    'unique_products', unique_products,
    'conversion_rate', ROUND((total_orders::numeric / NULLIF(total_visitors, 0)::numeric * 100)::numeric, 2),
    'average_order_value', ROUND((total_sales / NULLIF(total_orders, 0))::numeric, 2)
  ) as metrics,
  day as timestamp,
  user_id
FROM daily_totals;