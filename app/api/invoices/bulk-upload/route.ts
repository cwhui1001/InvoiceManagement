import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  console.log('=== BULK UPLOAD API CALLED ==='); // Debug log
  try {
    const formData = await request.formData();
    const files = formData.getAll('file') as File[];

    console.log(`Received ${files.length} files for upload`); // Debug log

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided.' },
        { status: 400 }
      );
    }

    // Get current user and their profile information
    const userClient = await createClient();
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    // Get user's profile information for username
    const supabase = await createAdminClient();
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', user.id)
      .single();

    const uploaderUsername = userProfile?.username || user.email?.split('@')[0] || 'unknown_user';
    
    console.log(`Upload initiated by user: ${user.id} (${uploaderUsername})`);

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
        if (storageError) {
          console.error('Storage upload failed:', {
            message: storageError.message,
            name: storageError.name,
            status: (storageError as any)?.status,
            file: filename,
            size: file.size,
            type: file.type,
          });
        } else {
          console.log('Storage upload success:', storageData?.path || filename);
        }

        if (storageError) {
          throw new Error(`Storage error: ${storageError.message}`);
        }

        // 4. Get public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('invoices')
          .getPublicUrl(`bulk-uploads/${filename}`);

        // 5. Create PDF record with actual uploader information
        const { data: pdfRecord, error: dbError } = await supabase
          .from('pdf')
          .insert({
            pdf_url: publicUrl,
            pdf_filename: filename, // Keep original timestamp-filename format
            uploader_user_id: user.id, // Store actual uploader's user ID
            uploader_username: uploaderUsername, // Store username for display
            created_by: user.id // Audit trail
          })
          .select('id, created_at, pdf_uuid')
          .single();

        if (dbError) {
          console.error('Failed inserting pdf record:', dbError.message, dbError);
          throw new Error(`Database error: ${dbError.message}`);
        }

        // 6. Trigger processing workflow (n8n will handle OCR and linking)
        let executionId = null;
        if (n8nWebhook) {
          console.log(`Calling n8n webhook: ${n8nWebhook}`); // Debug log
          try {
            const n8nResponse = await fetch(n8nWebhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'invoice_upload',
                action: 'process',
                pdf: {
                  id: pdfRecord.id,
                  uuid: pdfRecord.pdf_uuid,
                  url: publicUrl,
                  originalName: file.name,
                  storedName: filename
                },
                timestamp: new Date().toISOString()
              })
            });
            
            console.log(`n8n response status: ${n8nResponse.status}`); // Debug log
            
            if (n8nResponse.ok) {
              const n8nResult = await n8nResponse.json();
              console.log('n8n response body:', n8nResult); // Debug log
              executionId = n8nResult.executionId || null;
              
              // If no executionId in webhook response, try to get latest execution from n8n API
              if (!executionId && process.env.N8N_URL && process.env.N8N_API_KEY) {
                console.log('No executionId from webhook, trying to get latest execution from n8n API'); // Debug log
                try {
                  const executionsResponse = await fetch(`${process.env.N8N_URL}/api/v1/executions?limit=1`, {
                    headers: {
                      'X-N8N-API-KEY': process.env.N8N_API_KEY,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (executionsResponse.ok) {
                    const executionsData = await executionsResponse.json();
                    if (executionsData.data && executionsData.data.length > 0) {
                      executionId = executionsData.data[0].id;
                      console.log(`Got execution ID from n8n API: ${executionId}`); // Debug log
                    }
                  } else {
                    console.error('Failed to get executions from n8n API:', executionsResponse.status);
                  }
                } catch (apiError) {
                  console.error('Error calling n8n API for executions:', apiError);
                }
              }
              
              console.log(`n8n workflow triggered for ${file.name}, execution ID: ${executionId}`);
            } else {
              const errorText = await n8nResponse.text();
              console.error(`n8n webhook failed with status ${n8nResponse.status}:`, errorText);
            }
          } catch (error) {
            console.error('Webhook failed:', error);
          }
        } else {
          console.log('No n8n webhook URL configured'); // Debug log
        }

        // 6. Prepare success response
        uploadResults.push({
          filename: file.name,
          success: true,
          url: `/api/invoices/pdfs/${pdfRecord.id}`,
          storageFilename: filename,
          pdfId: pdfRecord.id,
          pdfUuid: pdfRecord.pdf_uuid,
          executionId: executionId, // Include execution ID for progress tracking
          invoiceNumber: null, // Not linked yet
          invoiceStatus: null
        });

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