
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manually parse .env.local
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
    
    const content = fs.readFileSync(envPath, 'utf-8');
    const env: Record<string, string> = {};
    
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[match[1].trim()] = value;
      }
    });
    return env;
  } catch (e) {
    console.error('Error loading .env.local:', e);
    return {};
  }
}

async function verifyUpdate() {
  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const seedId = '00000000-0000-0000-0000-000000000000';
  const newPhone = `(91) 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`;

  console.log(`Setting phone to: ${newPhone}`);

  // 1. Update
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ telefone: newPhone })
    .eq('id', seedId);

  if (updateError) {
    console.error('Update failed:', updateError);
    return;
  }
  console.log('Update command executed successfully.');

  // 2. Fetch to verify
  const { data, error: fetchError } = await supabase
    .from('profiles')
    .select('telefone')
    .eq('id', seedId)
    .single();

  if (fetchError) {
    console.error('Fetch failed:', fetchError);
    return;
  }

  console.log(`Fetched phone: ${data.telefone}`);
  
  if (data.telefone === newPhone) {
    console.log('SUCCESS: Data persistence verified!');
  } else {
    console.error('FAILURE: Data mismatch.');
  }
}

verifyUpdate();
