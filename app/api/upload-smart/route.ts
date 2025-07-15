import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    console.log('=== Smart Upload API Route Started ===');
    
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const manualInvoiceId = formData.get('invoiceId') as string; // Allow manual invoice ID input

    console.log('Files received:', files.length);
    console.log('Manual invoice ID:', manualInvoiceId);

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one file.' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const uploadResults = [];

    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name}`);
        
        // Upload file to storage
        const fileBuffer = await file.arrayBuffer();
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.name}`;

        const { data: storageData, error: storageError } = await supabase
          .storage
          .from('invoices')
          .upload(`uploads/${filename}`, fileBuffer, {
            contentType: file.type,
            upsert: true,
          });

        if (storageError) {
          console.error('Storage error:', storageError);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('invoices')
          .getPublicUrl(`uploads/${filename}`);

        console.log('File uploaded successfully:', publicUrl);

        // Smart invoice ID detection with multiple strategies
        let invoiceId = null;

        // Strategy 1: Manual invoice ID (highest priority)
        if (manualInvoiceId) {
          invoiceId = manualInvoiceId;
          console.log('Using manual invoice ID:', invoiceId);
        } else {
          // Strategy 2: Filename patterns
          const patterns = [
            /^(\d{6})$/,                    // Exact 6-digit match
            /^(\d{6})\./,                   // 6-digit with extension
            /(\d{6})/,                      // Any 6-digit number
            /(\d{5,7})/,                    // 5-7 digit numbers
          ];

          for (const pattern of patterns) {
            const match = file.name.match(pattern);
            if (match) {
              invoiceId = match[1];
              console.log('Found invoice ID from filename:', invoiceId);
              break;
            }
          }

          // Strategy 3: Show available invoices for user selection
          if (!invoiceId) {
            const { data: recentInvoices } = await supabase
              .from('OINV')
              .select('DocNum, CustName, DocDate')
              .order('DocDate', { ascending: false })
              .limit(10);

            console.log('No invoice ID found. Recent invoices:', recentInvoices);
            
            uploadResults.push({
              filename: file.name,
              success: true,
              publicUrl: publicUrl,
              storageFilename: filename,
              invoiceId: null,
              message: 'File uploaded successfully. Please select invoice manually.',
              recentInvoices: recentInvoices
            });
            continue;
          }
        }

        // Update database if invoice ID is found
        if (invoiceId) {
          console.log(`Attempting to link file to invoice: ${invoiceId}`);
          
          const { data: updateData, error: updateError } = await supabase
            .from('OINV')
            .update({
              pdf_url: publicUrl,
              pdf_filename: filename
            })
            .eq('DocNum', invoiceId)
            .select();

          if (updateError) {
            console.error('Database update error:', updateError);
            uploadResults.push({
              filename: file.name,
              success: false,
              error: `Failed to link to invoice ${invoiceId}: ${updateError.message}`,
              publicUrl: publicUrl,
              storageFilename: filename,
              invoiceId: invoiceId
            });
          } else if (updateData && updateData.length > 0) {
            console.log('Successfully linked to invoice:', invoiceId);
            uploadResults.push({
              filename: file.name,
              success: true,
              publicUrl: publicUrl,
              storageFilename: filename,
              invoiceId: invoiceId,
              message: `Successfully linked to invoice ${invoiceId}`,
              invoiceData: updateData[0]
            });
          } else {
            console.log('Invoice not found:', invoiceId);
            uploadResults.push({
              filename: file.name,
              success: false,
              error: `Invoice ${invoiceId} not found in database`,
              publicUrl: publicUrl,
              storageFilename: filename,
              invoiceId: invoiceId
            });
          }
        }

      } catch (error) {
        console.error('File processing error:', error);
        uploadResults.push({
          filename: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: 'Upload processing completed',
      results: uploadResults
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
