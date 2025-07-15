-- Check current column types in OINV table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'OINV' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check sample data to see current date formats
SELECT DocNum, DocDate, DueDate
FROM OINV
WHERE DocDate IS NOT NULL
LIMIT 10;

-- If your columns are still TEXT type, you need to convert them to DATE type
-- First backup your data (IMPORTANT!)
-- CREATE TABLE OINV_backup AS SELECT * FROM OINV;

-- Option 1: If columns are TEXT and you want to convert to DATE type
-- You'll need to convert existing data first

-- Create a function to safely convert text dates to DATE type
CREATE OR REPLACE FUNCTION safe_date_convert(date_text TEXT)
RETURNS DATE AS $$
BEGIN
    -- Handle null/empty cases
    IF date_text IS NULL OR date_text = '' OR date_text = 'NULL' THEN
        RETURN NULL;
    END IF;
    
    -- Try DD.MM.YYYY format (like 20.06.2025)
    IF date_text ~ '^\d{1,2}\.\d{1,2}\.\d{4}$' THEN
        RETURN TO_DATE(date_text, 'DD.MM.YYYY');
    END IF;
    
    -- Try DD/MM/YYYY format (like 23/04/2024)
    IF date_text ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
        RETURN TO_DATE(date_text, 'DD/MM/YYYY');
    END IF;
    
    -- Try DD-MMM-YY format (like 06-May-24)
    IF date_text ~ '^\d{1,2}-[A-Za-z]{3}-\d{2}$' THEN
        RETURN TO_DATE('20' || RIGHT(date_text, 2) || '-' || SUBSTRING(date_text, 4, 3) || '-' || LEFT(date_text, 2), 'YYYY-Mon-DD');
    END IF;
    
    -- Try ISO format (YYYY-MM-DD)
    IF date_text ~ '^\d{4}-\d{1,2}-\d{1,2}$' THEN
        RETURN date_text::DATE;
    END IF;
    
    -- Default fallback
    BEGIN
        RETURN date_text::DATE;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Could not convert date: %', date_text;
            RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql;

-- Test the conversion function
SELECT DocNum, DocDate, safe_date_convert(DocDate) as converted_docdate,
       DueDate, safe_date_convert(DueDate) as converted_duedate
FROM OINV
WHERE DocDate IS NOT NULL
LIMIT 10;

-- If you need to convert your columns from TEXT to DATE type:
-- Step 1: Add new DATE columns
-- ALTER TABLE OINV ADD COLUMN DocDate_new DATE;
-- ALTER TABLE OINV ADD COLUMN DueDate_new DATE;

-- Step 2: Convert existing data
-- UPDATE OINV SET DocDate_new = safe_date_convert(DocDate);
-- UPDATE OINV SET DueDate_new = safe_date_convert(DueDate);

-- Step 3: Check for any conversion failures
-- SELECT DocNum, DocDate, DocDate_new, DueDate, DueDate_new
-- FROM OINV
-- WHERE (DocDate IS NOT NULL AND DocDate_new IS NULL)
--    OR (DueDate IS NOT NULL AND DueDate_new IS NULL);

-- Step 4: Once you're satisfied with the conversion, replace the old columns
-- ALTER TABLE OINV DROP COLUMN DocDate;
-- ALTER TABLE OINV DROP COLUMN DueDate;
-- ALTER TABLE OINV RENAME COLUMN DocDate_new TO DocDate;
-- ALTER TABLE OINV RENAME COLUMN DueDate_new TO DueDate;

-- Clean up
-- DROP FUNCTION safe_date_convert(TEXT);
