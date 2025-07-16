import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    const supabase = await createAdminClient();

    console.log('Looking for PDF for invoice ID:', invoiceId);

    // Look for PDFs in the pdf table that match this invoice ID
    const { data: pdfFiles, error: pdfError } = await supabase
      .from('pdf')
      .select('*')
      .eq('InvoiceID', invoiceId)
      .order('created_at', { ascending: false });

    if (pdfError) {
      console.error('Error querying pdf table:', pdfError);
      return NextResponse.json(
        { error: 'Error searching for PDF files.' },
        { status: 500 }
      );
    }

    console.log('Found PDF files:', pdfFiles);

    if (!pdfFiles || pdfFiles.length === 0) {
      return NextResponse.json(
        { error: `No PDF files found for invoice ${invoiceId}. Upload a PDF file first.` },
        { status: 404 }
      );
    }

    // If multiple PDFs found, return JSON with options
    if (pdfFiles.length > 1) {
      return NextResponse.json({
        multiple: true,
        files: pdfFiles.map(file => ({
          id: file.id,
          filename: file.pdf_filename,
          url: `/api/invoices/pdfs/${file.id}`,
          created_at: file.created_at
        }))
      });
    }

    // Single PDF found - redirect to the PDF viewer
    const pdfFile = pdfFiles[0];
    
    // Get the file from Supabase storage
    const { data: fileData, error: storageError } = await supabase
      .storage
      .from('invoices')
      .download(`bulk-uploads/${pdfFile.pdf_filename}`);

    if (storageError || !fileData) {
      console.error('Storage Error:', storageError);
      return NextResponse.json(
        { error: 'Failed to retrieve PDF file from storage.' },
        { status: 500 }
      );
    }

    // Convert blob to buffer
    const fileBuffer = await fileData.arrayBuffer();

    // Return the PDF file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${pdfFile.pdf_filename}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });

  } catch (error) {
    console.error('PDF retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error while retrieving PDF.' },
      { status: 500 }
    );
  }
}
