-- Migration to convert date columns from text to date type in Supabase
-- Run this in your Supabase SQL Editor

-- First, let's see what date formats we have in the database
SELECT DISTINCT DocDate, DueDate 
FROM OINV 
WHERE DocDate IS NOT NULL AND DocDate != 'NULL' 
LIMIT 20;

-- Step 1: Add new date columns
ALTER TABLE OINV 
ADD COLUMN DocDate_new DATE,
ADD COLUMN DueDate_new DATE;

-- Step 2: Create a function to parse various date formats
CREATE OR REPLACE FUNCTION parse_date_string(date_str TEXT)
RETURNS DATE AS $$
BEGIN
    -- Handle NULL or empty strings
    IF date_str IS NULL OR date_str = '' OR date_str = 'NULL' THEN
        RETURN NULL;
    END IF;
    
    -- Try DD/MM/YYYY format (e.g., 23/04/2024)
    IF date_str ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
        RETURN TO_DATE(date_str, 'DD/MM/YYYY');
    END IF;
    
    -- Try DD.MM.YYYY format (e.g., 20.06.2025)
    IF date_str ~ '^\d{1,2}\.\d{1,2}\.\d{4}$' THEN
        RETURN TO_DATE(date_str, 'DD.MM.YYYY');
    END IF;
    
    -- Try DD-MMM-YY format (e.g., 06-May-24)
    IF date_str ~ '^\d{1,2}-[A-Za-z]{3}-\d{2}$' THEN
        -- Convert YY to 20YY
        RETURN TO_DATE('20' || RIGHT(date_str, 2) || '-' || SUBSTRING(date_str, 4, 3) || '-' || LEFT(date_str, 2), 'YYYY-Mon-DD');
    END IF;
    
    -- Try ISO format (YYYY-MM-DD)
    IF date_str ~ '^\d{4}-\d{1,2}-\d{1,2}$' THEN
        RETURN date_str::DATE;
    END IF;
    
    -- Try other standard formats
    BEGIN
        RETURN date_str::DATE;
    EXCEPTION
        WHEN others THEN
            -- Log the problematic date and return NULL
            RAISE NOTICE 'Could not parse date: %', date_str;
            RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update the new columns with parsed dates
UPDATE OINV 
SET DocDate_new = parse_date_string(DocDate),
    DueDate_new = parse_date_string(DueDate);

-- Step 4: Check for any NULL values that couldn't be parsed
SELECT DocNum, DocDate, DocDate_new, DueDate, DueDate_new
FROM OINV
WHERE (DocDate IS NOT NULL AND DocDate != 'NULL' AND DocDate_new IS NULL)
   OR (DueDate IS NOT NULL AND DueDate != 'NULL' AND DueDate_new IS NULL);

-- Step 5: Drop the old columns and rename the new ones
-- WARNING: This will permanently delete the old text columns!
-- Make sure to backup your data first!

-- Drop old columns
ALTER TABLE OINV DROP COLUMN DocDate;
ALTER TABLE OINV DROP COLUMN DueDate;

-- Rename new columns
ALTER TABLE OINV RENAME COLUMN DocDate_new TO DocDate;
ALTER TABLE OINV RENAME COLUMN DueDate_new TO DueDate;

-- Step 6: Add constraints if needed
ALTER TABLE OINV 
ALTER COLUMN DocDate SET NOT NULL,
ALTER COLUMN DueDate SET NOT NULL;

-- Step 7: Create indexes for better performance
CREATE INDEX idx_oinv_docdate ON OINV(DocDate);
CREATE INDEX idx_oinv_duedate ON OINV(DueDate);

-- Step 8: Clean up the function
DROP FUNCTION parse_date_string(TEXT);

-- Verify the changes
SELECT DocNum, DocDate, DueDate, 
       EXTRACT(YEAR FROM DocDate) as doc_year,
       EXTRACT(MONTH FROM DocDate) as doc_month,
       EXTRACT(DAY FROM DocDate) as doc_day
FROM OINV 
LIMIT 10;
