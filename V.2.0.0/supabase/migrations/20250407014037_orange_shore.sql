/*
  # Add TikTok auth log table

  1. New Tables
    - `tiktok_auth_log`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `access_token` (text)
      - `refresh_token` (text)
      - `open_id` (text)
      - `expires_in` (int)
      - `refresh_expires_in` (int)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for service role access
*/

-- Create tiktok_auth_log table
CREATE TABLE tiktok_auth_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  open_id text,
  expires_in integer NOT NULL,
  refresh_expires_in integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tiktok_auth_log ENABLE ROW LEVEL SECURITY;

-- Create policy for service role
CREATE POLICY "Service role can manage tiktok_auth_log"
  ON tiktok_auth_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index for user_id
CREATE INDEX idx_tiktok_auth_log_user_id ON tiktok_auth_log(user_id);