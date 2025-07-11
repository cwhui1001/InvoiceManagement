import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('=== Testing Supabase Connection ===');
    
    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Supabase client created');

    // Test storage connection - list buckets
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return NextResponse.json({
        error: 'Failed to connect to Supabase storage',
        details: bucketsError.message
      }, { status: 500 });
    }

    console.log('Buckets found:', buckets);

    // Check if invoices bucket exists
    const invoicesBucket = buckets.find(bucket => bucket.name === 'invoices');
    
    if (!invoicesBucket) {
      console.error('Invoices bucket not found');
      return NextResponse.json({
        error: 'Invoices bucket not found',
        availableBuckets: buckets.map(b => b.name)
      }, { status: 404 });
    }

    // Test listing files in the invoices bucket
    const { data: files, error: filesError } = await supabase
      .storage
      .from('invoices')
      .list('uploads');

    if (filesError) {
      console.error('Error listing files:', filesError);
      return NextResponse.json({
        error: 'Failed to list files in invoices bucket',
        details: filesError.message
      }, { status: 500 });
    }

    console.log('Files in uploads folder:', files);

    return NextResponse.json({
      message: 'Supabase connection successful',
      buckets: buckets.map(b => ({ name: b.name, public: b.public })),
      invoicesBucket: {
        name: invoicesBucket.name,
        public: invoicesBucket.public,
        created_at: invoicesBucket.created_at
      },
      filesInUploads: files?.length || 0
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
