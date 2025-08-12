import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    console.log('=== Invoice Callback API Route Started ===');
    
    const body = await request.json();
    console.log('Received callback payload:', body);

    // Extract the necessary fields from the n8n callback
    const {
      invoiceId,
      docNum,
      customerName,
      totalAmount,
      invoiceDate,
      dueDate,
      status,
      pdfUrl,
      pdfFilename,
      extractedData,
      originalFilename,
      fileUrl
    } = body;

    console.log('Processing invoice data:', {
      invoiceId: invoiceId || docNum,
      customerName,
      totalAmount,
      pdfUrl: pdfUrl || fileUrl
    });

    const supabase = await createAdminClient();

    // Try to find the invoice by DocNum (invoice ID)
    const searchId = invoiceId || docNum;
    
    if (!searchId) {
      console.error('No invoice ID provided in callback');
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Check if invoice exists in OINV table
    const { data: existingInvoice, error: findError } = await supabase
      .from('OINV')
      .select('DocNum, CustName, TotalwithGST, DocDate, Status')
      .eq('DocNum', searchId)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error finding invoice:', findError);
      return NextResponse.json(
        { error: 'Database error while finding invoice' },
        { status: 500 }
      );
    }

    const finalPdfUrl = pdfUrl || fileUrl;

    if (existingInvoice) {
      // Update existing invoice with PDF URL and any extracted data
      console.log('Updating existing invoice:', searchId);
      
      const updateData: any = {
        pdf_url: finalPdfUrl,
        pdf_filename: pdfFilename || originalFilename
      };

      // If the callback includes a username/uploader, persist it for per-user category aggregation
      const callbackUsername = body.username || body.uploader_username || body.user;
      if (callbackUsername) {
        updateData.username = callbackUsername;
      }

      // Update other fields if they were extracted and are different
      if (customerName && customerName !== existingInvoice.CustName) {
        updateData.CustName = customerName;
      }
      if (totalAmount && totalAmount !== existingInvoice.TotalwithGST) {
        updateData.TotalwithGST = totalAmount;
      }
      if (invoiceDate && invoiceDate !== existingInvoice.DocDate) {
        updateData.DocDate = invoiceDate;
      }
      if (status && status !== existingInvoice.Status) {
        updateData.Status = status;
      }

      const { error: updateError } = await supabase
        .from('OINV')
        .update(updateData)
        .eq('DocNum', searchId);

      if (updateError) {
        console.error('Error updating invoice:', updateError);
        return NextResponse.json(
          { error: 'Failed to update invoice' },
          { status: 500 }
        );
      }

      console.log('Invoice updated successfully');
      return NextResponse.json({
        message: 'Invoice updated successfully',
        invoiceId: searchId,
        action: 'updated',
        pdfUrl: finalPdfUrl
      });

    } else {
      // Create new invoice record if it doesn't exist
      console.log('Creating new invoice:', searchId);
      
      const callbackUsernameNew = body.username || body.uploader_username || body.user;
      const { error: insertError } = await supabase
        .from('OINV')
        .insert({
          DocNum: searchId,
          CustName: customerName || 'Unknown Customer',
          TotalwithGST: totalAmount || 0,
          DocDate: invoiceDate || new Date().toISOString().split('T')[0],
          Status: status || 'pending',
          pdf_url: finalPdfUrl,
          pdf_filename: pdfFilename || originalFilename,
          username: callbackUsernameNew || null
        });

      if (insertError) {
        console.error('Error creating invoice:', insertError);
        return NextResponse.json(
          { error: 'Failed to create invoice' },
          { status: 500 }
        );
      }

      console.log('Invoice created successfully');
      return NextResponse.json({
        message: 'Invoice created successfully',
        invoiceId: searchId,
        action: 'created',
        pdfUrl: finalPdfUrl
      });
    }

  } catch (error) {
    console.error('Callback API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
