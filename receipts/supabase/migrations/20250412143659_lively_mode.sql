/*
  # Add item value tracking

  1. New Tables
    - `item_values`
      - `id` (uuid, primary key)
      - `date` (date, not null) - Date of the price record
      - `vendor` (text, not null) - Store name
      - `jan_code` (text, not null) - JAN code of the item
      - `item_name` (text, not null) - Product name
      - `price` (integer, not null) - Price in JPY
      - `created_at` (timestamptz, default: now())
      - Composite unique constraint on (jan_code, vendor, date)

  2. Security
    - Enable RLS on `item_values` table
    - Add policy for authenticated users to read and insert item values
*/

CREATE TABLE IF NOT EXISTS item_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  vendor text NOT NULL,
  jan_code text NOT NULL,
  item_name text NOT NULL,
  price integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(jan_code, vendor, date)
);

ALTER TABLE item_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read item values"
  ON item_values
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert item values"
  ON item_values
  FOR INSERT
  TO authenticated
  WITH CHECK (true);