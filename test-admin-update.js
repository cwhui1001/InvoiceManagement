require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testAdminUpdate() {
  // Test with service role key
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'your_actual_service_role_key_from_supabase_dashboard') {
    console.log('❌ SERVICE ROLE KEY NOT SET');
    console.log('Please get your service role key from Supabase Dashboard:');
    console.log('1. Go to https://supabase.com/dashboard/project/crbgqchlqpcokwwkgohb/settings/api');
    console.log('2. Copy the "service_role" key (NOT the anon key)');
    console.log('3. Replace SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.log('4. Restart your development server');
    return;
  }

  try {
    // First, get a user to test with
    const { data: users, error: fetchError } = await adminSupabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No users found to test with');
      return;
    }
    
    const testUser = users[0];
    console.log('✅ Original user data:', testUser);
    
    // Try to update the user
    const updateData = {
      full_name: testUser.full_name + ' (Test Update)',
      email: testUser.email,
      username: testUser.username,
      role: testUser.role
    };
    
    console.log('🔄 Attempting to update with admin client:', updateData);
    
    const { data: updateResult, error: updateError } = await adminSupabase
      .from('profiles')
      .update(updateData)
      .eq('id', testUser.id)
      .select();
      
    if (updateError) {
      console.error('❌ Update error:', updateError);
    } else {
      console.log('✅ Update successful:', updateResult);
    }
    
    // Fetch the user again to confirm the update
    const { data: updatedUser, error: refetchError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUser.id)
      .single();
      
    if (refetchError) {
      console.error('❌ Error refetching user:', refetchError);
    } else {
      console.log('✅ User after update:', updatedUser);
      
      // Verify the change took effect
      if (updatedUser.full_name !== testUser.full_name) {
        console.log('🎉 SUCCESS: Admin client can update users!');
        
        // Revert the change
        const { error: revertError } = await adminSupabase
          .from('profiles')
          .update({ full_name: testUser.full_name })
          .eq('id', testUser.id);
          
        if (!revertError) {
          console.log('✅ Reverted test change');
        }
      } else {
        console.log('❌ FAILED: Update did not take effect');
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAdminUpdate().then(() => process.exit(0)).catch(console.error);
