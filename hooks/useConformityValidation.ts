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

export interface ProcessData {
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

export function useConformityValidation(processData: ProcessData) {
  
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

  const checklist = useMemo((): ChecklistItem[] => {
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

    return items;
  }, [processData]);

  const overallStatus = useMemo(() => {
    const hasInvalid = checklist.some(item => item.status === 'invalid');
    const allValid = checklist.every(item => item.status === 'valid');
    
    if (hasInvalid) return 'has_errors';
    if (allValid) return 'complete';
    return 'incomplete';
  }, [checklist]);

  const allValid = useMemo(() => {
    return checklist.every(item => item.status === 'valid');
  }, [checklist]);

  return {
    checklist,
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
