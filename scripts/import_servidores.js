import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Diretório base
const basesDir = join(__dirname, '..', 'bases');

// Escape para SQL
function escapeSQL(str) {
  if (!str || str === '') return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

// Parse CSV simples
function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\r/g, '');
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

// Processar arquivo e gerar SQL
function processFile(filePath, fileName) {
  const content = readFileSync(filePath, 'utf-8');
  const records = parseCSV(content);
  
  const values = records.map(r => {
    const matricula = r['Matrícula'] || r['Matricula'];
    const nome = r['Nome'];
    const vinculo = r['Vínculo'] || r['Vinculo'] || '';
    const cargo = r['Cargo'] || '';
    const lotacao = r['Lotação'] || r['Lotacao'] || '';
    const lotacaoCumulativa = r['Lotação Cumulativa'] || r['Lotacao Cumulativa'] || '';
    const teletrabalho = r['Teletrabalho'] || '';
    const tipoAfastamento = r['Tipo de afastamento'] || '';
    const tipoEstagio = r['Tipo de estágio'] || r['Tipo de estagio'] || '';
    const curso = r['CURSO'] || r['Curso'] || '';
    
    let categoria = 'SERVIDOR';
    if (vinculo.toLowerCase().includes('magistrado')) categoria = 'MAGISTRADO';
    if (vinculo.toLowerCase().includes('estagiario')) categoria = 'ESTAGIARIO';
    
    return `(${escapeSQL(matricula)}, ${escapeSQL(nome)}, ${escapeSQL(vinculo)}, ${escapeSQL(categoria)}, ${escapeSQL(cargo)}, ${escapeSQL(lotacao)}, ${escapeSQL(lotacaoCumulativa)}, ${escapeSQL(teletrabalho)}, ${escapeSQL(tipoAfastamento)}, ${escapeSQL(tipoEstagio)}, ${escapeSQL(curso)}, '1G')`;
  });
  
  return { records: values, count: records.length };
}

// Main
const files = readdirSync(basesDir).filter(f => f.endsWith('.csv'));

console.log('=== PROCESSANDO ARQUIVOS CSV ===\n');

let allValues = [];

for (const file of files) {
  const filePath = join(basesDir, file);
  const { records, count } = processFile(filePath, file);
  console.log(`${file}: ${count} registros`);
  allValues = allValues.concat(records);
}

console.log(`\n=== TOTAL: ${allValues.length} REGISTROS ===`);

// Gerar um arquivo SQL com todos os INSERTs em batches
const batchSize = 200;
const batches = [];

for (let i = 0; i < allValues.length; i += batchSize) {
  const batch = allValues.slice(i, i + batchSize);
  const sql = `INSERT INTO servidores_tj (matricula, nome, vinculo, categoria, cargo, lotacao, lotacao_cumulativa, teletrabalho, tipo_afastamento, tipo_estagio, curso, grau) VALUES
${batch.join(',\n')}
ON CONFLICT (matricula) DO NOTHING;`;
  batches.push(sql);
}

// Salvar arquivo SQL
const outputPath = join(__dirname, 'servidores_import.sql');
writeFileSync(outputPath, batches.join('\n\n'));
console.log(`\nArquivo SQL gerado: ${outputPath}`);
console.log(`Total de batches: ${batches.length}`);
