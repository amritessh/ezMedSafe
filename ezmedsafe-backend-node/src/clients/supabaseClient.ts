import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') }); 

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables are not set.');
  process.exit(1); 
}

const supabase = createClient(supabaseUrl, supabaseKey);


async function verifySupabaseConnection() {
  try {
    const { data, error } = await supabase.from('medications').select('id').limit(1);
    if (error) {
      console.error('Supabase connection failed:', error);
    } else {
      console.log('Supabase connected successfully!');
    }
  } catch (error) {
    console.error('Error during Supabase connection verification:', error);
  }
}
verifySupabaseConnection(); 

export default supabase;