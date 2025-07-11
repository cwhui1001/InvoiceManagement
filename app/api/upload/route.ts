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
