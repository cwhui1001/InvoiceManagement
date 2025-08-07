import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    console.log('=== N8N-First Upload Route ===');
    
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    // Extract WhatsApp/Twilio metadata if available
    const whatsappFrom = formData.get('From') as string; // Twilio WhatsApp sender
    const whatsappTo = formData.get('To') as string; // Twilio WhatsApp recipient (our number)
    const messageBody = formData.get('Body') as string; // Message text
    const messageSid = formData.get('MessageSid') as string; // Twilio message ID

    console.log('WhatsApp metadata:', {
      from: whatsappFrom,
      to: whatsappTo,
      body: messageBody,
      messageSid: messageSid
    });

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
            // WhatsApp/Twilio metadata for progress updates
            whatsapp: whatsappFrom ? {
              from: whatsappFrom,
              to: whatsappTo,
              messageSid: messageSid,
              messageBody: messageBody
            } : null,
            // Let n8n handle the invoice detection and database linking
            processType: 'invoice_ocr',
            source: whatsappFrom ? 'whatsapp_upload' : 'nextjs_upload'
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
            
            // Try to extract execution ID from n8n response
            let executionId = null;
            try {
              const n8nResponseData = JSON.parse(responseText);
              executionId = n8nResponseData.executionId || n8nResponseData.id;
              console.log('Extracted execution ID from n8n response:', executionId);
            } catch (parseError) {
              console.log('Could not parse n8n response as JSON');
            }
            
            uploadResults.push({
              filename: file.name,
              success: true,
              message: 'File uploaded and sent to n8n for processing',
              publicUrl: publicUrl,
              storageFilename: filename,
              n8nStatus: 'sent',
              executionId: executionId
            });

            // If this is a WhatsApp upload, start progress monitoring
            if (whatsappFrom && executionId) {
              console.log(`Starting WhatsApp progress monitoring for execution ${executionId}`);
              
              // Send initial WhatsApp message
              try {
                await fetch(`${request.url.split('/api/')[0]}/api/send-whatsapp`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    to: whatsappFrom,
                    message: `🔍 Processing your invoice: ${file.name}\nStarting OCR analysis... This may take 1-2 minutes.`
                  }),
                });
                
                // Start background monitoring
                startWhatsAppProgressMonitoring(executionId, file.name, whatsappFrom, request.url);
                
              } catch (whatsappError) {
                console.error('Failed to send initial WhatsApp message:', whatsappError);
              }
            }
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

// Background function to monitor n8n execution and send WhatsApp progress updates
async function startWhatsAppProgressMonitoring(executionId: string, filename: string, whatsappNumber: string, baseUrl: string) {
  console.log(`Starting WhatsApp progress monitoring for execution ${executionId}`);
  
  const monitorExecution = async (): Promise<void> => {
    try {
      console.log(`Checking n8n execution ${executionId}...`);
      const response = await fetch(`${process.env.N8N_URL}/api/v1/executions/${executionId}`, {
        headers: {
          'X-N8N-API-KEY': process.env.N8N_API_KEY!,
          'Content-Type': 'application/json'
        }
      });

      const execution = await response.json();
      
      console.log(`n8n execution ${executionId} status:`, {
        finished: execution.finished,
        status: execution.status,
        success: execution.success,
        startedAt: execution.startedAt,
        stoppedAt: execution.stoppedAt
      });

      if (execution.finished) {
        const isSuccess = execution.success === true || execution.status === 'success';
        console.log(`n8n execution ${executionId} finished with success: ${isSuccess}`);
        
        // Send completion message to WhatsApp
        const completionMessage = isSuccess 
          ? `✅ Invoice processing completed!\n\n📄 File: ${filename}\n🎯 OCR analysis finished successfully.\n\nYour invoice data has been extracted and saved to the database.`
          : `❌ Invoice processing failed\n\n📄 File: ${filename}\n⚠️ OCR analysis encountered an error.\n\nPlease try uploading the file again or contact support.`;
          
        try {
          await fetch(`${baseUrl.split('/api/')[0]}/api/send-whatsapp`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: whatsappNumber,
              message: completionMessage
            }),
          });
          console.log('Sent completion message to WhatsApp');
        } catch (error) {
          console.error('Failed to send completion message to WhatsApp:', error);
        }
        
      } else {
        // Execution is still running - send progress update
        const elapsed = Date.now() - new Date(execution.startedAt).getTime();
        const elapsedSeconds = Math.floor(elapsed / 1000);
        
        // Send progress message every 30 seconds
        if (elapsedSeconds > 0 && elapsedSeconds % 30 === 0) {
          const progressMessage = `⏳ Still processing your invoice...\n\n📄 File: ${filename}\n🕒 Processing time: ${elapsedSeconds} seconds\n\nPlease wait, OCR analysis is in progress...`;
          
          try {
            await fetch(`${baseUrl.split('/api/')[0]}/api/send-whatsapp`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: whatsappNumber,
                message: progressMessage
              }),
            });
            console.log(`Sent progress update to WhatsApp (${elapsedSeconds}s)`);
          } catch (error) {
            console.error('Failed to send progress message to WhatsApp:', error);
          }
        }
        
        // Continue monitoring every 10 seconds
        setTimeout(monitorExecution, 10000);
      }
    } catch (error) {
      console.error(`Error monitoring n8n execution ${executionId}:`, error);
      
      // Send error message to WhatsApp
      try {
        await fetch(`${baseUrl.split('/api/')[0]}/api/send-whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: whatsappNumber,
            message: `⚠️ Error tracking invoice processing\n\n📄 File: ${filename}\n\nWe're having trouble monitoring the OCR process. The processing may still be running in the background.`
          }),
        });
      } catch (whatsappError) {
        console.error('Failed to send error message to WhatsApp:', whatsappError);
      }
    }
  };

  // Start monitoring after a short delay
  setTimeout(monitorExecution, 5000);
}
