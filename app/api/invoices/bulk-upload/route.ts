import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('file') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided.' },
        { status: 400 }
      );
    }

    console.log('Processing', files.length, 'files');

    // Create a Supabase client with admin privileges
    const supabase = await createAdminClient();

    const uploadResults = [];
    const n8nWebhook = process.env.N8N_WEBHOOK_URL;

    for (const file of files) {
      try {
        // Check if file is PDF or image
        const isPDF = file.type.includes('pdf');
        const isImage = file.type.includes('image');

        if (!isPDF && !isImage) {
          uploadResults.push({
            filename: file.name,
            success: false,
            error: 'Invalid file type. Please upload PDF or image files.'
          });
          continue;
        }

        // Get file content as buffer
        const fileBuffer = await file.arrayBuffer();

        // Create a unique filename with timestamp
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.name}`;

        // Upload to Supabase storage
        const { data: storageData, error: storageError } = await supabase
          .storage
          .from('invoices')
          .upload(`bulk-uploads/${filename}`, fileBuffer, {
            contentType: file.type,
            upsert: true,
          });

        if (storageError) {
          console.error('Storage Error:', storageError);
          uploadResults.push({
            filename: file.name,
            success: false,
            error: 'Failed to upload file.'
          });
          continue;
        }

        // Get a public URL for the uploaded file
        const { data: { publicUrl } } = supabase
          .storage
          .from('invoices')
          .getPublicUrl(`bulk-uploads/${filename}`);

        // Insert file reference into pdf table
        const { data: pdfRecord, error: dbError } = await supabase
          .from('pdf')
          .insert({
            pdf_url: publicUrl,
            pdf_filename: filename,
            InvoiceID: null // Will be updated later by n8n workflow when invoice is identified
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database Error:', dbError);
          uploadResults.push({
            filename: file.name,
            success: false,
            error: 'Failed to save file reference to database.'
          });
          continue;
        }

        // Create a local URL for viewing the PDF through our API
        const localPdfUrl = `/api/invoices/pdfs/${pdfRecord.id}`;

        // Trigger n8n webhook for processing
        if (n8nWebhook) {
          try {
            await fetch(n8nWebhook, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'bulk_upload',
                filename: filename,
                originalName: file.name,
                fileType: file.type,
                fileUrl: publicUrl,
                pdfRecordId: pdfRecord.id, // Pass the database record ID
                timestamp: new Date().toISOString(),
              }),
            });
          } catch (webhookError) {
            console.error('Webhook Error:', webhookError);
            // Continue execution even if webhook fails
          }
        }

        uploadResults.push({
          filename: file.name,
          success: true,
          url: localPdfUrl, // Use the local PDF URL for frontend
          storageFilename: filename,
          pdfRecordId: pdfRecord.id
        });

      } catch (fileError) {
        console.error('File processing error:', fileError);
        uploadResults.push({
          filename: file.name,
          success: false,
          error: 'Failed to process file.'
        });
      }
    }

    const successCount = uploadResults.filter(r => r.success).length;
    const failureCount = uploadResults.filter(r => !r.success).length;

    return NextResponse.json({
      message: `${successCount} file(s) uploaded successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results: uploadResults,
      totalFiles: files.length,
      successCount,
      failureCount
    });

  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
