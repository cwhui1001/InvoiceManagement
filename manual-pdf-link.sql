-- Manual SQL to link existing uploaded PDF to invoice 587878
-- Replace 'your-actual-public-url' with the actual URL from your uploaded files

UPDATE "OINV" 
SET 
  pdf_url = 'https://your-supabase-project.supabase.co/storage/v1/object/public/invoices/uploads/1752571237639-KARA INVOICE.pdf',
  pdf_filename = '1752571237639-KARA INVOICE.pdf'
WHERE "DocNum" = '587878';

-- To find the actual URL of your uploaded files:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to Storage > invoices bucket
-- 3. Find your uploaded file
-- 4. Copy the public URL
-- 5. Use that URL in the UPDATE statement above
