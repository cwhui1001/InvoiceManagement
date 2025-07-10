'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateUser(userId: string, userData: {
  full_name: string;
  email: string;
  username: string;
  role: string;
}) {
  // Use admin client for user management operations
  const supabase = createAdminClient();

  try {
    // Update profiles table only
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: userData.full_name,
        email: userData.email,
        username: userData.username,
        role: userData.role
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      throw profileError;
    }

    console.log('User updated successfully:', userId);
    console.log('Updated data:', userData);
    
    // Invalidate multiple cache paths
    revalidatePath('/dashboard/admin-management');
    revalidatePath('/dashboard');
    revalidateTag('users');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred' 
    };
  }
}

export async function deleteUser(userId: string) {
  // Use admin client for user management operations
  const supabase = createAdminClient();

  try {
    // Try to delete from user_roles first (optional, if accessible)
    try {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
    } catch (roleError) {
      console.warn('Could not delete from user_roles (may not have permission):', roleError);
      // Continue with profile deletion even if user_roles deletion fails
    }

    // Delete from profiles (main operation)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Profile deletion error:', profileError);
      throw profileError;
    }

    console.log('User deleted successfully:', userId);
    
    // Invalidate multiple cache paths
    revalidatePath('/dashboard/admin-management');
    revalidatePath('/dashboard');
    revalidateTag('users');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred' 
    };
  }
}

export async function createUser(userData: {
  email: string;
  full_name: string;
  username: string;
  role: string;
  password: string;
}) {
  // Use admin client for user management operations
  const supabase = createAdminClient();

  try {
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        full_name: userData.full_name,
        username: userData.username
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // Update the profile with additional data
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: userData.full_name,
        email: userData.email,
        username: userData.username,
        role: userData.role
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Try to clean up the auth user if profile update fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    console.log('User created successfully:', authData.user.id);
    console.log('User data:', userData);
    
    // Invalidate multiple cache paths
    revalidatePath('/dashboard/admin-management');
    revalidatePath('/dashboard');
    revalidateTag('users');
    
    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Error creating user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred' 
    };
  }
}
