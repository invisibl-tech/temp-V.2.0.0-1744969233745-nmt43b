/*
  # Add platform metrics mock data

  1. Data Generation
    - Generate historical data from Jan 1, 2024
    - Include realistic sales patterns with:
      - Weekly seasonality (weekends higher)
      - Monthly seasonality (start/end of month higher)
      - Growth trend
      - Random variations
    - Multiple platforms (Shopee, Lazada)
    - Multiple product types (clothing, shoes, accessories, bags)

  2. Data Patterns
    - Base sales: 10,000 units
    - Daily growth rate: 0.2%
    - Weekly patterns:
      - Weekends: +30-40% increase
      - Fridays: +20% increase
      - Weekdays: -10% decrease
    - Monthly patterns:
      - Start/end of month: +20% increase
*/

-- Insert mock data
WITH RECURSIVE dates AS (
    SELECT '2024-01-01'::date AS date
    UNION ALL
    SELECT date + 1
    FROM dates
    WHERE date < CURRENT_DATE
),
platforms AS (
    SELECT unnest(ARRAY['shopee', 'lazada']) AS platform
),
product_types AS (
    SELECT unnest(ARRAY['clothing', 'shoes', 'accessories', 'bags']) AS type
),
base_metrics AS (
    SELECT 
        dates.date,
        platforms.platform,
        product_types.type,
        -- Base sales with growth trend (0.2% daily growth)
        10000 * (1 + 0.002 * (dates.date - '2024-01-01'::date)) AS base_sales,
        -- Weekly seasonality
        CASE EXTRACT(DOW FROM dates.date)
            WHEN 0 THEN 1.3 -- Sunday
            WHEN 6 THEN 1.4 -- Saturday
            WHEN 5 THEN 1.2 -- Friday
            ELSE 0.9 -- Weekdays
        END AS day_multiplier,
        -- Monthly seasonality
        CASE 
            WHEN EXTRACT(DAY FROM dates.date) <= 5 OR EXTRACT(DAY FROM dates.date) >= 25 
            THEN 1.2 
            ELSE 1.0 
        END AS month_multiplier
    FROM dates
    CROSS JOIN platforms
    CROSS JOIN product_types
)
INSERT INTO platform_metrics (platform, metrics, timestamp, created_at)
SELECT 
    platform,
    jsonb_build_object(
        'sales', FLOOR(base_sales * day_multiplier * month_multiplier * (0.9 + random() * 0.2)),
        'orders', FLOOR(base_sales * day_multiplier * month_multiplier * (0.9 + random() * 0.2) / (1000 + random() * 500)),
        'conversion_rate', 2 + random() * 3,
        'product_type', type,
        'product_name', 
        CASE type
            WHEN 'clothing' THEN 'Summer Collection ' || floor(random() * 5 + 1)::text
            WHEN 'shoes' THEN 'Casual Series ' || floor(random() * 3 + 1)::text
            WHEN 'accessories' THEN 'Fashion Set ' || floor(random() * 4 + 1)::text
            ELSE 'Premium Collection ' || floor(random() * 3 + 1)::text
        END
    ),
    date + random() * INTERVAL '1 day',
    date + random() * INTERVAL '1 day'
FROM base_metrics;