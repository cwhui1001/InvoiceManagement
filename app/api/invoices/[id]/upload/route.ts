import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || !file.type.includes('pdf')) {
      return NextResponse.json(
        { error: 'Please upload a valid PDF file.' },
        { status: 400 }
      );
    }

    // Get file content as buffer
    const fileBuffer = await file.arrayBuffer();

    // Get invoice ID from URL params
    const invoiceId = params.id;

    // Create a Supabase client for the authenticated user
    const supabase = createClient();

    // Get the authenticated user's ID
    const { data: { user }, error: userError } = await (await supabase).auth.getUser();
    if (userError || !user) {
      console.error('User Error:', userError);
      return NextResponse.json(
        { error: 'User not authenticated.' },
        { status: 401 }
      );
    }
    const userId = user.id;

    // Create a Supabase client with admin privileges for storage operations
    const supabaseAdmin = await createAdminClient();

    // Upload to Supabase storage
    const { data: storageData, error: storageError } = await supabaseAdmin
      .storage
      .from('invoices')
      .upload(`${invoiceId}/${file.name}`, fileBuffer, {
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
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('invoices')
      .getPublicUrl(`${invoiceId}/${file.name}`);

    // Update invoice record with file URL, filename, and user ID
    const { data: updateData, error: updateError } = await (await supabase)
      .from('OINV')
      .update({
        pdf_url: publicUrl,
        pdf_filename: file.name,
        uuid: userId, // Add the authenticated user's ID
      })
      .eq('DocNum', invoiceId);

    if (updateError) {
      console.error('Update Error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update invoice record.' },
        { status: 500 }
      );
    }

    // Trigger n8n webhook
    const n8nWebhook = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhook) {
      try {
        await fetch(n8nWebhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invoiceId,
            pdfUrl: publicUrl,
            filename: file.name,
            timestamp: new Date().toISOString(),
            userId, // Optionally include userId in webhook payload
          }),
        });
      } catch (webhookError) {
        console.error('Webhook Error:', webhookError);
        // Continue execution even if webhook fails
      }
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
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