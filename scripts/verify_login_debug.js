
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env vars
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log('--- Testing Login for servidor01@tjpa.jus.br ---');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'servidor01@tjpa.jus.br',
    password: 'password123' // Trying default password used in creation scripts
  });

  if (error) {
    console.error('❌ Login Failed:', error.message);
    if (error.status) console.error('Status:', error.status);
    
    // Try the other common password
    console.log('--- Retrying with password 123456 ---');
    const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
        email: 'servidor01@tjpa.jus.br',
        password: '123456'
    });
    
    if (error2) {
        console.error('❌ Retry Login Failed:', error2.message);
        console.error('Status:', error2.status);
    } else {
        console.log('✅ Retry Login Success using "123456"!');
        console.log('User ID:', data2.user.id);
    }

  } else {
    console.log('✅ Login Success using "password123"!');
    console.log('User ID:', data.user.id);
  }
}

testLogin();
