-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own metrics" ON platform_metrics;
DROP POLICY IF EXISTS "Users can insert own metrics" ON platform_metrics;
DROP POLICY IF EXISTS "Service role can manage all metrics" ON platform_metrics;

-- Enable RLS
ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Users can read own metrics"
ON platform_metrics
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own metrics"
ON platform_metrics
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage all metrics"
ON platform_metrics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_platform_metrics_user_id ON platform_metrics(user_id);