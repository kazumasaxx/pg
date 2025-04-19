/*
  # Create receipts table for storing receipt data

  1. New Tables
    - `receipts`
      - `id` (uuid, primary key) - Unique identifier for each receipt
      - `date` (date, not null) - Date of the receipt
      - `vendor` (text, not null) - Name of the vendor/store
      - `category` (text, not null) - Accounting category
      - `amount` (integer, not null) - Amount in Japanese Yen
      - `user_id` (uuid, not null) - Reference to auth.users table
      - `created_at` (timestamptz) - Timestamp when the receipt was created

  2. Security
    - Enable Row Level Security (RLS)
    - Add policies for:
      - Select: Users can only read their own receipts
      - Insert: Users can only insert receipts with their own user_id
      - Update: Users can only update their own receipts
*/

-- Create the receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  vendor text NOT NULL,
  category text NOT NULL,
  amount integer NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own receipts"
  ON receipts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipts"
  ON receipts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipts"
  ON receipts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);