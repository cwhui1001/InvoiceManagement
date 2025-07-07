// test-data.js - Simple test to check if we can fetch data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    
    // Test 1: Try different table name cases
    console.log('\n--- Testing table names ---');
    
    const tableNames = ['OINV', 'oinv', 'Oinv'];
    for (const tableName of tableNames) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`Table '${tableName}':`, error.message);
      } else {
        console.log(`Table '${tableName}': SUCCESS, found ${data.length} records`);
        if (data.length > 0) {
          console.log('Sample record:', data[0]);
        }
      }
    }
    
    // Test 2: List all tables
    console.log('\n--- Listing all tables ---');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('Cannot list tables:', tablesError.message);
    } else {
      console.log('Available tables:', tables.map(t => t.table_name));
    }

  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

testConnection();
