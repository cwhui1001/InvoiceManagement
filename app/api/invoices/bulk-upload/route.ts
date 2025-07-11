import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided.' },
        { status: 400 }
      );
    }

    // Check if file is PDF or image
    const isPDF = file.type.includes('pdf');
    const isImage = file.type.includes('image');

    if (!isPDF && !isImage) {
      return NextResponse.json(
        { error: 'Please upload a PDF or image file.' },
        { status: 400 }
      );
    }

    // Get file content as buffer
    const fileBuffer = await file.arrayBuffer();

    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;

    // Create a Supabase client with admin privileges
    const supabase = await createAdminClient();

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
      return NextResponse.json(
        { error: 'Failed to upload file.' },
        { status: 500 }
      );
    }

    // Get a public URL for the uploaded file
    const { data: { publicUrl } } = supabase
      .storage
      .from('invoices')
      .getPublicUrl(`bulk-uploads/${filename}`);

    // Create a record in a uploads table or log (optional)
    // You can extend this to create records in your database

    // Trigger n8n webhook for bulk processing
    const n8nWebhook = process.env.N8N_WEBHOOK_URL;
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
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (webhookError) {
        console.error('Webhook Error:', webhookError);
        // Continue execution even if webhook fails
      }
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      filename: filename,
      url: publicUrl,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
