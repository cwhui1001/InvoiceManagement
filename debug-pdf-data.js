require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPdfData() {
  console.log('=== Checking PDF data ===');
  
  // Get all PDFs
  const { data: pdfs, error } = await supabase
    .from('pdf')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching PDFs:', error);
    return;
  }
  
  console.log('Total PDFs:', pdfs?.length || 0);
  
  pdfs?.forEach((pdf, index) => {
    console.log(`PDF ${index + 1}:`, {
      id: pdf.id,
      filename: pdf.pdf_filename,
      uploader_username: pdf.uploader_username,
      uploader_user_id: pdf.uploader_user_id,
      created_at: pdf.created_at
    });
  });
  
  // Get all invoices
  console.log('\n=== Checking Invoice data ===');
  const { data: invoices, error: invError } = await supabase
    .from('OINV')
    .select('DocNum, Status, CustName')
    .limit(5);
    
  if (invError) {
    console.error('Error fetching invoices:', invError);
    return;
  }
  
  invoices?.forEach((inv, index) => {
    console.log(`Invoice ${index + 1}:`, {
      DocNum: inv.DocNum,
      Status: inv.Status,
      CustName: inv.CustName
    });
  });
}

checkPdfData().catch(console.error);
