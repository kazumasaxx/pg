/*
  # Add reimbursement user field to receipts table

  1. Changes to Existing Tables
    - Add to `receipts`:
      - `reimbursement_user_id` (uuid, references auth.users) - The user who made the reimbursement

  2. Notes
    - The field is nullable since not all receipts are reimbursements
    - References auth.users table to ensure data integrity
*/

ALTER TABLE receipts 
  ADD COLUMN IF NOT EXISTS reimbursement_user_id uuid REFERENCES auth.users(id);