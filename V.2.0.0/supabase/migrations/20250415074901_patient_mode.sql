/*
  # Fix platform_connections table structure

  1. Changes
    - Add status column
    - Add last_sync_at column
    - Update constraints
    - Fix config validation
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS platform_connections CASCADE;

-- Create platform_connections table with updated structure
CREATE TABLE platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL,
  config jsonb NOT NULL,
  status text NOT NULL DEFAULT 'active',
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Add unique constraint
  UNIQUE(user_id, platform),
  
  -- Add config validation
  CONSTRAINT platform_connections_config_check CHECK (
    CASE platform
      WHEN 'tiktok' THEN (
        config ? 'access_token' AND
        config ? 'refresh_token' AND
        config ? 'expires_in' AND
        config ? 'expires_at' AND
        config ? 'store_id' AND
        config ? 'store_name' AND
        config ? 'region'
      )
      ELSE true
    END
  ),

  -- Add status validation
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'error'))
);

-- Enable RLS
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own platform connections"
  ON platform_connections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_platform_connections_user_platform 
  ON platform_connections(user_id, platform);

CREATE INDEX idx_platform_connections_status
  ON platform_connections(status);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_platform_connections_updated_at
  BEFORE UPDATE ON platform_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();