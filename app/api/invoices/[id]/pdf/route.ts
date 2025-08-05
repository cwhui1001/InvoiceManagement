import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // Destructure params directly
) {
  try {
    const invoiceId = params.id;
    const supabase = await createAdminClient();

    console.log('Looking for PDF for invoice DocNum:', invoiceId);

    const { data: invoiceData, error: invoiceError } = await supabase
      .from('OINV')
      .select('pdf_url, DocNum')
      .eq('DocNum', invoiceId)
      .single();

    if (invoiceError) {
      console.error('Error querying OINV table:', invoiceError);
      return NextResponse.json(
        { error: `Error finding invoice: ${invoiceError.message}` },
        { status: 500 }
      );
    }

    console.log('Found invoice data:', invoiceData);

    if (!invoiceData?.pdf_url) {
      return NextResponse.json(
        { error: `No PDF URL found for invoice ${invoiceId}. Upload a PDF file first.` },
        { status: 404 }
      );
    }

    return NextResponse.redirect(invoiceData.pdf_url);
  } catch (error) {
    console.error('PDF retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error while retrieving PDF.' },
      { status: 500 }
    );
  }
}