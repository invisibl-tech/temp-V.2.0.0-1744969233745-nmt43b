/*
  # Update platform_metrics table with user association

  1. Changes
    - Add user_id column to platform_metrics table
    - Update existing data to associate with test user
    - Modify RLS policies to restrict data access by user

  2. Security
    - Enable RLS
    - Add policies for authenticated users to only see their own data
    - Add policy for service role to manage all data
*/

-- Add user_id column
ALTER TABLE platform_metrics
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Update existing data to associate with test user (pinnkpp+pintest@gmail.com)
UPDATE platform_metrics
SET user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'pinnkpp+pintest@gmail.com'
  LIMIT 1
);

-- Make user_id required for future entries
ALTER TABLE platform_metrics
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read metrics" ON platform_metrics;
DROP POLICY IF EXISTS "Users can insert metrics" ON platform_metrics;
DROP POLICY IF EXISTS "Service role full access" ON platform_metrics;

-- Create new policies
CREATE POLICY "Users can read own metrics"
ON platform_metrics
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics"
ON platform_metrics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all metrics"
ON platform_metrics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_platform_metrics_user_id ON platform_metrics(user_id);