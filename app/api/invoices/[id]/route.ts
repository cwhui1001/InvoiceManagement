import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docNum = params.id;
    const supabase = createAdminClient();

    // Fetch invoice header
    const { data: header, error: headerError } = await supabase
      .from('OINV')
      .select('*')
      .eq('DocNum', docNum)
      .single();

    if (headerError) {
      console.error('Error fetching invoice header:', headerError);
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Fetch line items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('INV1')
      .select('*')
      .eq('DocNum', docNum)
      .order('No', { ascending: true });

    if (lineItemsError) {
      console.error('Error fetching line items:', lineItemsError);
      return NextResponse.json(
        { error: 'Failed to fetch line items' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      header,
      lineItems: lineItems || []
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docNum = params.id;
    const body = await request.json();
    const { header, lineItems } = body;
    
    const supabase = createAdminClient();

    // Update invoice header
    const { error: headerError } = await supabase
      .from('OINV')
      .update({
        DocDate: header.DocDate,
        DueDate: header.DueDate,
        CustName: header.CustName,
        CustAddress: header.CustAddress,
        VendorName: header.VendorName,
        CustCode: header.CustCode,
        VendorCode: header.VendorCode,
        VendorAddresss: header.VendorAddresss,
        Totalb4GST: header.Totalb4GST,
        TotalwithGST: header.TotalwithGST,
      })
      .eq('DocNum', docNum);

    if (headerError) {
      console.error('Error updating invoice header:', headerError);
      return NextResponse.json(
        { error: 'Failed to update invoice header' },
        { status: 500 }
      );
    }

    // Delete existing line items
    const { error: deleteError } = await supabase
      .from('INV1')
      .delete()
      .eq('DocNum', docNum);

    if (deleteError) {
      console.error('Error deleting existing line items:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete existing line items' },
        { status: 500 }
      );
    }

    // Insert new line items
    if (lineItems && lineItems.length > 0) {
      const { error: insertError } = await supabase
        .from('INV1')
        .insert(lineItems);

      if (insertError) {
        console.error('Error inserting line items:', insertError);
        return NextResponse.json(
          { error: 'Failed to insert line items' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ message: 'Invoice updated successfully' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docNum = params.id;
    const supabase = createAdminClient();

    // First, get the invoice UUID to find linked PDFs
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('OINV')
      .select('uuid')
      .eq('DocNum', docNum)
      .single();

    if (invoiceError) {
      console.error('Error finding invoice:', invoiceError);
      return NextResponse.json(
        { error: 'Failed to find invoice' },
        { status: 500 }
      );
    }

    // Get all PDFs linked to this invoice
    const { data: linkedPdfs, error: pdfError } = await supabase
      .from('pdf')
      .select('pdf_uuid, pdf_filename')
        .eq('oinv_uuid', invoiceData.uuid); // Legacy oinv_uuid reference removed; no direct PDF linking now.

    if (pdfError) {
      console.error('Error finding linked PDFs:', pdfError);
      return NextResponse.json(
        { error: 'Failed to find linked PDFs' },
        { status: 500 }
      );
    }

    // Delete PDF files from storage
    if (linkedPdfs && linkedPdfs.length > 0) {
      const filesToDelete = linkedPdfs.map(pdf => `bulk-uploads/${pdf.pdf_filename}`);
      
      const { error: storageError } = await supabase
        .storage
        .from('invoices')
        .remove(filesToDelete);

      if (storageError) {
        console.warn('Warning: Failed to delete some PDF files from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Update PDF records to unlink them (set oinv_uuid to null)
    // This prevents foreign key constraint violations
      const { error: unlinkPdfError } = await supabase
        .from('pdf')
        .update({ oinv_uuid: null }) // Legacy unlink skipped (oinv_uuid removed)
        .eq('oinv_uuid', invoiceData.uuid);

    if (unlinkPdfError) {
      console.error('Error unlinking PDFs:', unlinkPdfError);
      return NextResponse.json(
        { error: 'Failed to unlink PDF files' },
        { status: 500 }
      );
    }

    // Delete line items first (due to foreign key constraint)
    const { error: deleteLineItemsError } = await supabase
      .from('INV1')
      .delete()
      .eq('DocNum', docNum);

    if (deleteLineItemsError) {
      console.error('Error deleting line items:', deleteLineItemsError);
      return NextResponse.json(
        { error: 'Failed to delete line items' },
        { status: 500 }
      );
    }

    // Delete invoice header
    const { error: deleteHeaderError } = await supabase
      .from('OINV')
      .delete()
      .eq('DocNum', docNum);

    if (deleteHeaderError) {
      console.error('Error deleting invoice header:', deleteHeaderError);
      return NextResponse.json(
        { error: 'Failed to delete invoice header' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
