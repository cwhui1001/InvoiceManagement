import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const { pdfUuid, invoiceNumber } = await request.json();

    if (!pdfUuid || !invoiceNumber) {
      return NextResponse.json(
        { error: 'PDF UUID and invoice number are required' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // 1. Find the OINV record by DocNum
    const { data: oinvRecord, error: oinvError } = await supabase
      .from('OINV')
      .select('uuid, DocNum, CustName, Status')
      .eq('DocNum', invoiceNumber)
      .single();

    if (oinvError || !oinvRecord) {
      return NextResponse.json(
        { error: `Invoice ${invoiceNumber} not found in database` },
        { status: 404 }
      );
    }

    // 2. Update the PDF record to link it to the invoice
    const { data: updatedPdf, error: updateError } = await supabase
      .from('pdf')
      .update({
        oinv_uuid: oinvRecord.uuid
      })
      .eq('pdf_uuid', pdfUuid)
      .select('pdf_uuid, pdf_filename, oinv_uuid')
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to link PDF: ${updateError.message}` },
        { status: 500 }
      );
    }

    // 3. Optionally update the OINV record with PDF reference
    await supabase
      .from('OINV')
      .update({
        last_updated: new Date().toISOString()
      })
      .eq('uuid', oinvRecord.uuid);

    return NextResponse.json({
      success: true,
      message: `PDF linked to invoice ${invoiceNumber}`,
      pdf: updatedPdf,
      invoice: oinvRecord
    });

  } catch (error) {
    console.error('Link PDF error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
