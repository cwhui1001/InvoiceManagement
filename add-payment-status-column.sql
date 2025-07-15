-- Add Status column to OINV table for general task completion tracking
-- Run this in your Supabase SQL editor

ALTER TABLE "OINV" 
ADD COLUMN "Status" TEXT DEFAULT 'Pending';

-- Update existing records to set default status
-- You can modify this logic based on your needs
UPDATE "OINV" 
SET "Status" = 'Done' 
WHERE "TotalwithGST" > 0 AND "DocDate" < CURRENT_DATE - INTERVAL '30 days';

-- Leave other records as 'Pending' (default value)
