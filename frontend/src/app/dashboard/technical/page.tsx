'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, CheckCircle2, Clock, XCircle, Search, Filter,
  AlertTriangle, ArrowUpRight, BarChart2, Microscope
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { technicalAPI } from '@/lib/api';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

const RESULT_CONFIG: Record<string, { label: string; className: string }> = {
  DEFECT_CONFIRMED: { label: 'Defeito Confirmado', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  NO_DEFECT:        { label: 'Sem Defeito',        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  MISUSE:           { label: 'Mau Uso',            className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  NORMAL_WEAR:      { label: 'Desgaste Normal',    className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  INCONCLUSIVE:     { label: 'Inconclusivo',       className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

const PIE_COLORS = ['#ef4444', '#22c55e', '#f97316', '#eab308', '#94a3b8'];

export default function TechnicalPage() {
  const queryClient = useQueryClient();
  const { checkPermission } = useAuthStore();
  const canApprove = checkPermission('APPROVE');

  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [approvedFilter, setApprovedFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['technical', resultFilter, approvedFilter, search, page],
    queryFn: async () => {
      const r = await technicalAPI.list({
        result: resultFilter,
        approved: approvedFilter,
        search,
        page,
        limit: 15,
      });
      return r.data;
    },
  });

  // Stats computed from all data
  const { data: allAnalyses } = useQuery({
    queryKey: ['technical-all'],
    queryFn: async () => {
      const r = await technicalAPI.list({ limit: 999 });
      return r.data.data ?? [];
    },
    staleTime: 120000,
  });

  const { mutate: approve } = useMutation({
    mutationFn: (id: string) => technicalAPI.approve(id),
    onSuccess: () => {
      toast.success('Análise aprovada');
      queryClient.invalidateQueries({ queryKey: ['technical'] });
      queryClient.invalidateQueries({ queryKey: ['technical-all'] });
    },
    onError: () => toast.error('Erro ao aprovar análise'),
  });

  const { mutate: reject } = useMutation({
    mutationFn: (id: string) => technicalAPI.reject(id),
    onSuccess: () => {
      toast.success('Análise rejeitada');
      queryClient.invalidateQueries({ queryKey: ['technical'] });
    },
    onError: () => toast.error('Erro ao rejeitar análise'),
  });

  // Compute stats
  const total = allAnalyses?.length ?? 0;
  const approved = allAnalyses?.filter((a: any) => a.approved).length ?? 0;
  const pending = total - approved;

  const resultDist = Object.entries(RESULT_CONFIG).map(([key, cfg], i) => ({
    name: cfg.label,
    value: allAnalyses?.filter((a: any) => a.result === key).length ?? 0,
    color: PIE_COLORS[i],
  })).filter(d => d.value > 0);

  const defectRate = total > 0
    ? Math.round((allAnalyses?.filter((a: any) => a.result === 'DEFECT_CONFIRMED').length ?? 0) / total * 100)
    : 0;

  const kpis = [
    { label: 'Total Análises', value: total, icon: Microscope, color: 'bg-indigo-500/10 text-indigo-400' },
    { label: 'Aprovadas', value: approved, icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'Pendentes', value: pending, icon: Clock, color: 'bg-yellow-500/10 text-yellow-400' },
    { label: 'Taxa de Defeito', value: `${defectRate}%`, icon: AlertTriangle, color: 'bg-red-500/10 text-red-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Análise Técnica</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Laudos técnicos de produtos devolvidos — defeitos, mau uso, desgaste
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-card border border-border rounded-xl p-5 flex items-center gap-4"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${k.color}`}>
              <k.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-bold text-foreground">{k.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart + Defect Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Distribuição por Resultado</h3>
          {resultDist.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={resultDist} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60}>
                    {resultDist.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {resultDist.map(d => (
                  <div key={d.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Sem dados</div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Taxa de Defeito</h3>
          <div className="flex items-end gap-3 mb-4">
            <span className="text-5xl font-black text-foreground">{defectRate}%</span>
            <span className="text-sm text-muted-foreground pb-1">dos produtos devolvidos</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${defectRate}%` }}
              transition={{ delay: 0.4, duration: 1.2, ease: 'easeOut' }}
              className={`h-full rounded-full ${defectRate >= 70 ? 'bg-red-500' : defectRate >= 40 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {defectRate >= 70 ? '⚠️ Taxa alta — revisar processo de qualidade.' :
             defectRate >= 40 ? 'Taxa moderada — atenção recomendada.' :
             '✅ Taxa dentro do aceitável.'}
          </p>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por defeito, analista ou caso..."
              className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
          </div>
          <select value={resultFilter} onChange={e => { setResultFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none">
            <option value="">Todos os resultados</option>
            {Object.entries(RESULT_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <select value={approvedFilter} onChange={e => { setApprovedFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none">
            <option value="">Aprovação</option>
            <option value="true">Aprovadas</option>
            <option value="false">Pendentes</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['Caso', 'Resultado', 'Tipo Defeito', 'Analista', 'Recomendação', 'Aprovada', 'Data', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(analyses?.data ?? []).map((a: any, i: number) => (
                <motion.tr key={a.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-primary whitespace-nowrap">{a.devolution?.caseNumber ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full border', RESULT_CONFIG[a.result]?.className ?? '')}>
                      {RESULT_CONFIG[a.result]?.label ?? a.result}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{a.defectType ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{a.analyst?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{a.recommendation ?? '—'}</td>
                  <td className="px-4 py-3">
                    {a.approved ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="w-3 h-3" />Sim</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-yellow-400"><Clock className="w-3 h-3" />Pendente</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    {!a.approved && canApprove && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => approve(a.id)}
                          className="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors">
                          Aprovar
                        </button>
                        <button onClick={() => reject(a.id)}
                          className="px-2.5 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors">
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && (!analyses?.data || analyses.data.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Microscope className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma análise técnica encontrada.</p>
            </div>
          )}
        </div>

        {analyses?.meta && analyses.meta.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{analyses.meta.total} análises</p>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(analyses.meta.totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={cn('w-7 h-7 rounded text-xs font-medium transition-colors',
                    page === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
