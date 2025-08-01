// Add uploader columns to PDF table
import { createAdminClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createAdminClient();
    
    // Add uploader columns to PDF table
    const addColumns = await supabase.rpc('exec_sql', {
      sql: `
        -- Add uploader columns if they don't exist
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'pdf' AND column_name = 'uploader_user_id') THEN
            ALTER TABLE pdf ADD COLUMN uploader_user_id uuid;
            ALTER TABLE pdf ADD CONSTRAINT pdf_uploader_fkey 
              FOREIGN KEY (uploader_user_id) REFERENCES auth.users (id);
          END IF;
        END $$;
      `
    });
    
    if (addColumns.error) {
      console.error('Error adding columns:', addColumns.error);
      return Response.json({ error: 'Failed to add columns', details: addColumns.error });
    }
    
    console.log('Successfully added uploader_user_id column to PDF table');
    
    return Response.json({ 
      message: 'Successfully added uploader columns to PDF table',
      success: true 
    });
    
  } catch (error) {
    console.error('Script error:', error);
    return Response.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}
