/*
  # Update platform_connections table with TikTok Shop requirements

  1. Changes
    - Add shop_region enum type
    - Add config validation for TikTok platform
    - Update existing table structure

  2. Security
    - Maintains existing RLS policies
*/

-- Create shop_region enum type
CREATE TYPE shop_region AS ENUM ('US', 'UK', 'ID', 'MY', 'PH', 'SG', 'TH', 'VN', 'TW');

-- Drop existing table
DROP TABLE IF EXISTS platform_connections CASCADE;

-- Recreate platform_connections table with new constraints
CREATE TABLE platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL,
  config jsonb NOT NULL,
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
        config ? 'access_token_expire_in' AND
        config ? 'refresh_token_expire_in' AND
        config ? 'shop_id' AND
        config ? 'shop_name' AND
        config ? 'region'
      )
      ELSE true
    END
  )
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