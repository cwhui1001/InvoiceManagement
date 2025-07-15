-- Test script to manually update invoice 587878 with a PDF URL
-- Run this in your Supabase SQL Editor to test the PDF linking

-- First, let's see what PDF files are available in storage
-- You'll need to get the actual public URL from your Supabase storage

-- Example update (replace with actual PDF URL from your storage):
UPDATE "OINV" 
SET 
    "pdf_url" = 'https://rbqgchlapcolwwkqhgohb.supabase.co/storage/v1/object/public/invoices/uploads/175222330726-Multiple.pdf',
    "pdf_filename" = '175222330726-Multiple.pdf'
WHERE "DocNum" = '587878';

-- Verify the update worked
SELECT "DocNum", "pdf_url", "pdf_filename" 
FROM "OINV" 
WHERE "DocNum" = '587878';

-- If you want to test with a different invoice that might match the storage files:
-- Look for invoice IDs that might match your storage filenames
SELECT "DocNum", "CustName", "pdf_url" 
FROM "OINV" 
WHERE "DocNum" IN ('175222330726', '175222419619', '175222970760', '175222569518', '175222665018')
LIMIT 10;
