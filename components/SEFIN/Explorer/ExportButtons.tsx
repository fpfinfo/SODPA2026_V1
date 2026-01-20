'use client'

import React, { useState } from 'react'
import { 
  Download, 
  FileSpreadsheet, 
  FileText,
  Loader2,
  Check
} from 'lucide-react'
import { SefinTask } from '../../../hooks/useSefinCockpit'

interface ExportButtonsProps {
  data: SefinTask[]
  filename?: string
}

// Helper to format date
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value)
}

// CSV Export
const exportToCSV = (data: SefinTask[], filename: string) => {
  const headers = [
    'NUP',
    'Tipo',
    'Suprido',
    'Lotação',
    'Valor',
    'Status',
    'Data Criação',
    'Data Assinatura'
  ]

  const rows = data.map(task => [
    task.processo?.nup || 'N/A',
    task.tipo,
    task.processo?.suprido_nome || 'N/A',
    task.processo?.lotacao_nome || 'N/A',
    task.processo?.valor_total || 0,
    task.status,
    formatDate(task.created_at),
    task.signed_at ? formatDate(task.signed_at) : '-'
  ])

  // Add BOM for Excel to recognize UTF-8
  const BOM = '\uFEFF'
  const csvContent = BOM + [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// PDF Export (simple HTML-based)
const exportToPDF = async (data: SefinTask[], filename: string) => {
  // Calculate totals
  const totalValue = data.reduce((sum, t) => sum + (t.processo?.valor_total || 0), 0)
  const pendingCount = data.filter(t => t.status === 'PENDING').length
  const signedCount = data.filter(t => t.status === 'SIGNED').length

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório SEFIN - ${filename}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      padding: 40px;
      color: #1e293b;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f59e0b;
    }
    .header h1 { 
      color: #1e40af; 
      font-size: 24px;
      margin-bottom: 5px;
    }
    .header p { 
      color: #64748b; 
      font-size: 14px;
    }
    .summary {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      flex: 1;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
    }
    .summary-card h3 {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .summary-card p {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      font-size: 11px;
    }
    th { 
      background: #1e40af; 
      color: white; 
      padding: 10px 8px; 
      text-align: left;
      font-weight: 600;
    }
    td { 
      padding: 8px; 
      border-bottom: 1px solid #e2e8f0; 
    }
    tr:nth-child(even) { background: #f8fafc; }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
    }
    .status-PENDING { background: #fef3c7; color: #92400e; }
    .status-SIGNED { background: #d1fae5; color: #065f46; }
    .status-REJECTED { background: #fee2e2; color: #991b1b; }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
    }
    @media print {
      body { padding: 20px; }
      .summary { display: flex !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ</h1>
    <p>Relatório de Documentos - SEFIN/SOSFU</p>
    <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
  </div>

  <div class="summary">
    <div class="summary-card">
      <h3>Total de Documentos</h3>
      <p>${data.length}</p>
    </div>
    <div class="summary-card">
      <h3>Valor Total</h3>
      <p>${formatCurrency(totalValue)}</p>
    </div>
    <div class="summary-card">
      <h3>Pendentes</h3>
      <p>${pendingCount}</p>
    </div>
    <div class="summary-card">
      <h3>Assinados</h3>
      <p>${signedCount}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>NUP</th>
        <th>Tipo</th>
        <th>Suprido</th>
        <th>Valor</th>
        <th>Status</th>
        <th>Data</th>
      </tr>
    </thead>
    <tbody>
      ${data.map(task => `
        <tr>
          <td>${task.processo?.nup || 'N/A'}</td>
          <td>${task.tipo}</td>
          <td>${task.processo?.suprido_nome || 'N/A'}</td>
          <td>${formatCurrency(task.processo?.valor_total || 0)}</td>
          <td><span class="status-badge status-${task.status}">${task.status}</span></td>
          <td>${formatDate(task.created_at)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Sistema de Concessão de Suprimento de Fundos - TJPA</p>
    <p>Este documento foi gerado eletronicamente e não requer assinatura.</p>
  </div>
</body>
</html>
  `

  // Open in new window for printing
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    
    // Trigger print after content loads
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}

export function ExportButtons({ data, filename = 'sefin_relatorio' }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null)
  const [exportSuccess, setExportSuccess] = useState<'csv' | 'pdf' | null>(null)

  const handleExportCSV = async () => {
    setIsExporting('csv')
    try {
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate processing
      exportToCSV(data, filename)
      setExportSuccess('csv')
      setTimeout(() => setExportSuccess(null), 2000)
    } finally {
      setIsExporting(null)
    }
  }

  const handleExportPDF = async () => {
    setIsExporting('pdf')
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      await exportToPDF(data, filename)
      setExportSuccess('pdf')
      setTimeout(() => setExportSuccess(null), 2000)
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportCSV}
        disabled={isExporting !== null || data.length === 0}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
          transition-all
          ${exportSuccess === 'csv'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isExporting === 'csv' ? (
          <Loader2 size={16} className="animate-spin" />
        ) : exportSuccess === 'csv' ? (
          <Check size={16} />
        ) : (
          <FileSpreadsheet size={16} />
        )}
        {exportSuccess === 'csv' ? 'Exportado!' : 'CSV'}
      </button>

      <button
        onClick={handleExportPDF}
        disabled={isExporting !== null || data.length === 0}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
          transition-all
          ${exportSuccess === 'pdf'
            ? 'bg-red-100 text-red-700'
            : 'bg-red-600 text-white hover:bg-red-700'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isExporting === 'pdf' ? (
          <Loader2 size={16} className="animate-spin" />
        ) : exportSuccess === 'pdf' ? (
          <Check size={16} />
        ) : (
          <FileText size={16} />
        )}
        {exportSuccess === 'pdf' ? 'Exportado!' : 'PDF'}
      </button>
    </div>
  )
}

export default ExportButtons
