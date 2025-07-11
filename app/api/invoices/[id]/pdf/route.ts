import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    const supabase = await createClient();

    // Fetch invoice record to get PDF URL
    const { data: invoice, error: fetchError } = await supabase
      .from('OINV')
      .select('pdf_url')
      .eq('DocNum', invoiceId)
      .single();

    if (fetchError || !invoice?.pdf_url) {
      return NextResponse.json(
        { error: 'PDF not found for this invoice.' },
        { status: 404 }
      );
    }

    // Redirect to the PDF URL
    return NextResponse.redirect(invoice.pdf_url);
  } catch (error) {
    console.error('PDF Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve PDF.' },
      { status: 500 }
    );
  }
}
