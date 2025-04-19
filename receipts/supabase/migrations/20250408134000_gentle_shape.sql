/*
  # Add reimbursement fields to receipts table

  1. New Tables
    - `reimbursement_types`
      - `id` (uuid, primary key)
      - `name` (text, not null) - Name of the reimbursement type
      - `is_positive` (boolean, not null) - Whether this type adds (+) or subtracts (-) from the total
      - `created_at` (timestamptz, default: now())

  2. Changes to Existing Tables
    - Add to `receipts`:
      - `reimbursement_type_id` (uuid, references reimbursement_types)
      - `is_reimbursed` (boolean, default: false)

  3. Security
    - Enable RLS on `reimbursement_types` table
    - Add policy for authenticated users to read reimbursement types
*/

-- Create reimbursement_types table
CREATE TABLE IF NOT EXISTS reimbursement_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_positive boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE reimbursement_types ENABLE ROW LEVEL SECURITY;

-- Add read policy
CREATE POLICY "Anyone can read reimbursement types"
  ON reimbursement_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default reimbursement types
INSERT INTO reimbursement_types (name, is_positive) VALUES
  ('立替支払', false),
  ('立替精算', true)
ON CONFLICT (name) DO NOTHING;

-- Add new columns to receipts
ALTER TABLE receipts 
  ADD COLUMN IF NOT EXISTS reimbursement_type_id uuid REFERENCES reimbursement_types(id),
  ADD COLUMN IF NOT EXISTS is_reimbursed boolean DEFAULT false;