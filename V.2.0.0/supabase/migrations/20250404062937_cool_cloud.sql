/*
  # Add product costs table

  1. New Tables
    - `product_costs`
      - `id` (uuid, primary key)
      - `item_id` (text, unique)
      - `name` (text)
      - `size` (text)
      - `color` (text)
      - `cost` (numeric)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS product_costs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id text NOT NULL,
    name text NOT NULL,
    size text,
    color text,
    cost numeric NOT NULL CHECK (cost >= 0),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(item_id, user_id)
);

ALTER TABLE product_costs ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own product costs
CREATE POLICY "Users can read own product costs"
    ON product_costs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow users to insert their own product costs
CREATE POLICY "Users can insert own product costs"
    ON product_costs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own product costs
CREATE POLICY "Users can update own product costs"
    ON product_costs
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own product costs
CREATE POLICY "Users can delete own product costs"
    ON product_costs
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);