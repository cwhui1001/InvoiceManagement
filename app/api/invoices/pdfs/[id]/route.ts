import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pdfId = params.id;
    
    if (!pdfId) {
      return NextResponse.json(
        { error: 'PDF ID is required.' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Get PDF record from database
    const { data: pdfRecord, error: dbError } = await supabase
      .from('pdf')
      .select('*')
      .eq('id', pdfId)
      .single();

    if (dbError || !pdfRecord) {
      console.error('Database Error:', dbError);
      return NextResponse.json(
        { error: 'PDF not found.' },
        { status: 404 }
      );
    }

    // Get the file from Supabase storage
    const { data: fileData, error: storageError } = await supabase
      .storage
      .from('invoices')
      .download(`bulk-uploads/${pdfRecord.pdf_filename}`);

    if (storageError || !fileData) {
      console.error('Storage Error:', storageError);
      return NextResponse.json(
        { error: 'Failed to retrieve file.' },
        { status: 500 }
      );
    }

    // Convert blob to buffer
    const fileBuffer = await fileData.arrayBuffer();

    // Return the PDF file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${pdfRecord.pdf_filename}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });

  } catch (error) {
    console.error('PDF Serve Error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
