import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('=== Test webhook call ===');
    
    const testPayload = {
      filename: "test-file.pdf",
      originalFilename: "test-file.pdf",
      uploadedFilename: "1234567890-test-file.pdf",
      fileUrl: "https://example.com/test-file.pdf",
      fileType: "application/pdf",
      fileSize: 12345,
      timestamp: new Date().toISOString(),
      fileContent: "dGVzdCBmaWxlIGNvbnRlbnQ=", // base64 for "test file content"
      fileContentType: "application/pdf",
      supabase: {
        bucketName: "invoices",
        filePath: "uploads/1234567890-test-file.pdf",
        publicUrl: "https://example.com/test-file.pdf"
      }
    };

    const n8nWebhook = process.env.N8N_WEBHOOK_URL;
    
    if (!n8nWebhook) {
      return NextResponse.json({ error: 'N8N_WEBHOOK_URL not configured' }, { status: 500 });
    }

    console.log('Sending test webhook to:', n8nWebhook);
    console.log('Payload:', JSON.stringify(testPayload, null, 2));

    const response = await fetch(n8nWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();
    console.log('Webhook response status:', response.status);
    console.log('Webhook response body:', responseText);

    return NextResponse.json({
      success: true,
      webhookStatus: response.status,
      webhookResponse: responseText,
      payload: testPayload
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}
