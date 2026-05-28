'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, Download, RefreshCw, Eye, Edit2,
  AlertTriangle, Clock, CheckCircle2, ChevronDown, X, RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { devolutionAPI, reportAPI } from '@/lib/api';
import {
  formatCurrency, formatDateTime, getStatusLabel, getStatusColor,
  getPriorityLabel, getPriorityColor, getTypeLabel, getChannelLabel, truncate
} from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { DevolutionModal } from '@/components/modules/DevolutionModal';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os Status' },
  { value: 'OPEN', label: 'Aberto' },
  { value: 'IN_ANALYSIS', label: 'Em Análise' },
  { value: 'AWAITING_COLLECTION', label: 'Aguardando Coleta' },
  { value: 'COLLECTION_SCHEDULED', label: 'Coleta Agendada' },
  { value: 'IN_TRANSIT', label: 'Em Trânsito' },
  { value: 'RECEIVED', label: 'Recebido' },
  { value: 'IN_INSPECTION', label: 'Em Inspeção' },
  { value: 'AWAITING_FINANCIAL', label: 'Aguardando Financeiro' },
  { value: 'REFUND_APPROVED', label: 'Reembolso Aprovado' },
  { value: 'REFUND_PROCESSED', label: 'Reembolso Realizado' },
  { value: 'EXCHANGE_SENT', label: 'Troca Enviada' },
  { value: 'FINALIZED', label: 'Finalizado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'Todas Prioridades' },
  { value: 'CRITICAL', label: 'Crítica' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'LOW', label: 'Baixa' },
];

const CHANNEL_OPTIONS = [
  { value: '', label: 'Todos os Canais' },
  { value: 'SLEEPCALM_SITE', label: 'Site SleepCalm' },
  { value: 'MERCADO_LIVRE', label: 'Mercado Livre' },
  { value: 'SHOPEE', label: 'Shopee' },
  { value: 'AMAZON', label: 'Amazon' },
  { value: 'MAGALU', label: 'Magalu' },
  { value: 'VIA_VAREJO', label: 'Via Varejo' },
  { value: 'AMERICANAS', label: 'Americanas' },
  { value: 'OUTROS', label: 'Outros' },
];

export default function DevolutionsPage() {
  const { checkPermission } = useAuthStore();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    channel: '',
    slaBreached: '',
    page: 1,
    limit: 20,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['devolutions', filters],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const res = await devolutionAPI.list(params);
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      devolutionAPI.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devolutions'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar status.'),
  });

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const res = await reportAPI.devolutions({ format, ...filters });
      const blob = new Blob([res.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devolutions_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Relatório ${format.toUpperCase()} gerado!`);
    } catch {
      toast.error('Erro ao gerar relatório.');
    }
  };

  const devolutions = data?.data || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Devoluções</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pagination.total || 0} devolução(ões) no sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          {checkPermission('EXPORT') && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => exportReport('excel')}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-emerald-600 hover:text-emerald-500"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={() => exportReport('pdf')}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-red-500 hover:text-red-400"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            </div>
          )}
          {checkPermission('CREATE') && (
            <button
              onClick={() => { setEditingId(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-glow-sm"
            >
              <Plus className="w-4 h-4" />
              Nova Devolução
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por caso, pedido, cliente, SKU..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm transition-colors ${
              showFilters ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border hover:bg-muted'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {Object.values(filters).filter(v => v && v !== '1' && v !== '20').length > 0 && (
              <span className="w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select
                  value={filters.channel}
                  onChange={(e) => setFilters({ ...filters, channel: e.target.value, page: 1 })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {CHANNEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select
                  value={filters.slaBreached}
                  onChange={(e) => setFilters({ ...filters, slaBreached: e.target.value, page: 1 })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">SLA - Todos</option>
                  <option value="true">SLA Vencido</option>
                  <option value="false">SLA OK</option>
                </select>
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => setFilters({ search: '', status: '', priority: '', channel: '', slaBreached: '', page: 1, limit: 20 })}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpar filtros
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabela */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Carregando devoluções...
          </div>
        ) : devolutions.length === 0 ? (
          <div className="p-16 text-center">
            <RotateCcw className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma devolução encontrada</p>
            <p className="text-muted-foreground text-sm mt-1">Tente ajustar os filtros ou crie uma nova devolução.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Caso</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prioridade</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Canal</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">SLA</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Criado em</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {devolutions.map((dev: any, i: number) => (
                  <motion.tr
                    key={dev.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {dev.slaBreached && (
                         <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        )}
                        <Link href={`/dashboard/devolutions/${dev.id}`}>
                          <span className="font-mono text-xs font-medium text-primary hover:underline cursor-pointer">
                            {dev.caseNumber}
                          </span>
                        </Link>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Ped: {dev.orderNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{truncate(dev.customer?.name || '-', 22)}</p>
                      <p className="text-xs text-muted-foreground">{dev.customer?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dev.status)}`}>
                        {getStatusLabel(dev.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(dev.priority)}`}>
                        {getPriorityLabel(dev.priority)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{getTypeLabel(dev.type)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{getChannelLabel(dev.saleChannel)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-foreground">{formatCurrency(parseFloat(dev.totalValue || 0))}</span>
                    </td>
                    <td className="px-4 py-3">
                      {dev.slaBreached ? (
                        <span className="flex items-center gap-1 text-xs text-red-500">
                          <AlertTriangle className="w-3 h-3" />
                          Vencido
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-emerald-500">
                          <CheckCircle2 className="w-3 h-3" />
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{formatDateTime(dev.createdAt)}</span>
                      {dev.assignedTo && (
                        <p className="text-xs text-muted-foreground mt-0.5">👤 {dev.assignedTo.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/dashboard/devolutions/${dev.id}`}>
                          <button className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-colors" title="Ver detalhes">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        {checkPermission('EDIT') && (
                          <button
                            onClick={() => { setEditingId(dev.id); setShowModal(true); }}
                            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Mostrando {((filters.page - 1) * filters.limit) + 1}–{Math.min(filters.page * filters.limit, pagination.total)} de {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={!pagination.hasPrev}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Anterior
              </button>
              <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg font-medium">{filters.page}</span>
              <button
                disabled={!pagination.hasNext}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nova/Editar Devolução */}
      <AnimatePresence>
        {showModal && (
          <DevolutionModal
            devolutionId={editingId}
            onClose={() => { setShowModal(false); setEditingId(null); }}
            onSuccess={() => {
              setShowModal(false);
              setEditingId(null);
              queryClient.invalidateQueries({ queryKey: ['devolutions'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
