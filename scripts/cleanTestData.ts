import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanTestData() {
  console.log('🧹 Limpando dados de teste...\n');
  
  try {
    // 1. Deletar histórico de tramitação
    console.log('📋 Deletando histórico de tramitação...');
    const { error: histError } = await supabase
      .from('historico_tramitacao')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (histError) throw histError;
    console.log('✅ Histórico deletado\n');

    // 2. Deletar documentos
    console.log('📄 Deletando documentos...');
    const { error: docsError } = await supabase
      .from('documentos')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (docsError) throw docsError;
    console.log('✅ Documentos deletados\n');

    // 3. Deletar solicitações
    console.log('📦 Deletando solicitações...');
    const { error: solError } = await supabase
      .from('solicitacoes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (solError) throw solError;
    console.log('✅ Solicitações deletadas\n');

    console.log('🎉 Sistema limpo com sucesso!');
    console.log('✨ Pronto para testes do zero!\n');
    
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
    process.exit(1);
  }
}

cleanTestData();
