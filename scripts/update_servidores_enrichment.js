/**
 * Script para enriquecer dados de servidores com entrância, polo e região
 * Os dados são extraídos do nome dos arquivos CSV na pasta bases
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração Supabase
const SUPABASE_URL = 'https://ibyegvkmudwerpkqrsak.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlieWVndmttdWR3ZXJwa3Fyc2FrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjQ0MTU1NCwiZXhwIjoyMDUyMDE3NTU0fQ.QmFWfEeSJ4mCrwEJh3LXi9LJI_bxqqIl0JD1K1p8c60';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

// Diretório base
const basesDir = join(__dirname, '..', 'bases');

/**
 * Parse CSV simples (considerando campos com vírgulas entre aspas)
 */
function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').replace(/\r/g, ''));
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Parse respeitando aspas
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/\r/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/\r/g, ''));
    
    // Extrair matrícula (primeira coluna)
    const matricula = values[0]?.replace(/"/g, '');
    if (matricula && !isNaN(Number(matricula))) {
      records.push(matricula);
    }
  }
  
  return records;
}

/**
 * Extrai tipo e valor do nome do arquivo
 */
function extractFromFilename(filename) {
  const name = filename.replace('.csv', '');
  
  // Entrância: "1° ENTRÂNCIA" → entrancia: "1ª Entrância"
  if (name.includes('ENTRÂNCIA')) {
    const match = name.match(/(\d+)°?\s*ENTRÂNCIA/i);
    if (match) {
      const num = match[1];
      const suffix = num === '1' ? 'ª' : 'ª';
      return { type: 'entrancia', value: `${num}${suffix} Entrância` };
    }
  }
  
  // Polo: "01° POLO - METROPOLITANA DE BELÉM" → polo
  if (name.includes('POLO')) {
    return { type: 'polo', value: name };
  }
  
  // Região: "01° REGIÃO JUDICIÁRIA - ANANINDEUA" → regiao
  if (name.includes('REGIÃO')) {
    return { type: 'regiao', value: name };
  }
  
  return null;
}

/**
 * Atualiza servidores em batch
 */
async function updateServidores(matriculas, field, value) {
  if (matriculas.length === 0) return { success: 0, errors: 0 };
  
  const batchSize = 100;
  let success = 0;
  let errors = 0;
  
  for (let i = 0; i < matriculas.length; i += batchSize) {
    const batch = matriculas.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('servidores_tj')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .in('matricula', batch);
    
    if (error) {
      console.error(`  Erro ao atualizar batch ${i / batchSize + 1}:`, error.message);
      errors += batch.length;
    } else {
      success += batch.length;
    }
  }
  
  return { success, errors };
}

/**
 * Main
 */
async function main() {
  console.log('=== ENRIQUECENDO DADOS DE SERVIDORES ===\n');
  
  // Obter lista de arquivos
  const files = readdirSync(basesDir).filter(f => f.endsWith('.csv'));
  console.log(`Total de arquivos: ${files.length}\n`);
  
  // Filtrar apenas arquivos de entrância, polo e região
  const enrichmentFiles = files.filter(f => 
    f.includes('ENTRÂNCIA') || f.includes('POLO') || f.includes('REGIÃO')
  );
  
  console.log(`Arquivos de enriquecimento: ${enrichmentFiles.length}`);
  console.log('- Entrância:', files.filter(f => f.includes('ENTRÂNCIA')).length);
  console.log('- Polo:', files.filter(f => f.includes('POLO')).length);
  console.log('- Região:', files.filter(f => f.includes('REGIÃO')).length);
  console.log('');
  
  // Estatísticas
  const stats = {
    entrancia: { processed: 0, updated: 0, errors: 0 },
    polo: { processed: 0, updated: 0, errors: 0 },
    regiao: { processed: 0, updated: 0, errors: 0 }
  };
  
  // Processar cada arquivo de enriquecimento
  for (const file of enrichmentFiles) {
    const extracted = extractFromFilename(file);
    if (!extracted) continue;
    
    const { type, value } = extracted;
    
    // Ler e parsear CSV
    const filePath = join(basesDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const matriculas = parseCSV(content);
    
    console.log(`\n📄 ${file}`);
    console.log(`   Tipo: ${type}, Valor: ${value}`);
    console.log(`   Matrículas encontradas: ${matriculas.length}`);
    
    stats[type].processed += matriculas.length;
    
    // Atualizar no Supabase
    const result = await updateServidores(matriculas, type, value);
    stats[type].updated += result.success;
    stats[type].errors += result.errors;
    
    console.log(`   ✅ Atualizados: ${result.success}, ❌ Erros: ${result.errors}`);
  }
  
  // Resumo final
  console.log('\n\n=== RESUMO FINAL ===\n');
  console.log('ENTRÂNCIA:');
  console.log(`  Processados: ${stats.entrancia.processed}`);
  console.log(`  Atualizados: ${stats.entrancia.updated}`);
  console.log(`  Erros: ${stats.entrancia.errors}`);
  
  console.log('\nPOLO:');
  console.log(`  Processados: ${stats.polo.processed}`);
  console.log(`  Atualizados: ${stats.polo.updated}`);
  console.log(`  Erros: ${stats.polo.errors}`);
  
  console.log('\nREGIÃO:');
  console.log(`  Processados: ${stats.regiao.processed}`);
  console.log(`  Atualizados: ${stats.regiao.updated}`);
  console.log(`  Erros: ${stats.regiao.errors}`);
  
  // Verificação final
  console.log('\n\n=== VERIFICAÇÃO ===\n');
  
  const { data: entranciaCheck } = await supabase
    .from('servidores_tj')
    .select('entrancia')
    .not('entrancia', 'is', null);
  console.log(`Registros com entrância: ${entranciaCheck?.length || 0}`);
  
  const { data: poloCheck } = await supabase
    .from('servidores_tj')
    .select('polo')
    .not('polo', 'is', null);
  console.log(`Registros com polo: ${poloCheck?.length || 0}`);
  
  const { data: regiaoCheck } = await supabase
    .from('servidores_tj')
    .select('regiao')
    .not('regiao', 'is', null);
  console.log(`Registros com região: ${regiaoCheck?.length || 0}`);
}

main().catch(console.error);
