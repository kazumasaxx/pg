/*
  # Create category settings table

  1. New Tables
    - `category_settings`
      - `id` (uuid, primary key)
      - `name` (text, not null) - Category name
      - `created_at` (timestamptz, default: now())

  2. Security
    - Enable RLS on `category_settings` table
    - Add policy for authenticated users to read categories
    - Insert default categories
*/

CREATE TABLE IF NOT EXISTS category_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE category_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read category settings"
  ON category_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default categories
INSERT INTO category_settings (name) VALUES
  ('消耗品費'),
  ('交通費'),
  ('通信費'),
  ('会議費'),
  ('広告宣伝費'),
  ('その他')
ON CONFLICT (name) DO NOTHING;