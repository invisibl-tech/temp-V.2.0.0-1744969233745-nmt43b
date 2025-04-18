/*
  # Add support tickets table

  1. New Tables
    - `support_tickets`
      - `id` (uuid, primary key)
      - `ticket_id` (text, unique) - The human-readable ticket ID (e.g., INV-12345678)
      - `user_id` (uuid, nullable) - References auth.users if the user is logged in
      - `email` (text) - Email address of the person who submitted the ticket
      - `business_name` (text, nullable)
      - `category` (text)
      - `subject` (text)
      - `message` (text)
      - `status` (text) - Current status of the ticket (open, in_progress, resolved, closed)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for:
      - Service role to manage all tickets
      - Authenticated users to read their own tickets
*/

-- Create support_tickets table
CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  business_name text,
  category text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Add constraint to validate status values
  CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'))
);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service role can manage support tickets"
  ON support_tickets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read own tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.jwt()->>'email' = email
  );

-- Create index for faster lookups
CREATE INDEX idx_support_tickets_ticket_id ON support_tickets(ticket_id);
CREATE INDEX idx_support_tickets_email ON support_tickets(email);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- Add trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();