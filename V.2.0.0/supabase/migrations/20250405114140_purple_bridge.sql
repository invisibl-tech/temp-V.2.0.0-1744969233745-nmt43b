/*
  # Add GitHub configuration to profiles

  1. Changes
    - Add github_config JSONB column to profiles table
    - Add validation check for github_config structure

  2. Security
    - Maintains existing RLS policies
*/

-- Add github_config column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS github_config JSONB;

-- Add check constraint to ensure valid github_config structure
ALTER TABLE profiles
ADD CONSTRAINT valid_github_config CHECK (
  github_config IS NULL OR (
    github_config ? 'owner' AND
    github_config ? 'repo' AND
    github_config ? 'token' AND
    jsonb_typeof(github_config->'owner') = 'string' AND
    jsonb_typeof(github_config->'repo') = 'string' AND
    jsonb_typeof(github_config->'token') = 'string'
  )
);