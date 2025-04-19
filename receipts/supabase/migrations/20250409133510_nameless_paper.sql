/*
  # Update reimbursement users table

  1. Changes
    - Remove user_id column from reimbursement_users
    - Update foreign key constraint in receipts table

  2. Security
    - Maintain RLS policies for authenticated users
*/

-- Drop the existing foreign key constraint from receipts
ALTER TABLE receipts
  DROP CONSTRAINT IF EXISTS receipts_reimbursement_user_id_fkey;

-- Drop the existing reimbursement_users table
DROP TABLE IF EXISTS reimbursement_users;

-- Create new reimbursement_users table
CREATE TABLE reimbursement_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE reimbursement_users ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Anyone can read reimbursement users"
  ON reimbursement_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Add foreign key constraint back to receipts
ALTER TABLE receipts
  ADD CONSTRAINT receipts_reimbursement_user_id_fkey 
  FOREIGN KEY (reimbursement_user_id) 
  REFERENCES reimbursement_users(id);