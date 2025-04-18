/*
  # Fix platform metrics RLS policies

  1. Changes
    - Add RLS policy for inserting metrics from edge functions
    - Ensure authenticated users can read their metrics
    - Add policy for service role to manage metrics

  2. Security
    - Enable RLS on platform_metrics table
    - Add policies for authenticated users and service role
*/

-- Enable RLS on platform_metrics table if not already enabled
ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own metrics" ON platform_metrics;
DROP POLICY IF EXISTS "Users can read their own metrics" ON platform_metrics;
DROP POLICY IF EXISTS "Service role full access" ON platform_metrics;

-- Create policy for service role to have full access
CREATE POLICY "Service role full access"
ON platform_metrics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users to read metrics
CREATE POLICY "Users can read metrics"
ON platform_metrics
FOR SELECT
TO authenticated
USING (true);

-- Create policy for authenticated users to insert metrics
CREATE POLICY "Users can insert metrics"
ON platform_metrics
FOR INSERT
TO authenticated
WITH CHECK (true);