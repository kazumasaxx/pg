/*
  # Create reimbursement users table

  1. New Tables
    - `reimbursement_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `username` (text, not null)
      - `created_at` (timestamptz, default: now())

  2. Changes to Existing Tables
    - Update `receipts` table to reference reimbursement_users instead of auth.users

  3. Security
    - Enable RLS on `reimbursement_users` table
    - Add policy for authenticated users to read reimbursement users
*/

-- Create reimbursement_users table
CREATE TABLE IF NOT EXISTS reimbursement_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  username text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE reimbursement_users ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Anyone can read reimbursement users"
  ON reimbursement_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own reimbursement user"
  ON reimbursement_users
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update receipts table to reference reimbursement_users
ALTER TABLE receipts
  DROP CONSTRAINT IF EXISTS receipts_reimbursement_user_id_fkey,
  ADD CONSTRAINT receipts_reimbursement_user_id_fkey 
    FOREIGN KEY (reimbursement_user_id) 
    REFERENCES reimbursement_users(id);