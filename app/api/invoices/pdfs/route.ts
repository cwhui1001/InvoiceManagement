import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');
    
    const supabase = await createAdminClient();
    
    let query = supabase
      .from('pdf')
      .select(`
        id,
        created_at,
        InvoiceID,
        pdf_url,
        pdf_filename
      `)
      .order('created_at', { ascending: false });

    // If invoiceId is provided, filter by it
    if (invoiceId) {
      query = query.eq('InvoiceID', invoiceId);
    }

    const { data: pdfs, error } = await query;

    if (error) {
      console.error('Database Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch PDF files.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pdfs: pdfs || [],
      total: pdfs?.length || 0
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
