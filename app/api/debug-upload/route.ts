import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createAdminClient();
    
    // Check recent uploads in storage
    const { data: files, error } = await supabase
      .storage
      .from('invoices')
      .list('uploads', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Error listing files:', error);
      return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
    }

    // Check invoices with PDF data
    const { data: invoicesWithPdf, error: invoicesError } = await supabase
      .from('OINV')
      .select('DocNum, CustName, pdf_url, pdf_filename')
      .not('pdf_url', 'is', null)
      .limit(5);

    // Check specific invoice 587878
    const { data: invoice587878, error: invoiceError } = await supabase
      .from('OINV')
      .select('DocNum, CustName, pdf_url, pdf_filename')
      .eq('DocNum', '587878')
      .single();

    return NextResponse.json({
      recentFiles: files?.map(f => ({
        name: f.name,
        created_at: f.created_at,
        size: f.metadata?.size
      })) || [],
      invoicesWithPdf: invoicesWithPdf || [],
      invoice587878: invoice587878 || null,
      invoiceError: invoiceError?.message || null
    });

  } catch (error) {
    console.error('Debug API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
