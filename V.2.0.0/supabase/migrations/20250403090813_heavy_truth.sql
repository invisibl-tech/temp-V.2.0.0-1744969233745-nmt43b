/*
  # E-commerce Platform Metrics Schema

  1. New Tables
    - platform_metrics
      - id (uuid, primary key)
      - platform (text) - The e-commerce platform (e.g., 'shopee', 'lazada')
      - metrics (jsonb) - Stores various metrics like sales, orders, etc.
      - timestamp (timestamptz) - When the metrics were recorded
      - created_at (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE platform_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  metrics jsonb NOT NULL,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own metrics"
  ON platform_metrics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own metrics"
  ON platform_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);