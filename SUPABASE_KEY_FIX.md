# How to Get the Correct Supabase Service Role Key

## Steps:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (the one with URL: https://crbgqchlqpcokwwkgohb.supabase.co)
3. Go to **Settings** in the left sidebar
4. Click on **API** 
5. Look for the **Project API keys** section
6. Find the **service_role** key (it's different from the anon key)
7. Copy the **service_role** key
8. Replace the value in your `.env.local` file

## Current Issue:
Your current service role key has a typo in the JWT payload:
- Current: `"rose": "service_role"` ❌
- Should be: `"role": "service_role"` ✅

This is causing the "signature verification failed" error.

## After Getting the Correct Key:
1. Update your `.env.local` file with the correct service role key
2. Restart your Next.js server
3. Try the upload again

The anon key in your `.env.local` looks correct, but the service role key definitely needs to be replaced with the correct one from your Supabase dashboard.
