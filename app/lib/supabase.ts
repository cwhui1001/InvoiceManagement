// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Legacy exports for backward compatibility
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// For client-side operations (legacy)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side operations (legacy)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ⚠️ DEPRECATED: Use the new server/client imports instead:
// import { createClient } from '@/utils/supabase/server' (for server components)
// import { createClient } from '@/utils/supabase/client' (for client components)