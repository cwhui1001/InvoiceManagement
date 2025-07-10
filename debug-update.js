require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testUpdate() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // First, get a user to test with
  const { data: users, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
    
  if (fetchError) {
    console.error('Error fetching user:', fetchError);
    return;
  }
  
  if (!users || users.length === 0) {
    console.log('No users found to test with');
    return;
  }
  
  const testUser = users[0];
  console.log('Original user data:', testUser);
  
  // Try to update the user
  const updateData = {
    full_name: testUser.full_name + ' (Updated)',
    email: testUser.email,
    username: testUser.username,
    role: testUser.role
  };
  
  console.log('Attempting to update with:', updateData);
  
  const { data: updateResult, error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', testUser.id)
    .select();
    
  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('Update successful:', updateResult);
  }
  
  // Fetch the user again to confirm the update
  const { data: updatedUser, error: refetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', testUser.id)
    .single();
    
  if (refetchError) {
    console.error('Error refetching user:', refetchError);
  } else {
    console.log('User after update:', updatedUser);
  }
}

testUpdate().then(() => process.exit(0)).catch(console.error);
