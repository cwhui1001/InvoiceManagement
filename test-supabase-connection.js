// Simple test to verify Supabase connection
import { createAdminClient } from '@/utils/supabase/server';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  const supabase = createAdminClient();
  
  try {
    // Try to list buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
    } else {
      console.log('Buckets found:', buckets?.map(b => b.name));
      console.log('Invoices bucket exists:', buckets?.some(b => b.name === 'invoices'));
    }
    
    // Test simple query
    const { data: tables, error: tableError } = await supabase
      .from('invoices')
      .select('*')
      .limit(1);
      
    if (tableError) {
      console.error('Error querying invoices table:', tableError);
    } else {
      console.log('Database connection successful');
    }
  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

testSupabaseConnection();
