/*
  # Insert mock data for platform metrics

  1. Data Changes
    - Insert mock data for platform metrics table with:
      - Historical data points for both Shopee and Lazada
      - Metrics including sales, orders, conversion rates, and average order values
      - Timestamps spread across recent dates for trend visualization

  2. Security
    - No security changes needed as we're using existing RLS policies
*/

-- Insert mock data for Shopee
INSERT INTO platform_metrics (platform, metrics, timestamp)
VALUES
  ('shopee', 
   jsonb_build_object(
    'sales', 8500,
    'orders', 85,
    'conversion_rate', 4.2,
    'average_order_value', 100
   ),
   NOW() - INTERVAL '6 days'
  ),
  ('shopee',
   jsonb_build_object(
    'sales', 9200,
    'orders', 92,
    'conversion_rate', 4.5,
    'average_order_value', 105
   ),
   NOW() - INTERVAL '5 days'
  ),
  ('shopee',
   jsonb_build_object(
    'sales', 8800,
    'orders', 88,
    'conversion_rate', 4.3,
    'average_order_value', 102
   ),
   NOW() - INTERVAL '4 days'
  ),
  ('shopee',
   jsonb_build_object(
    'sales', 9500,
    'orders', 95,
    'conversion_rate', 4.6,
    'average_order_value', 108
   ),
   NOW() - INTERVAL '3 days'
  ),
  ('shopee',
   jsonb_build_object(
    'sales', 10200,
    'orders', 98,
    'conversion_rate', 4.8,
    'average_order_value', 112
   ),
   NOW() - INTERVAL '2 days'
  ),
  ('shopee',
   jsonb_build_object(
    'sales', 11000,
    'orders', 105,
    'conversion_rate', 5.0,
    'average_order_value', 115
   ),
   NOW() - INTERVAL '1 day'
  ),
  ('shopee',
   jsonb_build_object(
    'sales', 12000,
    'orders', 110,
    'conversion_rate', 5.2,
    'average_order_value', 120
   ),
   NOW()
  );

-- Insert mock data for Lazada
INSERT INTO platform_metrics (platform, metrics, timestamp)
VALUES
  ('lazada',
   jsonb_build_object(
    'sales', 7200,
    'orders', 72,
    'conversion_rate', 3.8,
    'average_order_value', 95
   ),
   NOW() - INTERVAL '6 days'
  ),
  ('lazada',
   jsonb_build_object(
    'sales', 7800,
    'orders', 78,
    'conversion_rate', 4.0,
    'average_order_value', 98
   ),
   NOW() - INTERVAL '5 days'
  ),
  ('lazada',
   jsonb_build_object(
    'sales', 8100,
    'orders', 81,
    'conversion_rate', 4.1,
    'average_order_value', 100
   ),
   NOW() - INTERVAL '4 days'
  ),
  ('lazada',
   jsonb_build_object(
    'sales', 8500,
    'orders', 85,
    'conversion_rate', 4.2,
    'average_order_value', 102
   ),
   NOW() - INTERVAL '3 days'
  ),
  ('lazada',
   jsonb_build_object(
    'sales', 9000,
    'orders', 90,
    'conversion_rate', 4.4,
    'average_order_value', 105
   ),
   NOW() - INTERVAL '2 days'
  ),
  ('lazada',
   jsonb_build_object(
    'sales', 9500,
    'orders', 95,
    'conversion_rate', 4.6,
    'average_order_value', 108
   ),
   NOW() - INTERVAL '1 day'
  ),
  ('lazada',
   jsonb_build_object(
    'sales', 10000,
    'orders', 100,
    'conversion_rate', 4.8,
    'average_order_value', 110
   ),
   NOW()
  );