/*
  # Create store default category table

  1. New Tables
    - `store_default_category`
      - `id` (uuid, primary key)
      - `store_keyword` (text, not null) - Keyword to match in vendor name
      - `category_id` (uuid, not null) - Reference to category_settings
      - `created_at` (timestamptz, default: now())

  2. Security
    - Enable RLS on `store_default_category` table
    - Add policy for authenticated users to read store defaults
    - Add foreign key constraint to category_settings
*/

CREATE TABLE IF NOT EXISTS store_default_category (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_keyword text NOT NULL,
  category_id uuid NOT NULL REFERENCES category_settings(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE store_default_category ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read store default categories"
  ON store_default_category
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert some example defaults
INSERT INTO store_default_category (store_keyword, category_id)
SELECT 'コンビニ', id FROM category_settings WHERE name = '消耗品費'
ON CONFLICT DO NOTHING;

INSERT INTO store_default_category (store_keyword, category_id)
SELECT 'スーパー', id FROM category_settings WHERE name = '消耗品費'
ON CONFLICT DO NOTHING;

INSERT INTO store_default_category (store_keyword, category_id)
SELECT 'タクシー', id FROM category_settings WHERE name = '交通費'
ON CONFLICT DO NOTHING;

INSERT INTO store_default_category (store_keyword, category_id)
SELECT '電車', id FROM category_settings WHERE name = '交通費'
ON CONFLICT DO NOTHING;