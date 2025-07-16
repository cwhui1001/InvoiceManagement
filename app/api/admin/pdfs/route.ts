import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createAdminClient();

    // Get all PDFs from the database
    const { data: pdfs, error } = await supabase
      .from('pdf')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database Error:', error);
      return NextResponse.json({ error: 'Failed to fetch PDFs' }, { status: 500 });
    }

    return NextResponse.json({ pdfs: pdfs || [] });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { pdfId, invoiceId } = await request.json();
    
    if (!pdfId || !invoiceId) {
      return NextResponse.json({ error: 'PDF ID and Invoice ID are required' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Update the PDF record with the invoice ID
    const { data, error } = await supabase
      .from('pdf')
      .update({ InvoiceID: invoiceId })
      .eq('id', pdfId)
      .select()
      .single();

    if (error) {
      console.error('Update Error:', error);
      return NextResponse.json({ error: 'Failed to link PDF to invoice' }, { status: 500 });
    }

    return NextResponse.json({ message: 'PDF linked successfully', data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
