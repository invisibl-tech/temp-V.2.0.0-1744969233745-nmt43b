/*
  # Add RLS policies for platform metrics

  1. Changes
    - Add RLS policies for platform_metrics table to allow:
      - INSERT for authenticated users (their own data only)
      - UPDATE for authenticated users (their own data only)
      - SELECT for authenticated users (their own data only)

  2. Security
    - Ensures users can only access their own metrics data
    - Validates user_id matches authenticated user's ID
    - Maintains data isolation between users
*/

-- Enable RLS if not already enabled
ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own metrics" ON platform_metrics;
DROP POLICY IF EXISTS "Users can update own metrics" ON platform_metrics;
DROP POLICY IF EXISTS "Users can read own metrics" ON platform_metrics;

-- Create INSERT policy
CREATE POLICY "Users can insert own metrics"
ON platform_metrics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create UPDATE policy
CREATE POLICY "Users can update own metrics"
ON platform_metrics
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create SELECT policy
CREATE POLICY "Users can read own metrics"
ON platform_metrics
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);