/**
 * Database Migration: Add PDF URL columns to OINV table
 * 
 * This script adds the necessary columns to store PDF file information
 * in the OINV table so that uploaded PDFs can be linked to invoices.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addPdfColumnsToOINV() {
  try {
    console.log('Adding PDF columns to OINV table...');
    
    // Add pdf_url column
    const { error: pdfUrlError } = await supabase
      .from('OINV')
      .select('pdf_url')
      .limit(1);
    
    if (pdfUrlError && pdfUrlError.message.includes('column "pdf_url" does not exist')) {
      console.log('Adding pdf_url column...');
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE "OINV" ADD COLUMN "pdf_url" TEXT;'
      });
      
      if (error) {
        console.error('Error adding pdf_url column:', error);
        throw error;
      }
      console.log('✅ pdf_url column added successfully');
    } else {
      console.log('✅ pdf_url column already exists');
    }
    
    // Add pdf_filename column
    const { error: pdfFilenameError } = await supabase
      .from('OINV')
      .select('pdf_filename')
      .limit(1);
    
    if (pdfFilenameError && pdfFilenameError.message.includes('column "pdf_filename" does not exist')) {
      console.log('Adding pdf_filename column...');
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE "OINV" ADD COLUMN "pdf_filename" TEXT;'
      });
      
      if (error) {
        console.error('Error adding pdf_filename column:', error);
        throw error;
      }
      console.log('✅ pdf_filename column added successfully');
    } else {
      console.log('✅ pdf_filename column already exists');
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  addPdfColumnsToOINV()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { addPdfColumnsToOINV };
