'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, CheckCircle2,
  Clock, Plus, X, Filter, Download, Search, ChevronDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { financialAPI, reportAPI } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

const FINANCIAL_TYPES = [
  'REFUND', 'PARTIAL_REFUND', 'EXCHANGE_COST', 'SHIPPING_COST',
  'REPAIR_COST', 'DISCOUNT', 'LOSS', 'INSURANCE', 'OTHER'
];

const TYPE_LABELS: Record<string, string> = {
  REFUND: 'Reembolso', PARTIAL_REFUND: 'Reembolso Parcial', EXCHANGE_COST: 'Custo de Troca',
  SHIPPING_COST: 'Frete', REPAIR_COST: 'Reparo', DISCOUNT: 'Desconto',
  LOSS: 'Prejuízo', INSURANCE: 'Seguro', OTHER: 'Outro',
};

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16', '#f97316'];

interface CreateFinancialForm {
  devolutionId: string;
  type: string;
  description: string;
  amount: string;
  isExpense: string;
  notes: string;
}

function KPICard({ label, value, sub, icon: Icon, color, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card border border-border rounded-xl p-5 flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function FinancialPage() {
  const queryClient = useQueryClient();
  const { checkPermission } = useAuthStore();
  const canApprove = checkPermission('APPROVE');
  const canCreate = checkPermission('MANAGE_FINANCIAL');
  const canExport = checkPermission('EXPORT');

  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ type: '', approved: '', isExpense: '', search: '' });
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<CreateFinancialForm>({
    devolutionId: '', type: 'REFUND', description: '', amount: '', isExpense: 'true', notes: '',
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: async () => { const r = await financialAPI.getSummary(); return r.data.data; },
    staleTime: 60000,
  });

  const { data: flow } = useQuery({
    queryKey: ['financial-flow'],
    queryFn: async () => { const r = await financialAPI.getFlow({ months: 6 }); return r.data.data; },
    staleTime: 60000,
  });

  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ['financial-list', filters, page],
    queryFn: async () => {
      const r = await financialAPI.list({
        ...filters,
        page,
        limit: 15,
      });
      return r.data;
    },
  });

  const { mutate: createRecord, isPending: createPending } = useMutation({
    mutationFn: (data: any) => financialAPI.create({
      ...data,
      amount: parseFloat(data.amount),
      isExpense: data.isExpense === 'true',
    }),
    onSuccess: () => {
      toast.success('Registro financeiro criado com sucesso');
      setShowForm(false);
      setForm({ devolutionId: '', type: 'REFUND', description: '', amount: '', isExpense: 'true', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['financial-list'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: () => toast.error('Erro ao criar registro financeiro'),
  });

  const { mutate: approveRecord } = useMutation({
    mutationFn: (id: string) => financialAPI.approve(id),
    onSuccess: () => {
      toast.success('Registro aprovado');
      queryClient.invalidateQueries({ queryKey: ['financial-list'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: () => toast.error('Erro ao aprovar'),
  });

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const r = await reportAPI.generate('financial', format);
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `financeiro.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      toast.success('Relatório exportado');
    } catch {
      toast.error('Erro ao exportar relatório');
    }
  };

  const totalExpense = summary?.totalExpense ?? 0;
  const totalIncome = summary?.totalIncome ?? 0;
  const balance = totalIncome - totalExpense;
  const pendingCount = summary?.pendingCount ?? 0;

  const typeDistribution = (summary?.byType ?? []).map((t: any, i: number) => ({
    name: TYPE_LABELS[t.type] ?? t.type,
    value: t._sum?.amount ?? 0,
    count: t._count ?? 0,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Módulo Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Controle de reembolsos, prejuízos e custos operacionais
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canExport && (
            <>
              <button onClick={() => handleExport('excel')}
                className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                <Download className="w-4 h-4 text-emerald-400" /> Excel
              </button>
              <button onClick={() => handleExport('pdf')}
                className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                <Download className="w-4 h-4 text-red-400" /> PDF
              </button>
            </>
          )}
          {canCreate && (
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Novo Registro
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Despesas" value={formatCurrency(totalExpense)} icon={TrendingDown} color="text-red-400 bg-red-500/10" delay={0} />
        <KPICard label="Total Receitas" value={formatCurrency(totalIncome)} icon={TrendingUp} color="text-emerald-400 bg-emerald-500/10" delay={0.07} />
        <KPICard label="Saldo" value={formatCurrency(Math.abs(balance))} sub={balance >= 0 ? 'Positivo' : 'Negativo (prejuízo)'} icon={DollarSign} color={balance >= 0 ? 'text-blue-400 bg-blue-500/10' : 'text-red-400 bg-red-500/10'} delay={0.14} />
        <KPICard label="Pendentes de Aprovação" value={pendingCount} icon={Clock} color="text-yellow-400 bg-yellow-500/10" delay={0.21} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar chart - flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-card border border-border rounded-xl p-5"
        >
          <h3 className="font-semibold text-foreground mb-4">Fluxo Financeiro — Últimos 6 Meses</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={flow ?? []} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v: any) => [formatCurrency(v)]}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="income" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie chart - by type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <h3 className="font-semibold text-foreground mb-4">Por Tipo</h3>
          {typeDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={typeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                    {typeDistribution.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(v: any) => [formatCurrency(v)]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {typeDistribution.slice(0, 5).map((t: any) => (
                  <div key={t.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="text-xs text-muted-foreground truncate">{t.name}</span>
                    </div>
                    <span className="text-xs font-medium text-foreground">{formatCurrency(t.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Sem dados</div>
          )}
        </motion.div>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Novo Registro Financeiro</h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">ID da Devolução *</label>
                  <input value={form.devolutionId} onChange={e => setForm({ ...form, devolutionId: e.target.value })}
                    placeholder="UUID da devolução"
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Tipo *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50">
                    {FINANCIAL_TYPES.map(t => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Movimento *</label>
                  <select value={form.isExpense} onChange={e => setForm({ ...form, isExpense: e.target.value })}
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50">
                    <option value="true">Despesa (saída)</option>
                    <option value="false">Receita (entrada)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Valor (R$) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00" step="0.01" min="0"
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Descrição *</label>
                  <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Descrição do lançamento"
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Notas</label>
                  <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Observações opcionais"
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                </div>
              </div>
              <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={() => createRecord(form)}
                  disabled={createPending || !form.devolutionId || !form.amount || !form.description}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {createPending ? 'Criando...' : 'Criar Registro'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters + Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={filters.search}
              onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
              placeholder="Buscar por descrição ou caso..."
              className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground"
            />
          </div>
          <select value={filters.type} onChange={e => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}
            className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none">
            <option value="">Todos os tipos</option>
            {FINANCIAL_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <select value={filters.isExpense} onChange={e => { setFilters({ ...filters, isExpense: e.target.value }); setPage(1); }}
            className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none">
            <option value="">Movimento</option>
            <option value="true">Despesas</option>
            <option value="false">Receitas</option>
          </select>
          <select value={filters.approved} onChange={e => { setFilters({ ...filters, approved: e.target.value }); setPage(1); }}
            className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none">
            <option value="">Aprovação</option>
            <option value="true">Aprovados</option>
            <option value="false">Pendentes</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['Caso', 'Tipo', 'Descrição', 'Valor', 'Movimento', 'Aprovado', 'Por', 'Data', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(records?.data ?? []).map((r: any) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-primary whitespace-nowrap">{r.devolution?.caseNumber ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{TYPE_LABELS[r.type] ?? r.type}</td>
                  <td className="px-4 py-3 text-sm text-foreground max-w-[200px] truncate">{r.description}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">{formatCurrency(r.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.isExpense ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {r.isExpense ? 'Despesa' : 'Receita'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.approved ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Sim
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-yellow-400">
                        <Clock className="w-3 h-3" /> Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{r.approvedBy?.name ?? r.createdBy?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    {!r.approved && canApprove && (
                      <button
                        onClick={() => approveRecord(r.id)}
                        className="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
                      >
                        Aprovar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {recordsLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!recordsLoading && (!records?.data || records.data.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum registro financeiro encontrado.</p>
            </div>
          )}
        </div>

        {records?.meta && records.meta.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {records.meta.total} registros · Página {records.meta.page} de {records.meta.totalPages}
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(records.meta.totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={cn('w-7 h-7 rounded text-xs font-medium transition-colors',
                    page === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                >{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
