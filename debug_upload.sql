-- Manual test to verify upload system is working
-- Run this to check if your upload was processed

-- First, let's see if the file was uploaded to storage
-- Check the most recent uploads (you'll need to verify this in your Supabase Storage)

-- Then check if the system tried to update the database
-- Look for invoice 587878 specifically
SELECT 
    "DocNum", 
    "CustName", 
    "pdf_url", 
    "pdf_filename",
    "DocDate"
FROM "OINV" 
WHERE "DocNum" = '587878';

-- Check if there are any invoices with PDF data
SELECT 
    "DocNum", 
    "CustName", 
    "pdf_url", 
    "pdf_filename"
FROM "OINV" 
WHERE "pdf_url" IS NOT NULL 
LIMIT 5;

-- Let's manually update invoice 587878 with a test PDF URL
-- Replace this with an actual PDF URL from your storage
UPDATE "OINV" 
SET 
    "pdf_url" = 'https://rbqgchlapcolwwkqhgohb.supabase.co/storage/v1/object/public/invoices/uploads/1752223307267-587878.pdf',
    "pdf_filename" = '1752223307267-587878.pdf'
WHERE "DocNum" = '587878';

-- Verify the update
SELECT 
    "DocNum", 
    "CustName", 
    "pdf_url", 
    "pdf_filename"
FROM "OINV" 
WHERE "DocNum" = '587878';
