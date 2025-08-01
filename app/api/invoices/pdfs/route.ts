import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');
    
    // Get current user for context
    const userClient = await createClient();
    const { data: { user } } = await userClient.auth.getUser();
    
    const supabase = await createAdminClient();
    
    let query = supabase
      .from('pdf')
      .select('*')
      .order('created_at', { ascending: false });

    // If invoiceId is provided, filter by it
    if (invoiceId) {
      query = query.eq('oinv_uuid', invoiceId);
    }

    const { data: pdfs, error } = await query;

    if (error) {
      console.error('Database Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch PDF files.' },
        { status: 500 }
      );
    }

    // Transform the data to include user information
    const transformedPdfs = (pdfs || []).map(pdf => ({
      ...pdf,
      invoice_docnum: pdf.oinv_uuid || null, // Show the linked invoice UUID or null
      uploader_display: user?.email ? 
        user.email.split('@')[0] : // Show username part of email
        'Current User' // Show current user since we don't store uploader info yet
    }));

    return NextResponse.json({
      pdfs: transformedPdfs,
      total: transformedPdfs.length
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
