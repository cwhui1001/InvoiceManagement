// test-supabase.js - Simple test to verify Supabase connection
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Try to create admin client (only if service role key is available)
let supabaseAdmin = null;
if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key_here') {
  supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Get all data without filters
    console.log('� Test 1: Fetching all records...');
    const { data: allData, error: allError } = await supabase
      .from('OINV')
      .select('*');

    if (allError) {
      console.log('❌ Failed to fetch all records:', allError.message);
    } else {
      console.log(`✅ Found ${allData.length} total records`);
      if (allData.length > 0) {
        console.log('📋 First record structure:');
        console.log(JSON.stringify(allData[0], null, 2));
      }
    }

    // Test 2: Count records
    console.log('\n� Test 2: Counting records...');
    const { count, error: countError } = await supabase
      .from('OINV')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Count failed:', countError.message);
    } else {
      console.log(`📊 Total count: ${count}`);
    }

    // Test 3: Try specific DocNum values from your screenshot
    console.log('\n🔍 Test 3: Looking for specific invoice numbers...');
    const testDocNums = ['587878', 'IN135721', 'OPENINC664', 'SO1000009'];
    
    for (const docNum of testDocNums) {
      const { data: specificData, error: specificError } = await supabase
        .from('OINV')
        .select('*')
        .eq('DocNum', docNum);

      if (specificError) {
        console.log(`❌ Error finding ${docNum}:`, specificError.message);
      } else if (specificData.length > 0) {
        console.log(`✅ Found ${docNum}:`, {
          DocNum: specificData[0].DocNum,
          CustName: specificData[0].CustName,
          DocDate: specificData[0].DocDate
        });
      } else {
        console.log(`⚠️  ${docNum} not found`);
      }
    }

    // Test 4: Check table schema
    console.log('\n� Test 4: Checking if we can access any data...');
    const { data: limitedData, error: limitedError } = await supabase
      .from('OINV')
      .select('DocNum')
      .limit(1);

    if (limitedError) {
      console.log('❌ Limited query failed:', limitedError.message);
    } else {
      console.log('✅ Limited query successful');
      console.log('Data:', limitedData);
    }

  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

testConnection();
