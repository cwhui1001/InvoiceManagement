import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import UserManagementTable from '@/app/ui/admin-management/user-management-table';

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getUsers() {
  const supabase = await createClient();
  
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        username,
        avatar_url,
        role
      `)
      .order('full_name');

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log('Users fetched successfully:', users?.length || 0);
    return users || [];
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return [];
  }
}

export default async function AdminManagementPage() {
  const currentUser = await getCurrentUser();
  const users = await getUsers();

  if (!currentUser) {
    return <div>Please log in to access this page.</div>;
  }

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Management</h1>
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold">Current User:</h3>
        <p>ID: {currentUser.id}</p>
        <p>Email: {currentUser.email}</p>
      </div>
      
      <div className="mt-6 p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600 mb-6">
          Manage user accounts, roles, and permissions. Only superadmin users can access this page.
        </p>
        
        <Suspense fallback={<div>Loading users...</div>}>
          <UserManagementTable users={users} />
        </Suspense>
      </div>
    </div>
  );
}
