import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    console.log('=== N8N-First Upload Route ===');
    
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
      return NextResponse.json(
        { error: 'Please upload only PDF or image files.' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const uploadResults = [];

    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name}`);
        
        // Upload to Supabase storage first
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
          uploadResults.push({
            filename: file.name,
            success: false,
            error: storageError.message,
          });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('invoices')
          .getPublicUrl(`uploads/${filename}`);

        console.log('File uploaded to storage:', publicUrl);

        // Send to n8n workflow - let n8n handle everything!
        const n8nWebhook = process.env.N8N_WEBHOOK_URL;
        if (n8nWebhook) {
          console.log('🚀 Sending to n8n workflow...');
          
          const webhookPayload = {
            filename: file.name,
            originalFilename: file.name,
            uploadedFilename: filename,
            fileUrl: publicUrl,
            fileType: file.type,
            fileSize: file.size,
            timestamp: new Date().toISOString(),
            // Include the actual file content for n8n OCR processing
            fileContent: Buffer.from(fileBuffer).toString('base64'),
            fileContentType: file.type,
            // Supabase storage info
            supabase: {
              bucketName: 'invoices',
              filePath: `uploads/${filename}`,
              publicUrl: publicUrl
            },
            // Let n8n handle the invoice detection and database linking
            processType: 'invoice_ocr',
            source: 'nextjs_upload'
          };
          
          console.log('Webhook payload prepared for n8n');
          
          const webhookResponse = await fetch(n8nWebhook, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload),
          });
          
          const responseText = await webhookResponse.text();
          console.log('n8n Response status:', webhookResponse.status);
          console.log('n8n Response:', responseText);
          
          if (webhookResponse.ok) {
            console.log('✅ Successfully sent to n8n workflow');
            uploadResults.push({
              filename: file.name,
              success: true,
              message: 'File uploaded and sent to n8n for processing',
              publicUrl: publicUrl,
              storageFilename: filename,
              n8nStatus: 'sent'
            });
          } else {
            console.log('❌ n8n webhook failed:', responseText);
            uploadResults.push({
              filename: file.name,
              success: false,
              error: `n8n processing failed: ${responseText}`,
              publicUrl: publicUrl,
              storageFilename: filename
            });
          }
        } else {
          console.log('❌ N8N_WEBHOOK_URL not configured');
          uploadResults.push({
            filename: file.name,
            success: false,
            error: 'N8N webhook URL not configured',
            publicUrl: publicUrl,
            storageFilename: filename
          });
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
      message: 'Files processed and sent to n8n workflow',
      results: uploadResults,
      totalFiles: files.length,
      successCount: uploadResults.filter(r => r.success).length,
      note: 'Invoice detection and database linking will be handled by n8n workflow'
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
