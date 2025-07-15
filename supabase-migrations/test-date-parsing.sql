-- Test migration script - Run this to test before full migration
-- This tests the date parsing function on your actual data

-- Create the parsing function
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

-- Test the function on your actual data
SELECT 
    DocNum,
    DocDate as original_docdate,
    parse_date_string(DocDate) as parsed_docdate,
    DueDate as original_duedate,
    parse_date_string(DueDate) as parsed_duedate,
    CASE 
        WHEN parse_date_string(DocDate) IS NULL AND DocDate IS NOT NULL AND DocDate != 'NULL' 
        THEN 'PARSING_FAILED' 
        ELSE 'OK' 
    END as docdate_status,
    CASE 
        WHEN parse_date_string(DueDate) IS NULL AND DueDate IS NOT NULL AND DueDate != 'NULL' 
        THEN 'PARSING_FAILED' 
        ELSE 'OK' 
    END as duedate_status
FROM OINV 
ORDER BY DocNum
LIMIT 20;

-- Check for any parsing failures
SELECT COUNT(*) as total_records,
       COUNT(CASE WHEN DocDate IS NOT NULL AND DocDate != 'NULL' THEN 1 END) as non_null_docdate,
       COUNT(CASE WHEN parse_date_string(DocDate) IS NOT NULL THEN 1 END) as parsed_docdate,
       COUNT(CASE WHEN DueDate IS NOT NULL AND DueDate != 'NULL' THEN 1 END) as non_null_duedate,
       COUNT(CASE WHEN parse_date_string(DueDate) IS NOT NULL THEN 1 END) as parsed_duedate
FROM OINV;
