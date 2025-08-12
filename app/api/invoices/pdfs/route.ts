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
    // Linking by legacy oinv_uuid removed. If invoiceId filtering needed, adjust schema (e.g., store docnum on pdf row)
    if (invoiceId) {
      console.warn('invoiceId filter ignored: legacy oinv_uuid removed');
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
      invoice_docnum: null,
      uploader_display: pdf.uploader_username || (user?.email ? user.email.split('@')[0] : 'Unknown')
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
