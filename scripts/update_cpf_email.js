// Script to update CPF and Email in servidores_tj from CSV data
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ibyegvkmudwerpkqrsak.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlieWVndmttdWR3ZXJwa3Fyc2FrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE1MTAzMywiZXhwIjoyMDgzNzI3MDMzfQ.3G1fiVoCuGXvzRfYt8DoBeiIqc3aEV-xO9Ed6Z1LFdU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Read CSV file
  const csvPath = './bases/Nome Completo,Matrícula,CPF,Email.txt';
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header
  
  let updated = 0, errors = 0, notFound = 0;
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split(',');
    if (parts.length < 4) continue;
    
    const matricula = parts[1].trim();
    const cpf = parts[2].trim();
    const email = parts[3].trim();
    
    const { data, error } = await supabase
      .from('servidores_tj')
      .update({ cpf, email })
      .eq('matricula', matricula)
      .select('id');
    
    if (error) {
      console.error(`Error ${matricula}:`, error.message);
      errors++;
    } else if (data?.length > 0) {
      updated++;
    } else {
      notFound++;
    }
  }
  
  console.log(`Updated: ${updated}, Not found: ${notFound}, Errors: ${errors}`);
}

main().catch(console.error);
