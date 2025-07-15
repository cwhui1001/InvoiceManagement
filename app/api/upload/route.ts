import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    console.log('=== Upload API Route Started ===');
    
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    console.log('Files received:', files.length);
    files.forEach((file, index) => {
      console.log(`File ${index + 1}:`, {
        name: file.name,
        type: file.type,
        size: file.size
      });
    });

    if (!files || files.length === 0) {
      console.log('No files provided');
      return NextResponse.json(
        { error: 'Please select at least one file.' },
        { status: 400 }
      );
    }

    // Validate file types
    const invalidFiles = files.filter(file => 
      !file.type.includes('pdf') && !file.type.includes('image')
    );

    if (invalidFiles.length > 0) {
      console.log('Invalid file types:', invalidFiles.map(f => f.type));
      return NextResponse.json(
        { error: 'Please upload only PDF or image files.' },
        { status: 400 }
      );
    }

    // Check environment variables
    console.log('Environment check:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
    console.log('N8N_WEBHOOK_URL:', process.env.N8N_WEBHOOK_URL ? 'Set' : 'Missing');

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Supabase client created successfully');

    const uploadResults = [];

    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name}`);
        
        // Get file content as buffer
        const fileBuffer = await file.arrayBuffer();
        console.log(`File buffer created, size: ${fileBuffer.byteLength} bytes`);
        
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.name}`;
        console.log(`Generated filename: ${filename}`);

        // Upload to Supabase storage
        console.log('Attempting to upload to Supabase storage...');
        const { data: storageData, error: storageError } = await supabase
          .storage
          .from('invoices')
          .upload(`uploads/${filename}`, fileBuffer, {
            contentType: file.type,
            upsert: true,
          });

        if (storageError) {
          console.error('Storage Error Details:', {
            message: storageError.message,
            details: storageError,
            filename: file.name
          });
          uploadResults.push({
            filename: file.name,
            success: false,
            error: storageError.message,
          });
          continue;
        }

        console.log('Upload successful:', storageData);

        // Get a public URL for the uploaded file
        const { data: { publicUrl } } = supabase
          .storage
          .from('invoices')
          .getPublicUrl(`uploads/${filename}`);

        console.log('Public URL generated:', publicUrl);

        // Try to extract invoice ID from filename and update OINV table
        // Try multiple patterns to match different invoice ID formats
        const invoiceIdPatterns = [
          /^(\d+)$/,                      // Exact number match: 587878
          /^(\d+)\./,                     // Number with extension: 587878.pdf
          /(\d+)/,                        // Any numbers: 587878, 123456
          /(\w+\d+)/i,                    // SO1000009, INV123, etc.
          /invoice[_-]?(\w+\d+)/i,        // invoice_SO1000009, invoice-123
          /(\w+\d+)[\._-]/i,              // SO1000009.pdf, INV123_file
        ];
        
        let invoiceId = null;
        
        console.log('=== INVOICE ID EXTRACTION DEBUG ===');
        console.log('Original filename:', file.name);
        console.log('File type:', file.type);
        console.log('File size:', file.size);
        
        for (let i = 0; i < invoiceIdPatterns.length; i++) {
          const pattern = invoiceIdPatterns[i];
          const match = file.name.match(pattern);
          console.log(`Pattern ${i + 1} (${pattern}):`, match ? `MATCH: "${match[1]}"` : 'NO MATCH');
          if (match) {
            invoiceId = match[1];
            console.log(`✅ Selected invoice ID "${invoiceId}" using pattern ${i + 1}: ${pattern}`);
            break;
          }
        }
        
        if (!invoiceId) {
          console.log('❌ No invoice ID found in filename:', file.name);
        }
        
        if (invoiceId) {
          console.log('=== DATABASE UPDATE DEBUG ===');
          console.log('Extracted invoice ID:', invoiceId);
          console.log('Public URL:', publicUrl);
          console.log('Filename:', filename);
          
          try {
            // First, check if the invoice exists in the database
            console.log('Checking if invoice exists in database...');
            const { data: existingInvoice, error: findError } = await supabase
              .from('OINV')
              .select('DocNum, CustName')
              .eq('DocNum', invoiceId)
              .single();
            
            if (findError) {
              console.log('❌ Error finding invoice:', findError.message);
              console.log('Full error:', findError);
            }
            
            if (existingInvoice) {
              console.log('✅ Invoice found in database:', existingInvoice);
              console.log('Updating invoice with PDF URL...');
              
              // Update the OINV table with the PDF URL
              const { data: updateData, error: updateError } = await supabase
                .from('OINV')
                .update({
                  pdf_url: publicUrl,
                  pdf_filename: filename
                })
                .eq('DocNum', invoiceId)
                .select();

              if (updateError) {
                console.error('❌ Error updating OINV table:', updateError.message);
                console.error('Full update error:', updateError);
              } else {
                console.log('✅ Successfully updated OINV table for invoice:', invoiceId);
                console.log('Updated data:', updateData);
              }
            } else {
              console.log('❌ Invoice not found in database for ID:', invoiceId);
              console.log('Available invoices in database (sample):');
              
              // Show sample of existing invoices for debugging
              const { data: sampleInvoices } = await supabase
                .from('OINV')
                .select('DocNum, CustName')
                .limit(5);
              
              console.log('Sample invoices:', sampleInvoices);
            }
          } catch (dbError) {
            console.error('❌ Database update error:', dbError);
          }
        } else {
          console.log('❌ Could not extract invoice ID from filename:', file.name);
          console.log('Filename will be processed by n8n webhook for OCR extraction');
        }

        // Trigger n8n webhook with file content
        const n8nWebhook = process.env.N8N_WEBHOOK_URL;
        if (n8nWebhook) {
          try {
            console.log('Triggering n8n webhook...');
            
            // Convert file buffer to base64 for n8n
            const base64Content = Buffer.from(fileBuffer).toString('base64');
            
            const webhookPayload = {
              filename: file.name,
              originalFilename: file.name,
              uploadedFilename: filename,
              fileUrl: publicUrl,
              fileType: file.type,
              fileSize: file.size,
              timestamp: new Date().toISOString(),
              // Include the actual file content for n8n processing
              fileContent: base64Content,
              fileContentType: file.type,
              // Include extracted invoice ID if available
              extractedInvoiceId: invoiceId,
              // Include callback URL for n8n to update database
              callbackUrl: `${request.url.split('/api/')[0]}/api/invoices/callback`,
              // Additional metadata for n8n workflow
              supabase: {
                bucketName: 'invoices',
                filePath: `uploads/${filename}`,
                publicUrl: publicUrl
              }
            };
            
            console.log('Webhook payload prepared, size:', JSON.stringify(webhookPayload).length);
            
            const webhookResponse = await fetch(n8nWebhook, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(webhookPayload),
            });
            
            const responseText = await webhookResponse.text();
            console.log('Webhook response status:', webhookResponse.status);
            console.log('Webhook response body:', responseText);
            
            if (!webhookResponse.ok) {
              console.error('Webhook failed:', {
                status: webhookResponse.status,
                statusText: webhookResponse.statusText,
                body: responseText
              });
            }
          } catch (webhookError) {
            console.error('Webhook Error:', webhookError);
            // Continue execution even if webhook fails
          }
        } else {
          console.log('No n8n webhook URL configured');
        }

        uploadResults.push({
          filename: file.name,
          success: true,
          url: publicUrl,
          invoiceId: invoiceId,
          databaseUpdated: invoiceId ? true : false,
          message: invoiceId ? `Linked to invoice ${invoiceId}` : 'No invoice ID found in filename',
        });

        console.log(`File ${file.name} processed successfully`);
      } catch (fileError) {
        console.error('File processing error:', {
          filename: file.name,
          error: fileError
        });
        uploadResults.push({
          filename: file.name,
          success: false,
          error: 'Failed to process file',
        });
      }
    }

    const successCount = uploadResults.filter(result => result.success).length;
    const failureCount = uploadResults.filter(result => !result.success).length;

    console.log('Upload summary:', {
      totalFiles: files.length,
      successCount,
      failureCount,
      results: uploadResults
    });

    console.log('=== Upload API Route Completed ===');

    return NextResponse.json({
      message: `Upload completed. ${successCount} files uploaded successfully${failureCount > 0 ? `, ${failureCount} files failed` : ''}.`,
      results: uploadResults,
      totalFiles: files.length,
      successCount,
      failureCount,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
