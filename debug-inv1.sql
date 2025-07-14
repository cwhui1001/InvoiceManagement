-- Test script to check if there's data in INV1 table
-- Run this in your Supabase SQL editor

-- Check if INV1 table exists and has data
SELECT * FROM "INV1" LIMIT 10;

-- Check if there are line items for any specific invoice
SELECT * FROM "INV1" WHERE "DocNum" = 'SO1000009';

-- Check all DocNums that have line items
SELECT DISTINCT "DocNum" FROM "INV1";

-- Check if there are any invoices in OINV that have corresponding line items
SELECT o."DocNum", o."CustName", COUNT(i."No") as line_item_count
FROM "OINV" o
LEFT JOIN "INV1" i ON o."DocNum" = i."DocNum"
GROUP BY o."DocNum", o."CustName"
ORDER BY line_item_count DESC;
