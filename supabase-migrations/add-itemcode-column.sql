-- Update script to add ItemCode column to INV1 table
-- Run this in your Supabase SQL Editor

-- First, check if the column already exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'INV1' AND table_schema = 'public';

-- Add the ItemCode column if it doesn't exist
-- You can uncomment this line if you haven't added the column yet
-- ALTER TABLE INV1 ADD COLUMN ItemCode TEXT;

-- Check sample data to see the new column
SELECT DocNum, No, ItemCode, Description, Quantity, UnitPrice, Tax, Amount
FROM INV1 
LIMIT 10;

-- Update existing records to have empty ItemCode if needed
-- UPDATE INV1 SET ItemCode = '' WHERE ItemCode IS NULL;

-- Create an index for better performance if needed
-- CREATE INDEX idx_inv1_itemcode ON INV1(ItemCode);

-- Check the updated structure
SELECT * FROM INV1 LIMIT 5;
