// Script to add uploader columns to PDF table
const { createAdminClient } = require('./utils/supabase/server.js');

async function addUploaderColumns() {
  try {
    const supabase = await createAdminClient();
    
    // Try to add the columns using SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          -- Add uploader_email column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'pdf' AND column_name = 'uploader_email') THEN
            ALTER TABLE pdf ADD COLUMN uploader_email TEXT;
          END IF;
          
          -- Add uploader_username column if it doesn't exist  
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'pdf' AND column_name = 'uploader_username') THEN
            ALTER TABLE pdf ADD COLUMN uploader_username TEXT;
          END IF;
          
          -- Add uploader_user_id column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'pdf' AND column_name = 'uploader_user_id') THEN
            ALTER TABLE pdf ADD COLUMN uploader_user_id TEXT;
          END IF;
        END $$;
      `
    });
    
    if (error) {
      console.error('Error adding columns:', error);
    } else {
      console.log('Successfully added uploader columns to PDF table');
    }
    
  } catch (e) {
    console.error('Script error:', e);
  }
}

addUploaderColumns();
