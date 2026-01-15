/**
 * Script para gerar SQL de enriquecimento de servidores
 * Gera comandos SQL para atualizar entrância, polo e região
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Diretório base
const basesDir = join(__dirname, '..', 'bases');

/**
 * Parse CSV e extrai matrículas
 */
function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  
  const matriculas = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Primeira coluna é matrícula
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/\r/g, ''));
        break; // Só precisamos da primeira coluna
      } else {
        current += char;
      }
    }
    if (values.length === 0) {
      values.push(current.trim().replace(/\r/g, ''));
    }
    
    const matricula = values[0]?.replace(/"/g, '');
    if (matricula && !isNaN(Number(matricula))) {
      matriculas.push(matricula);
    }
  }
  
  return matriculas;
}

/**
 * Extrai tipo e valor do nome do arquivo
 */
function extractFromFilename(filename) {
  const name = filename.replace('.csv', '');
  
  // Entrância
  if (name.includes('ENTRÂNCIA')) {
    const match = name.match(/(\d+)°?\s*ENTRÂNCIA/i);
    if (match) {
      const num = match[1];
      return { type: 'entrancia', value: `${num}ª Entrância` };
    }
  }
  
  // Polo
  if (name.includes('POLO')) {
    return { type: 'polo', value: name };
  }
  
  // Região
  if (name.includes('REGIÃO')) {
    return { type: 'regiao', value: name };
  }
  
  return null;
}

/**
 * Escape SQL string
 */
function escapeSQL(str) {
  return str.replace(/'/g, "''");
}

/**
 * Main
 */
function main() {
  console.log('=== GERANDO SQL DE ENRIQUECIMENTO ===\n');
  
  const files = readdirSync(basesDir).filter(f => f.endsWith('.csv'));
  
  // Filtrar apenas arquivos de entrância, polo e região
  const enrichmentFiles = files.filter(f => 
    f.includes('ENTRÂNCIA') || f.includes('POLO') || f.includes('REGIÃO')
  );
  
  console.log(`Arquivos de enriquecimento: ${enrichmentFiles.length}`);
  
  const sqlStatements = [];
  const stats = {
    entrancia: { files: 0, matriculas: 0 },
    polo: { files: 0, matriculas: 0 },
    regiao: { files: 0, matriculas: 0 }
  };
  
  for (const file of enrichmentFiles) {
    const extracted = extractFromFilename(file);
    if (!extracted) continue;
    
    const { type, value } = extracted;
    
    // Ler e parsear CSV
    const filePath = join(basesDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const matriculas = parseCSV(content);
    
    if (matriculas.length === 0) continue;
    
    stats[type].files++;
    stats[type].matriculas += matriculas.length;
    
    console.log(`📄 ${file}: ${matriculas.length} matrículas`);
    
    // Gerar UPDATE SQL (em batches de 500)
    const batchSize = 500;
    for (let i = 0; i < matriculas.length; i += batchSize) {
      const batch = matriculas.slice(i, i + batchSize);
      const matriculaList = batch.map(m => `'${m}'`).join(', ');
      const sql = `UPDATE servidores_tj SET ${type} = '${escapeSQL(value)}', updated_at = NOW() WHERE matricula IN (${matriculaList});`;
      sqlStatements.push(sql);
    }
  }
  
  // Salvar em arquivo
  const outputPath = join(__dirname, 'servidores_enrichment.sql');
  writeFileSync(outputPath, sqlStatements.join('\n\n'));
  
  console.log('\n=== RESUMO ===');
  console.log(`Entrância: ${stats.entrancia.files} arquivos, ${stats.entrancia.matriculas} matrículas`);
  console.log(`Polo: ${stats.polo.files} arquivos, ${stats.polo.matriculas} matrículas`);
  console.log(`Região: ${stats.regiao.files} arquivos, ${stats.regiao.matriculas} matrículas`);
  console.log(`\nTotal de comandos SQL: ${sqlStatements.length}`);
  console.log(`\nArquivo gerado: ${outputPath}`);
}

main();
