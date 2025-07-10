'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface UserRole {
  role: string;
  loading: boolean;
  error: string | null;
}

export function useRole(): UserRole {
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        console.log('Current user:', user?.id); // Debug log
        
        if (!user) {
          setRole('');
          setLoading(false);
          return;
        }

        // Query the profiles table to get the role enum directly
        const { data: profileData, error: dbError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        console.log('Profile data:', profileData); // Debug log
        console.log('DB error:', dbError); // Debug log

        if (dbError) {
          setError(dbError.message);
          setRole('');
        } else {
          setRole(profileData?.role || '');
        }
      } catch (err) {
        console.error('Role fetch error:', err); // Debug log
        setError(err instanceof Error ? err.message : 'Unknown error');
        setRole('');
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [supabase]);

  return { role, loading, error };
}

export function useIsSuperadmin(): boolean {
  const { role } = useRole();
  return role === 'superadmin';
}
