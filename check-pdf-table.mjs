// Simple script to check PDF table structure
import { createAdminClient } from './utils/supabase/server.js';

async function checkPdfTable() {
  try {
    const supabase = await createAdminClient();
    
    // Get one record to see the structure
    const { data, error } = await supabase
      .from('pdf')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('PDF table structure (first record):', data);
    }
    
    // Also get count
    const { count, error: countError } = await supabase
      .from('pdf')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('Count error:', countError);
    } else {
      console.log('Total PDF records:', count);
    }
    
  } catch (e) {
    console.error('Script error:', e);
  }
}

checkPdfTable();
