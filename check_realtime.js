import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env file manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
  if (match) {
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[match[1].trim()] = value;
  }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRealtime() {
  try {
    // Check publications using a custom query if possible, or just try to see if we can RPC.
    // Since we don't have direct SQL execution via supabase-js without an RPC, 
    // we might not be able to query pg_publication_tables directly.
    // Let's check if the subscriptions actually trigger by doing a quick test:
    
    console.log("Checking realtime setup...");
    
    // As a simple alternative, we can query the realtime publication via the Supabase Management API 
    // or just assume it's not set. But let's see if we can do a quick check on the 'submissions' table.
    // If the user hasn't run the `run_this_in_supabase.sql` migration, the 'resubmission_count' 
    // column won't exist. Let's check if that column exists!

    const { data: cols, error: colsError } = await supabase
      .from('submissions')
      .select('resubmission_count')
      .limit(1);

    if (colsError) {
      console.log('Error querying resubmission_count:', colsError.message);
      console.log('It seems the migration `run_this_in_supabase.sql` was not fully applied.');
    } else {
      console.log('The resubmission_count column exists.');
      // If it exists, let's also check if user_points table exists
      const { data: pts, error: ptsError } = await supabase.from('user_points').select('id').limit(1);
      if (ptsError) {
        console.log('Error querying user_points:', ptsError.message);
      } else {
        console.log('The user_points table exists.');
      }
    }
  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

checkRealtime();
