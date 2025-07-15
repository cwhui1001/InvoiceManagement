-- Add PDF URL columns to OINV table
-- Run this in your Supabase SQL editor

-- Add pdf_url column to store the public URL of the PDF file
ALTER TABLE "OINV" ADD COLUMN IF NOT EXISTS "pdf_url" TEXT;

-- Add pdf_filename column to store the original filename
ALTER TABLE "OINV" ADD COLUMN IF NOT EXISTS "pdf_filename" TEXT;

-- Add a comment to document these columns
COMMENT ON COLUMN "OINV"."pdf_url" IS 'Public URL to the PDF file stored in Supabase storage';
COMMENT ON COLUMN "OINV"."pdf_filename" IS 'Original filename of the uploaded PDF';

-- Optional: Add an index for faster lookups if you plan to search by PDF filename
CREATE INDEX IF NOT EXISTS "idx_oinv_pdf_filename" ON "OINV"("pdf_filename");

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'OINV' 
AND column_name IN ('pdf_url', 'pdf_filename')
ORDER BY column_name;
