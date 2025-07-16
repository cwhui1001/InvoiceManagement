import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function PUT(request: Request) {
  try {
    const { pdfRecordId, invoiceId } = await request.json();

    if (!pdfRecordId) {
      return NextResponse.json(
        { error: 'PDF record ID is required.' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Update the PDF record with the identified invoice ID
    const { data, error } = await supabase
      .from('pdf')
      .update({ 
        InvoiceID: invoiceId 
      })
      .eq('id', pdfRecordId)
      .select()
      .single();

    if (error) {
      console.error('Database Error:', error);
      return NextResponse.json(
        { error: 'Failed to update PDF record.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'PDF record updated successfully',
      data: data
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
