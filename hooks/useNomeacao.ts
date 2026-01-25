'use client'

import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useQueryClient } from '@tanstack/react-query'
import { generatePortariaText, PortariaData } from '../utils/PortariaTemplate'

export interface Nomeacao {
  id: string
  unidade_id: string
  gestor_id: string
  suprido_atual_nome?: string
  novo_suprido_nome: string
  novo_suprido_cpf: string
  novo_suprido_matricula: string
  novo_suprido_cargo: string
  novo_suprido_email?: string
  portaria_conteudo: string
  portaria_numero_gerado: string
  status: 'PENDENTE_SOSFU' | 'APROVADO' | 'REJEITADO'
  created_at: string
}

export function useNomeacao() {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)

  // Criar e Assinar Portaria (Gestor)
  const createAndSignNomeacao = useCallback(async (
    dadosForm: {
      novoSuprido: { nome: string, cpf: string, matricula: string, cargo: string, email: string },
      motivo: string,
      dataEfeito: string
    },
    gestorProfile: any,
    unidadeAtual: any
  ) => {
    setIsLoading(true)
    try {
      // 1. Gerar Número da Portaria (Simulado sequential ou random year)
      const year = new Date().getFullYear()
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      const portariaNumero = `${random}/${year}-GAB`

      // 2. Gerar Texto
      const portariaData: PortariaData = {
        portariaNumero,
        dataEmissao: new Date().toISOString(),
        cidadeComarca: unidadeAtual.nome || 'Comarca',
        gestorNome: gestorProfile.nome,
        gestorCargo: 'Juiz de Direito e Diretor do Fórum', // Default, poderia vir do perfil
        unidadeNome: unidadeAtual.nome,
        novoSupridoNome: dadosForm.novoSuprido.nome,
        novoSupridoCargo: dadosForm.novoSuprido.cargo,
        novoSupridoMatricula: dadosForm.novoSuprido.matricula,
        novoSupridoCPF: dadosForm.novoSuprido.cpf,
        antigoSupridoNome: unidadeAtual.suprido_nome, // Se existir na unidade
        ptres: ['8193', '8163'],
        dataEfeito: dadosForm.dataEfeito
      }
      
      const conteudo = generatePortariaText(portariaData)

      // 3. Salvar no Banco
      const { data, error } = await supabase
        .from('nomeacoes_responsaveis')
        .insert({
          unidade_id: unidadeAtual.id, // Assumindo que temos o ID da unidade
          gestor_id: gestorProfile.id,
          suprido_atual_id: unidadeAtual.suprido_atual_id,
          suprido_atual_nome: unidadeAtual.suprido_nome,
          novo_suprido_nome: dadosForm.novoSuprido.nome,
          novo_suprido_cpf: dadosForm.novoSuprido.cpf,
          novo_suprido_matricula: dadosForm.novoSuprido.matricula,
          novo_suprido_cargo: dadosForm.novoSuprido.cargo,
          novo_suprido_email: dadosForm.novoSuprido.email,
          motivo_troca: dadosForm.motivo,
          data_efeito: dadosForm.dataEfeito,
          portaria_conteudo: conteudo,
          portaria_numero_gerado: portariaNumero,
          assinado_por_gestor: true, // Auto-signed
          assinado_em: new Date().toISOString(),
          status: 'PENDENTE_SOSFU'
        })
        .select()
        .single()

      if (error) throw error

      // 4. Atualizar flag na comarca/unidade_titulares (para aparecer na SOSFU)
      // Como unidade_titulares é uma view ou tabela sync, talvez precisemos atualizar a tabela base ou uma tabela auxiliar
      // Se 'unidade_titulares' for tabela real:
      await supabase
        .from('unidade_titulares')
        .update({ nomeacao_pendente_id: data.id })
        .eq('comarca_id', unidadeAtual.id) // ou .eq('id', unidadeAtual.titular_id)

      queryClient.invalidateQueries({ queryKey: ['nomeacoes'] })
      return { success: true, data }
      
    } catch (error: any) {
      console.error('Error creating nomeacao:', error)
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }, [queryClient])

  // SOSFU Aprovar
  const approveNomeacao = useCallback(async (nomeacaoId: string, unidadeId: string) => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Marcar como Aprovado
      const { error } = await supabase
        .from('nomeacoes_responsaveis')
        .update({
          status: 'APROVADO',
          analisado_por: user?.id,
          analisado_em: new Date().toISOString()
        })
        .eq('id', nomeacaoId)

      if (error) throw error

      // 2. Efetivar a troca na unidade_titulares (lógica de negócio principal)
      // Buscar dados da nomeação
      const { data: nomeacao } = await supabase
        .from('nomeacoes_responsaveis')
        .select('*')
        .eq('id', nomeacaoId)
        .single()

      if (nomeacao) {
         // Atualizar unidade_titulares
         // Nota: Isso não cria o login do usuário, apenas atualiza o registro de responsabilidade
         await supabase
           .from('unidade_titulares')
           .update({
             suprido_nome: nomeacao.novo_suprido_nome,
             suprido_email: nomeacao.novo_suprido_email,
             portaria_numero: nomeacao.portaria_numero_gerado,
             portaria_data: nomeacao.data_efeito,
             status: 'REGULAR', // Assume regular após nomeação
             nomeacao_pendente_id: null, // Limpa pendência
             updated_at: new Date().toISOString()
           })
           .eq('comarca_id', unidadeId)
      }

      queryClient.invalidateQueries({ queryKey: ['titulares'] })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }, [queryClient])

  // SOSFU Rejeitar
  const rejectNomeacao = useCallback(async (nomeacaoId: string, unidadeId: string, motivo: string) => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      await supabase
        .from('nomeacoes_responsaveis')
        .update({
          status: 'REJEITADO',
          analise_obs: motivo,
          analisado_por: user?.id,
          analisado_em: new Date().toISOString()
        })
        .eq('id', nomeacaoId)

      // Limpar flag de pendência
      await supabase
        .from('unidade_titulares')
        .update({ nomeacao_pendente_id: null })
        .eq('comarca_id', unidadeId)

      queryClient.invalidateQueries({ queryKey: ['titulares'] })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }, [queryClient])

  return {
    createAndSignNomeacao,
    approveNomeacao,
    rejectNomeacao,
    isLoading
  }
}
