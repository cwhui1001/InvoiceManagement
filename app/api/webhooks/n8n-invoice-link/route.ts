import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const { pdfRecordId, invoiceId, invoiceData, ocrData } = await request.json();

    console.log('Received n8n webhook request:', { pdfRecordId, invoiceId, invoiceData, ocrData });

    if (!pdfRecordId) {
      return NextResponse.json(
        { error: 'PDF record ID is required.' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    console.log('Linking PDF to invoice:', { pdfRecordId, invoiceId, invoiceData });

    // Update the PDF record with the identified invoice ID
    const { data: pdfData, error: pdfError } = await supabase
      .from('pdf')
      .update({ 
        InvoiceID: invoiceId 
      })
      .eq('id', pdfRecordId)
      .select()
      .single();

    if (pdfError) {
      console.error('Database Error updating PDF:', pdfError);
      return NextResponse.json(
        { error: 'Failed to update PDF record.' },
        { status: 500 }
      );
    }

    // If we have invoice data and the invoice doesn't exist, create it
    if (invoiceData && invoiceId) {
      try {
        // Check if invoice exists
        const { data: existingInvoice, error: checkError } = await supabase
          .from('OINV')
          .select('DocNum')
          .eq('DocNum', invoiceId)
          .single();

        if (checkError && checkError.code === 'PGRST116') {
          // Invoice doesn't exist, create it
          const newInvoice = {
            DocNum: invoiceId,
            CustName: invoiceData.customerName || 'Unknown Customer',
            TotalwithGST: invoiceData.totalAmount || 0,
            DocDate: invoiceData.invoiceDate || new Date().toISOString(),
            Status: 'pending',
            // Add any other fields from your OINV table structure
            ...(ocrData && { ocr_data: ocrData }) // Store raw OCR data if provided
          };

          const { data: createdInvoice, error: createError } = await supabase
            .from('OINV')
            .insert(newInvoice)
            .select()
            .single();

          if (createError) {
            console.error('Error creating invoice:', createError);
            // Don't fail the whole operation if invoice creation fails
          } else {
            console.log('Created new invoice:', createdInvoice);
          }
        } else if (!checkError) {
          // Invoice exists, optionally update it with OCR data
          if (ocrData) {
            const { error: updateError } = await supabase
              .from('OINV')
              .update({ ocr_data: ocrData })
              .eq('DocNum', invoiceId);

            if (updateError) {
              console.error('Error updating invoice with OCR data:', updateError);
            }
          }
        }
      } catch (invoiceError) {
        console.error('Error handling invoice creation/update:', invoiceError);
        // Continue execution even if invoice handling fails
      }
    }

    return NextResponse.json({
      message: 'PDF linked to invoice successfully',
      pdfData: pdfData,
      invoiceId: invoiceId,
      success: true
    });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
