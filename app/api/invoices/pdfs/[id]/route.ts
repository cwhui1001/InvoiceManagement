import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createAdminClient();

    // Get PDF record from database
    const { data: pdfRecord, error: dbError } = await supabase
      .from('pdf')
      .select('pdf_url, pdf_filename')
      .eq('id', id)
      .single();

    if (dbError || !pdfRecord) {
      return NextResponse.json(
        { error: 'PDF not found.' },
        { status: 404 }
      );
    }

    // Fetch the file from Supabase storage
    const { data: fileData, error: storageError } = await supabase
      .storage
      .from('invoices')
      .download(pdfRecord.pdf_url.replace(/.*\/invoices\//, ''));

    if (storageError || !fileData) {
      return NextResponse.json(
        { error: 'Failed to fetch PDF file.' },
        { status: 500 }
      );
    }

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer();

    // Return the PDF file
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${pdfRecord.pdf_filename}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });

  } catch (error) {
    console.error('PDF serving error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
