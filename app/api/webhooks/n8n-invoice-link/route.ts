import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pdfUuid, pdfId, docNum, invoiceData, ocrData, filename, originalName } = body;

    console.log('=== N8N WEBHOOK RECEIVED ===');
    console.log('Full request body:', JSON.stringify(body, null, 2));
    console.log('Extracted fields:', { pdfUuid, pdfId, docNum, invoiceData, ocrData, filename, originalName });
    console.log('==========================');

    if (!pdfUuid && !pdfId) {
      return NextResponse.json(
        { error: 'PDF UUID or ID is required.' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    console.log('Linking PDF to invoice:', { pdfUuid, pdfId, docNum, invoiceData });

    // First, create or find the invoice if docNum is provided
    let invoiceUuid = null;
    if (docNum) {
      // Check if invoice exists
      const { data: existingInvoice, error: checkError } = await supabase
        .from('OINV')
        .select('uuid, DocNum')
        .eq('DocNum', docNum)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // Invoice doesn't exist, create it
        const newInvoice = {
          DocNum: docNum,
          CustName: invoiceData?.customerName || 'Unknown Customer',
          TotalwithGST: invoiceData?.totalAmount || 0,
          DocDate: invoiceData?.invoiceDate || new Date().toISOString(),
          Status: 'Pending',
          // Add any other fields from invoiceData
          ...(invoiceData && {
            CustAddress: invoiceData.customerAddress,
            VendorName: invoiceData.vendorName,
            VendorAddresss: invoiceData.vendorAddress,
            Totalb4GST: invoiceData.totalBeforeGST,
            DueDate: invoiceData.dueDate,
            DeliveryDate: invoiceData.deliveryDate
          })
        };

        const { data: createdInvoice, error: createError } = await supabase
          .from('OINV')
          .insert(newInvoice)
          .select('uuid')
          .single();

        if (createError) {
          console.error('Error creating invoice:', createError);
          return NextResponse.json(
            { error: 'Failed to create invoice.' },
            { status: 500 }
          );
        } else {
          console.log('Created new invoice:', createdInvoice);
          invoiceUuid = createdInvoice.uuid;
        }
      } else if (!checkError) {
        // Invoice exists, use its UUID
        invoiceUuid = existingInvoice.uuid;
        console.log('Found existing invoice:', existingInvoice);
      } else {
        console.error('Error checking invoice:', checkError);
        return NextResponse.json(
          { error: 'Error checking invoice.' },
          { status: 500 }
        );
      }
    }

    // Update the PDF record with the invoice UUID
    const updateCondition = pdfUuid ? { pdf_uuid: pdfUuid } : { id: pdfId };
    const { data: pdfData, error: pdfError } = await supabase
      .from('pdf')
      .update({ 
        oinv_uuid: invoiceUuid 
      })
      .match(updateCondition)
      .select()
      .single();

    if (pdfError) {
      console.error('Database Error updating PDF:', pdfError);
      return NextResponse.json(
        { error: 'Failed to update PDF record.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'PDF linked to invoice successfully',
      pdfData: pdfData,
      invoiceUuid: invoiceUuid,
      docNum: docNum,
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
