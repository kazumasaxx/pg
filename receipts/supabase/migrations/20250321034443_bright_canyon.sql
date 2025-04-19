/*
  # Create receipts table

  1. New Tables
    - `receipts`
      - `id` (uuid, primary key)
      - `date` (date, not null)
      - `vendor` (text, not null)
      - `category` (text, not null)
      - `amount` (integer, not null)
      - `user_id` (uuid, not null, references auth.users)
      - `created_at` (timestamp with time zone, default: now())

  2. Security
    - Enable RLS on `receipts` table
    - Add policies for authenticated users to:
      - Read their own receipts
      - Insert their own receipts
      - Update their own receipts
*/

CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  vendor text NOT NULL,
  category text NOT NULL,
  amount integer NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

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