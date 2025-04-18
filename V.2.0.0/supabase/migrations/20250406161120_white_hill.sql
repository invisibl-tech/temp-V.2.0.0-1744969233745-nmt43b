/*
  # Fix TikTok Shop config validation

  1. Changes
    - Update platform_connections config validation for TikTok
    - Match actual API response structure
    - Remove unused fields

  2. Security
    - Maintains existing RLS policies
*/

-- Drop existing constraint
ALTER TABLE platform_connections 
DROP CONSTRAINT IF EXISTS platform_connections_config_check;

-- Add updated constraint
ALTER TABLE platform_connections 
ADD CONSTRAINT platform_connections_config_check CHECK (
  CASE platform
    WHEN 'tiktok' THEN (
      config ? 'access_token' AND
      config ? 'refresh_token' AND
      config ? 'expires_in' AND
      config ? 'store_id' AND
      config ? 'store_name' AND
      config ? 'region' AND
      config ? 'expires_at'
    )
    ELSE true
  END
);