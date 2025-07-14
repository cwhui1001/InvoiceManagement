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

    // First, try to find if there's a PDF file stored for this invoice in Supabase storage
    const { data: files, error: listError } = await supabase
      .storage
      .from('invoices')
      .list('uploads', {
        search: invoiceId
      });

    if (listError) {
      console.error('Error listing files:', listError);
    }

    console.log('Found files:', files?.map(f => f.name));

    // Look for a PDF file that contains the invoice ID in its name
    const pdfFile = files?.find(file => 
      file.name.includes(invoiceId) && file.name.toLowerCase().includes('.pdf')
    );

    if (pdfFile) {
      console.log('Found PDF file:', pdfFile.name);
      // If we found a PDF file, get its public URL and redirect
      const { data: { publicUrl } } = supabase
        .storage
        .from('invoices')
        .getPublicUrl(`uploads/${pdfFile.name}`);

      return NextResponse.redirect(publicUrl);
    }

    // If no specific PDF found, check if the invoice exists in the database
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (
          name,
          email
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice not found:', invoiceError);
      return NextResponse.json(
        { error: 'Invoice not found.' },
        { status: 404 }
      );
    }

    // If invoice exists but no PDF found, return a helpful message
    return NextResponse.json({
      error: 'No PDF available for this invoice',
      message: 'This invoice does not have an associated PDF file. You can upload one using the bulk upload feature.',
      invoice: {
        id: invoice.id,
        customer: invoice.customers?.name || 'Unknown',
        amount: invoice.amount,
        date: invoice.date,
        status: invoice.status
      }
    }, { status: 404 });

  } catch (error) {
    console.error('PDF API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while retrieving PDF.' },
      { status: 500 }
    );
  }
}
