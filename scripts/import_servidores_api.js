import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase setup
const SUPABASE_URL = 'https://ibyegvkmudwerpkqrsak.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlieWVndmttdWR3ZXJwa3Fyc2FrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE1MTAzMywiZXhwIjoyMDgzNzI3MDMzfQ.3G1fiVoCuGXvzRfYt8DoBeiIqc3aEV-xO9Ed6Z1LFdU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Diretório base
const basesDir = join(__dirname, '..', 'bases');

// Parse CSV
function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\r/g, '');
    if (!line.trim()) continue;
    
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    if (values.length >= 2 && values[0]) {
      const record = {};
      headers.forEach((h, idx) => {
        record[h] = values[idx] || '';
      });
      records.push(record);
    }
  }
  
  return records;
}

// Converter para formato da tabela
function toTableRecord(r) {
  const matricula = r['Matrícula'] || r['Matricula'];
  const nome = r['Nome'];
  const vinculo = r['Vínculo'] || r['Vinculo'] || 'Efetivo';
  const cargo = r['Cargo'] || null;
  const lotacao = r['Lotação'] || r['Lotacao'] || null;
  const lotacaoCumulativa = r['Lotação Cumulativa'] || r['Lotacao Cumulativa'] || null;
  const teletrabalho = r['Teletrabalho'] || null;
  const tipoAfastamento = r['Tipo de afastamento'] || null;
  const tipoEstagio = r['Tipo de estágio'] || r['Tipo de estagio'] || null;
  const curso = r['CURSO'] || r['Curso'] || null;
  
  let categoria = 'SERVIDOR';
  if (vinculo.toLowerCase().includes('magistrado')) categoria = 'MAGISTRADO';
  if (vinculo.toLowerCase().includes('estagiario')) categoria = 'ESTAGIARIO';
  
  return {
    matricula,
    nome,
    vinculo,
    categoria,
    cargo,
    lotacao,
    lotacao_cumulativa: lotacaoCumulativa,
    teletrabalho,
    tipo_afastamento: tipoAfastamento,
    tipo_estagio: tipoEstagio,
    curso,
    grau: '1G',
    ativo: true
  };
}

// Main
async function main() {
  const files = readdirSync(basesDir).filter(f => f.endsWith('.csv'));
  
  console.log('=== IMPORTAÇÃO DE SERVIDORES DO TJPA ===\n');
  console.log(`Arquivos encontrados: ${files.length}\n`);
  
  let totalImported = 0;
  let totalErrors = 0;
  
  for (const file of files) {
    const filePath = join(basesDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const records = parseCSV(content);
    
    console.log(`\n📂 Processando: ${file}`);
    console.log(`   Registros no arquivo: ${records.length}`);
    
    const tableRecords = records.map(toTableRecord);
    
    // Inserir em batches de 100
    const batchSize = 100;
    for (let i = 0; i < tableRecords.length; i += batchSize) {
      const batch = tableRecords.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('servidores_tj')
        .upsert(batch, { 
          onConflict: 'matricula',
          ignoreDuplicates: true 
        });
      
      if (error) {
        console.log(`   ❌ Erro no batch ${Math.floor(i/batchSize) + 1}: ${error.message}`);
        totalErrors += batch.length;
      } else {
        totalImported += batch.length;
        process.stdout.write(`   ✓ Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(tableRecords.length/batchSize)}\r`);
      }
    }
    
    console.log(`   ✅ ${tableRecords.length} registros processados`);
  }
  
  console.log('\n=== RESUMO ===');
  console.log(`Total processado: ${totalImported}`);
  console.log(`Erros: ${totalErrors}`);
  
  // Verificar contagem final
  const { count } = await supabase
    .from('servidores_tj')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\nTotal no banco: ${count}`);
}

main().catch(console.error);
