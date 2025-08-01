// Check profiles table
import { createAdminClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createAdminClient();
    
    // Check profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);
      
    if (profileError) {
      return Response.json({ error: 'Profile error', details: profileError });
    }
    
    console.log('=== PROFILES DATA ===');
    console.log('Profile count:', profiles?.length || 0);
    profiles?.forEach((profile, index) => {
      console.log(`Profile ${index + 1}:`, {
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        email: profile.email
      });
    });
    console.log('====================');
    
    return Response.json({
      message: 'Profiles data',
      count: profiles?.length || 0,
      profiles: profiles
    });
    
  } catch (error) {
    return Response.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}
