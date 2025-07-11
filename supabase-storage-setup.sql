-- Manual Setup Instructions for Supabase Storage
-- Since storage policies table doesn't exist, you need to:

-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Navigate to Storage in the left sidebar
-- 3. Click "Create a new bucket"
-- 4. Set bucket name: "invoices"
-- 5. Set it as "Public bucket" (check the public option)
-- 6. Click "Create bucket"

-- Alternative: Try this simpler bucket creation (if storage is enabled):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices', 
  'invoices', 
  true, 
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
