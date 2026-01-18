import { useMemo } from 'react';
import { validateCPF, normalizeCPF } from '../utils/cpfValidator';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'valid' | 'invalid';
  errorMessage?: string;
}

export interface ExecutionDocument {
  id: string;
  tipo: string;
  status: 'PENDENTE' | 'GERADO' | 'ASSINADO';
  titulo: string;
}

export interface ProcessData {
  id?: string;
  nome?: string;
  cpf?: string;
  banco?: string;
  agencia?: string;
  conta_corrente?: string;
  valor_solicitado?: number;
  descricao?: string;
  status?: string;
  has_certidao_regularidade?: boolean;
}

export function useConformityValidation(
  processData: ProcessData,
  executionDocuments: ExecutionDocument[] = []
) {
  
  const validateNomeCompleto = (nome?: string): ValidationResult => {
    if (!nome || nome.trim().length === 0) {
      return { valid: false, error: 'Nome não informado' };
    }
    
    const words = nome.trim().split(/\s+/);
    if (words.length < 2) {
      return { valid: false, error: 'Nome deve conter nome e sobrenome' };
    }
    
    return { valid: true };
  };

  const validateCPFField = (cpf?: string): ValidationResult => {
    if (!cpf || cpf.trim().length === 0) {
      return { valid: false, error: 'CPF não informado' };
    }
    
    const normalizedCPF = normalizeCPF(cpf);
    if (!normalizedCPF || !validateCPF(normalizedCPF)) {
      return { valid: false, error: 'CPF inválido' };
    }
    
    return { valid: true };
  };

  const validateDadosBancarios = (banco?: string, agencia?: string, conta?: string): ValidationResult => {
    const missing: string[] = [];
    
    if (!banco || banco.trim().length === 0) missing.push('Banco');
    if (!agencia || agencia.trim().length === 0) missing.push('Agência');
    if (!conta || conta.trim().length === 0) missing.push('Conta');
    
    if (missing.length > 0) {
      return { 
        valid: false, 
        error: `Dados bancários incompletos: ${missing.join(', ')}` 
      };
    }
    
    return { valid: true };
  };

  const validateValorSolicitado = (valor?: number): ValidationResult => {
    if (!valor || valor <= 0) {
      return { valid: false, error: 'Valor deve ser maior que zero' };
    }
    
    const LIMITE_CNJ = 15000;
    if (valor > LIMITE_CNJ) {
      return { 
        valid: false, 
        error: `Valor excede limite de R$ ${LIMITE_CNJ.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Resolução CNJ 169/2013)` 
      };
    }
    
    return { valid: true };
  };

  const validateJustificativa = (descricao?: string): ValidationResult => {
    if (!descricao || descricao.trim().length === 0) {
      return { valid: false, error: 'Justificativa não informada' };
    }
    
    const MIN_CHARS = 50;
    if (descricao.trim().length < MIN_CHARS) {
      return { 
        valid: false, 
        error: `Justificativa muito curta (mínimo ${MIN_CHARS} caracteres, atual: ${descricao.trim().length})` 
      };
    }
    
    return { valid: true };
  };

  const validateAtestoGestor = (status?: string, hasCertidao?: boolean): ValidationResult => {
    // Verifica se tem certidão emitida no dossiê
    if (hasCertidao) {
      return { valid: true }; // Certidão presente = aprovado
    }
    
    if (!status) {
      return { valid: false, error: 'Status não definido' };
    }
    
    const approvedStatuses = [
      'EM ANALISE SOSFU',
      'EM ANALISE AJSEFIN', 
      'EM ANALISE SEFIN',
      'APROVADO'
    ];
    
    if (!approvedStatuses.includes(status.toUpperCase())) {
      return { 
        valid: false, 
        error: 'Aguardando homologação do gestor imediato' 
      };
    }
    
    return { valid: true };
  };

  const checklist = useMemo((): { items: ChecklistItem[]; summary: any } => {
    const items: ChecklistItem[] = [];

    // 1. Nome Completo
    const nomeValidation = validateNomeCompleto(processData.nome);
    items.push({
      id: 'nome_completo',
      label: 'Nome Completo',
      description: 'Nome e sobrenome do servidor',
      status: nomeValidation.valid ? 'valid' : 'invalid',
      errorMessage: nomeValidation.error
    });

    // 2. CPF
    const cpfValidation = validateCPFField(processData.cpf);
    items.push({
      id: 'cpf',
      label: 'CPF',
      description: 'CPF válido do servidor',
      status: cpfValidation.valid ? 'valid' : 'invalid',
      errorMessage: cpfValidation.error
    });

    // 3. Dados Bancários
    const bancosValidation = validateDadosBancarios(
      processData.banco,
      processData.agencia,
      processData.conta_corrente
    );
    items.push({
      id: 'dados_bancarios',
      label: 'Dados Bancários',
      description: 'Banco, agência e conta corrente',
      status: bancosValidation.valid ? 'valid' : 'invalid',
      errorMessage: bancosValidation.error
    });

    // 4. Valor Solicitado
    const valorValidation = validateValorSolicitado(processData.valor_solicitado);
    items.push({
      id: 'valor_solicitado',
      label: 'Valor Solicitado',
      description: 'Valor dentro do limite permitido',
      status: valorValidation.valid ? 'valid' : 'invalid',
      errorMessage: valorValidation.error
    });

    // 5. Justificativa
    const justificativaValidation = validateJustificativa(processData.descricao);
    items.push({
      id: 'justificativa',
      label: 'Justificativa',
      description: 'Justificativa detalhada da solicitação',
      status: justificativaValidation.valid ? 'valid' : 'invalid',
      errorMessage: justificativaValidation.error
    });

    // 6. Atesto de Conveniência (Gestor)
    const atestoValidation = validateAtestoGestor(processData.status, processData.has_certidao_regularidade);
    items.push({
      id: 'atesto_gestor',
      label: 'Atesto de Conveniência (Gestor)',
      description: processData.has_certidao_regularidade 
        ? 'Certidão de regularidade presente no dossiê'
        : 'Homologação da chefia imediata presente',
      status: atestoValidation.valid ? 'valid' : 'invalid',
      errorMessage: atestoValidation.error
    });

    // 7. Portaria de Concessão
    const portariaDoc = executionDocuments.find(d => d.tipo === 'PORTARIA');
    items.push({
      id: 'portaria',
      label: 'Portaria de Concessão',
      description: portariaDoc?.status === 'ASSINADO' 
        ? 'Portaria emitida e assinada pela SEFIN'
        : portariaDoc?.status === 'GERADO'
        ? 'Portaria emitida, aguardando assinatura'
        : 'Portaria de concessão ainda não gerada',
      status: portariaDoc?.status === 'ASSINADO' ? 'valid' : portariaDoc?.status === 'GERADO' ? 'pending' : 'invalid',
      errorMessage: !portariaDoc ? 'Documento não gerado' : portariaDoc.status !== 'ASSINADO' ? 'Aguardando assinatura da SEFIN' : undefined
    });

    // 8. Certidão de Regularidade
    const certidaoExecDoc = executionDocuments.find(d => d.tipo === 'CERTIDAO_REGULARIDADE');
    items.push({
      id: 'certidao_exec',
      label: 'Certidão de Regularidade',
      description: certidaoExecDoc?.status === 'ASSINADO'
        ? 'Certidão emitida e assinada pela SEFIN'
        : certidaoExecDoc?.status === 'GERADO'
        ? 'Certidão emitida, aguardando assinatura'
        : 'Certidão ainda não gerada',
      status: certidaoExecDoc?.status === 'ASSINADO' ? 'valid' : certidaoExecDoc?.status === 'GERADO' ? 'pending' : 'invalid',
      errorMessage: !certidaoExecDoc ? 'Documento não gerado' : certidaoExecDoc.status !== 'ASSINADO' ? 'Aguardando assinatura da SEFIN' : undefined
    });

    // 9. Nota de Empenho
    const neDoc = executionDocuments.find(d => d.tipo === 'NOTA_EMPENHO');
    items.push({
      id: 'nota_empenho',
      label: 'Nota de Empenho',
      description: neDoc?.status === 'ASSINADO'
        ? 'Nota de Empenho emitida e assinada'
        : neDoc?.status === 'GERADO'
        ? 'Nota de Empenho emitida, aguardando assinatura'
        : 'Nota de Empenho ainda não gerada',
      status: neDoc?.status === 'ASSINADO' ? 'valid' : neDoc?.status === 'GERADO' ? 'pending' : 'invalid',
      errorMessage: !neDoc ? 'Documento não gerado' : neDoc.status !== 'ASSINADO' ? 'Aguardando assinatura da SEFIN' : undefined
    });

    // 10. Nota de Liquidação
    const dlDoc = executionDocuments.find(d => d.tipo === 'NOTA_LIQUIDACAO');
    items.push({
      id: 'nota_liquidacao',
      label: 'Nota de Liquidação',
      description: dlDoc?.status === 'GERADO' || dlDoc?.status === 'ASSINADO'
        ? 'Nota de Liquidação emitida'
        : 'Nota de Liquidação ainda não gerada',
      status: dlDoc?.status === 'GERADO' || dlDoc?.status === 'ASSINADO' ? 'valid' : 'invalid',
      errorMessage: !dlDoc ? 'Documento não gerado' : undefined
    });

    // 11. Ordem Bancária
    const obDoc = executionDocuments.find(d => d.tipo === 'ORDEM_BANCARIA');
    items.push({
      id: 'ordem_bancaria',
      label: 'Ordem Bancária',
      description: obDoc?.status === 'GERADO' || obDoc?.status === 'ASSINADO'
        ? 'Ordem Bancária emitida'
        : 'Ordem Bancária ainda não gerada',
      status: obDoc?.status === 'GERADO' || obDoc?.status === 'ASSINADO' ? 'valid' : 'invalid',
      errorMessage: !obDoc ? 'Documento não gerado' : undefined
    });

    const validCount = items.filter(item => item.status === 'valid').length;
    const totalCount = items.length;
    const allValid = validCount === totalCount;

    return {
      items,
      summary: {
        validCount,
        totalCount,
        allValid,
        percentage: Math.round((validCount / totalCount) * 100)
      }
    };
  }, [processData, executionDocuments]);

  const overallStatus = useMemo(() => {
    const hasInvalid = checklist.items.some(item => item.status === 'invalid');
    const allValid = checklist.summary.allValid;
    
    if (hasInvalid) return 'has_errors';
    if (allValid) return 'complete';
    return 'incomplete';
  }, [checklist]);

  const allValid = useMemo(() => {
    return checklist.summary.allValid;
  }, [checklist]);

  return {
    checklist: checklist.items,
    summary: checklist.summary,
    overallStatus,
    allValid,
    validateNomeCompleto,
    validateCPFField,
    validateDadosBancarios,
    validateValorSolicitado,
    validateJustificativa,
    validateAtestoGestor
  };
}
