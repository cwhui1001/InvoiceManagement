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

    const supabase = await createAdminClient();
    const uploadResults = [];
    const n8nWebhook = process.env.N8N_WEBHOOK_URL;

    for (const file of files) {
      try {
        // 1. Validate file type
        const isPDF = file.type.includes('pdf');
        const isImage = file.type.includes('image');

        if (!isPDF && !isImage) {
          uploadResults.push({
            filename: file.name,
            success: false,
            error: 'Invalid file type. Only PDF and image files are allowed.'
          });
          continue;
        }

        // 2. Upload file first, then link to invoice later if needed

        // 3. Upload file to storage
        const fileBuffer = await file.arrayBuffer();
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.name.replace(/\s+/g, '_')}`; // Replace spaces with underscores

        const {  data: storageData, error: storageError } = await supabase
          .storage
          .from('invoices')
          .upload(`bulk-uploads/${filename}`, fileBuffer, {
            contentType: file.type,
            upsert: false, // Don't overwrite existing files
            cacheControl: '3600'
          });
console.error('Storage Error:', storageData);

        if (storageError) {
          throw new Error(`Storage error: ${storageError.message}`);
        }

        // 4. Get public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('invoices')
          .getPublicUrl(`bulk-uploads/${filename}`);

        // 5. Create PDF record (not linked to any invoice initially)
        const { data: pdfRecord, error: dbError } = await supabase
          .from('pdf')
          .insert({
            pdf_url: publicUrl,
            pdf_filename: filename,
            oinv_uuid: null // No invoice link initially
          })
          .select('pdf_uuid, id, created_at')
          .single();

        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`);
        }

        // 6. Prepare success response
        uploadResults.push({
          filename: file.name,
          success: true,
          url: `/api/invoices/pdfs/${pdfRecord.pdf_uuid}`,
          storageFilename: filename,
          pdfUuid: pdfRecord.pdf_uuid,
          invoiceNumber: null, // No invoice linked initially
          invoiceStatus: null
        });

        // 7. Trigger processing workflow (n8n will handle OCR and linking)
        if (n8nWebhook) {
          await fetch(n8nWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'invoice_upload',
              action: 'process',
              pdf: {
                uuid: pdfRecord.pdf_uuid,
                url: publicUrl,
                originalName: file.name,
                storedName: filename
              },
              timestamp: new Date().toISOString()
            })
          }).catch(error => {
            console.error('Webhook failed:', error);
          });
        }

      } catch (error) {
        console.error(`File processing failed: ${file.name}`, error);
        uploadResults.push({
          filename: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Processing failed'
        });
      }
    }

    // Return comprehensive results
    const successCount = uploadResults.filter(r => r.success).length;
    return NextResponse.json({
      message: `Processed ${files.length} files (${successCount} successful)`,
      detailedResults: uploadResults,
      successfulUploads: uploadResults.filter(r => r.success),
      failedUploads: uploadResults.filter(r => !r.success)
    });

  } catch (error) {
    console.error('Upload endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}