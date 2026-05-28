'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, BarChart2, DollarSign, Clock, Activity,
  Loader2, CheckCircle2, AlertTriangle, FileSpreadsheet
} from 'lucide-react';
import { reportAPI } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  available: string[];
}

const REPORTS: ReportCard[] = [
  {
    id: 'devolutions',
    title: 'Relatório de Devoluções',
    description: 'Lista completa de devoluções com filtros por período, status, canal e prioridade. Inclui dados do cliente, itens e valores.',
    icon: BarChart2,
    color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/20',
    available: ['pdf', 'excel'],
  },
  {
    id: 'financial',
    title: 'Relatório Financeiro',
    description: 'Resumo de receitas, despesas, prejuízos, reembolsos e fluxo de caixa por período. Quebrado por tipo de lançamento.',
    icon: DollarSign,
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/20',
    available: ['pdf', 'excel'],
  },
  {
    id: 'sla',
    title: 'Relatório de SLA',
    description: 'Performance de atendimento: taxa de cumprimento de SLA, casos vencidos, distribuição por prioridade e tempo médio de resolução.',
    icon: Clock,
    color: 'from-yellow-500/20 to-orange-500/10 border-yellow-500/20',
    available: ['pdf', 'excel'],
  },
  {
    id: 'operational',
    title: 'Relatório Operacional',
    description: 'Visão operacional: performance por analista, volume por canal, transportadoras, fornecedores e análises técnicas.',
    icon: Activity,
    color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20',
    available: ['pdf', 'excel'],
  },
];

interface ReportFilters {
  startDate: string;
  endDate: string;
  status: string;
  channel: string;
}

export default function ReportsPage() {
  const { checkPermission } = useAuthStore();
  const canExport = checkPermission('EXPORT');

  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: '',
    channel: '',
  });

  const handleGenerate = async (reportId: string, format: 'pdf' | 'excel') => {
    if (!canExport) {
      toast.error('Você não tem permissão para exportar relatórios.');
      return;
    }

    const key = `${reportId}-${format}`;
    setLoading(prev => ({ ...prev, [key]: true }));
    setSuccess(prev => ({ ...prev, [key]: false }));

    try {
      const r = await reportAPI.generate(reportId, format, filters);
      const blob = new Blob([r.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sleepcalm-${reportId}-${filters.startDate}-${filters.endDate}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccess(prev => ({ ...prev, [key]: true }));
      toast.success(`Relatório ${format.toUpperCase()} gerado com sucesso!`);
      setTimeout(() => setSuccess(prev => ({ ...prev, [key]: false })), 3000);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao gerar relatório. Tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  if (!canExport) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-10 h-10 text-yellow-500" />
        <p className="text-muted-foreground text-sm">Você não tem permissão para acessar relatórios.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Central de Relatórios</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Gere relatórios em PDF ou Excel para análise e auditoria do sistema de devoluções.
        </p>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-5"
      >
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          Filtros Globais para Relatórios
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Data Início</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Data Fim</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50">
              <option value="">Todos os status</option>
              {['OPEN','IN_ANALYSIS','COLLECTED','IN_TRANSIT','RECEIVED_WAREHOUSE',
                'TECHNICAL_ANALYSIS','APPROVED','REJECTED','REFUNDED','EXCHANGED',
                'DONATED','CLOSED','CANCELLED'].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Canal</label>
            <select value={filters.channel} onChange={e => setFilters({ ...filters, channel: e.target.value })}
              className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50">
              <option value="">Todos os canais</option>
              {['E_COMMERCE','MARKETPLACE','PHYSICAL_STORE','WHOLESALE','DIRECT_SALES','SOCIAL_MEDIA'].map(c => (
                <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          ℹ️ Estes filtros serão aplicados a todos os relatórios gerados abaixo.
        </p>
      </motion.div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {REPORTS.map((report, idx) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              'relative overflow-hidden bg-gradient-to-br border rounded-xl p-6',
              report.color
            )}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <report.icon className="w-full h-full" />
            </div>

            <div className="relative">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <report.icon className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{report.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{report.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-5">
                {report.available.map(format => {
                  const key = `${report.id}-${format}`;
                  const isLoading = loading[key];
                  const isSuccess = success[key];
                  const isPDF = format === 'pdf';

                  return (
                    <button
                      key={format}
                      onClick={() => handleGenerate(report.id, format as 'pdf' | 'excel')}
                      disabled={isLoading}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                        isSuccess
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isPDF
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30',
                        isLoading && 'opacity-70 cursor-not-allowed'
                      )}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isSuccess ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isPDF ? (
                        <FileText className="w-4 h-4" />
                      ) : (
                        <FileSpreadsheet className="w-4 h-4" />
                      )}
                      {isLoading ? 'Gerando...' : isSuccess ? 'Baixado!' : format.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Info box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-xl p-5"
      >
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          Informações sobre Relatórios
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-foreground mb-1.5">📄 Formato PDF</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Ideal para apresentações e impressão</li>
              <li>• Inclui logo SleepCalm e cabeçalho oficial</li>
              <li>• Tabelas formatadas com totalizadores</li>
              <li>• Assinatura digital com timestamp</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground mb-1.5">📊 Formato Excel (.xlsx)</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Ideal para análises e filtros adicionais</li>
              <li>• Múltiplas abas por categoria</li>
              <li>• Dados brutos para pivot tables</li>
              <li>• Fórmulas de totalização incluídas</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-400">
            ⚠️ Relatórios com grande volume de dados podem levar alguns segundos para gerar.
            Não feche a página durante a geração.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
