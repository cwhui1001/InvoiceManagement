import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { invoiceId, pdfUrl, pdfFilename } = await request.json();

    if (!invoiceId || !pdfUrl || !pdfFilename) {
      return NextResponse.json(
        { error: 'Invoice ID, PDF URL, and filename are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update the invoice with PDF information
    const { data, error } = await supabase
      .from('OINV')
      .update({
        pdf_url: pdfUrl,
        pdf_filename: pdfFilename
      })
      .eq('DocNum', invoiceId)
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to link PDF to invoice' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `PDF successfully linked to invoice ${invoiceId}`,
      invoice: data[0]
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
