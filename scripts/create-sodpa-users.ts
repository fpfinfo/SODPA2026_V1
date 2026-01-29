// Script para criar usuários SODPA no Supabase Auth
// Execute com: npx tsx scripts/create-sodpa-users.ts

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bnlgogjdoqaqcjjunevu.supabase.co';
// IMPORTANTE: Substitua pela sua SERVICE_ROLE_KEY do dashboard
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const users = [
  { email: 'sodpa01@tjpa.jus.br', nome: 'Ana Paula Ferreira' },
  { email: 'sodpa02@tjpa.jus.br', nome: 'Carlos Eduardo Santos' },
  { email: 'sodpa03@tjpa.jus.br', nome: 'Maria Helena Costa' },
  { email: 'sodpa04@tjpa.jus.br', nome: 'João Pedro Almeida' },
  { email: 'sodpa05@tjpa.jus.br', nome: 'Fernanda Oliveira Lima' },
];

async function createUsers() {
  console.log('🚀 Criando usuários SODPA...\n');

  for (const user of users) {
    try {
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: '123456',
        email_confirm: true,
        user_metadata: { nome: user.nome }
      });

      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`⚠️  ${user.email} já existe`);
          continue;
        }
        throw authError;
      }

      console.log(`✅ ${user.email} criado com sucesso (ID: ${authData.user.id})`);

      // 2. Criar profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: user.email,
          nome: user.nome,
          role: 'SODPA',
          cargo: 'Analista SODPA',
          setor: 'SODPA',
          ativo: true
        });

      if (profileError) {
        console.error(`   ❌ Erro ao criar profile: ${profileError.message}`);
      }

      // 3. Atualizar servidores_tj com user_id
      const { error: servidorError } = await supabaseAdmin
        .from('servidores_tj')
        .update({ user_id: authData.user.id })
        .eq('email', user.email);

      if (servidorError) {
        console.error(`   ❌ Erro ao vincular servidor: ${servidorError.message}`);
      }

    } catch (err) {
      console.error(`❌ Erro com ${user.email}:`, err);
    }
  }

  console.log('\n✨ Processo concluído!');
}

createUsers();
