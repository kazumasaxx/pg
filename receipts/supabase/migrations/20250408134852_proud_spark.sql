/*
  # Create users view for reimbursement selection

  1. New Views
    - `users_view`
      - Provides a safe way to access auth.users data
      - Only exposes necessary fields (id, email)
      - Accessible to authenticated users

  2. Security
    - Enable RLS on the view
    - Add policy for authenticated users to read
*/

CREATE OR REPLACE VIEW users_view AS
SELECT id, email
FROM auth.users;

-- Enable RLS
ALTER VIEW users_view SET (security_invoker = true);

-- Add policy for the underlying table
CREATE POLICY "Anyone can read users"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (true);