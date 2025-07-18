import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const docNum = searchParams.get('docNum');
    const invoiceUuid = searchParams.get('invoiceUuid');
    
    const supabase = await createAdminClient();
    
    let query = supabase
      .from('pdf')
      .select(`
        id,
        created_at,
        pdf_url,
        pdf_filename,
        pdf_uuid,
        oinv_uuid,
        OINV(
          uuid,
          DocNum,
          CustName,
          Status
        )
      `)
      .order('created_at', { ascending: false });

    // If docNum is provided, filter by it
    if (docNum) {
      query = query.eq('OINV.DocNum', docNum);
    }

    // If invoiceUuid is provided, filter by it
    if (invoiceUuid) {
      query = query.eq('oinv_uuid', invoiceUuid);
    }

    const { data: pdfs, error } = await query;

    if (error) {
      console.error('Database Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch PDF files.' },
        { status: 500 }
      );
    }

    // Transform the data to include invoice_docnum for easier frontend handling
    const transformedPdfs = pdfs?.map(pdf => ({
      ...pdf,
      invoice_docnum: Array.isArray(pdf.OINV) ? (pdf.OINV[0] as any)?.DocNum || null : (pdf.OINV as any)?.DocNum || null
    })) || [];

    return NextResponse.json({
      pdfs: transformedPdfs,
      total: transformedPdfs.length
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
