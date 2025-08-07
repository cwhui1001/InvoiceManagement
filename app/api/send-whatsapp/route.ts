import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json();

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 }
      );
    }

    // Check if Twilio credentials are configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_FROM) {
      console.error('Twilio credentials not configured');
      return NextResponse.json(
        { error: 'Twilio configuration missing' },
        { status: 500 }
      );
    }

    console.log(`Sending WhatsApp message to ${to}: "${message}"`);

    // Use Twilio REST API to send WhatsApp message
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
    
    const twilioPayload = new URLSearchParams({
      From: process.env.TWILIO_WHATSAPP_FROM, // e.g., 'whatsapp:+14155238886'
      To: to, // e.g., 'whatsapp:+1234567890'
      Body: message
    });

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: twilioPayload,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Twilio API error:', responseData);
      return NextResponse.json(
        { error: 'Failed to send WhatsApp message', details: responseData },
        { status: response.status }
      );
    }

    console.log('WhatsApp message sent successfully:', responseData.sid);
    
    return NextResponse.json({
      success: true,
      messageSid: responseData.sid,
      status: responseData.status,
      message: 'WhatsApp message sent successfully'
    });

  } catch (error) {
    console.error('Send WhatsApp message error:', error);
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message' },
      { status: 500 }
    );
  }
}
