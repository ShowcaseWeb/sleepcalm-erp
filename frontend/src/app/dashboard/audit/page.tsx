'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Shield, Search, Filter, Clock, User, Activity,
  AlertTriangle, LogIn, Edit, Trash2, Plus, CheckCircle2
} from 'lucide-react';
import { auditAPI } from '@/lib/api';
import { formatDateTime, cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

const ACTION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  LOGIN:            { label: 'Login',           icon: LogIn,         color: 'bg-emerald-500/10 text-emerald-400' },
  LOGOUT:           { label: 'Logout',          icon: LogIn,         color: 'bg-slate-500/10 text-slate-400' },
  CREATE:           { label: 'Criou',           icon: Plus,          color: 'bg-blue-500/10 text-blue-400' },
  UPDATE:           { label: 'Atualizou',       icon: Edit,          color: 'bg-yellow-500/10 text-yellow-400' },
  DELETE:           { label: 'Deletou',         icon: Trash2,        color: 'bg-red-500/10 text-red-400' },
  STATUS_CHANGE:    { label: 'Mudou Status',    icon: Activity,      color: 'bg-indigo-500/10 text-indigo-400' },
  APPROVE:          { label: 'Aprovou',         icon: CheckCircle2,  color: 'bg-teal-500/10 text-teal-400' },
  EXPORT:           { label: 'Exportou',        icon: Activity,      color: 'bg-purple-500/10 text-purple-400' },
  PASSWORD_CHANGE:  { label: 'Senha Alterada',  icon: Shield,        color: 'bg-orange-500/10 text-orange-400' },
  PERMISSION_CHANGE:{ label: 'Permissão Alterada', icon: Shield,     color: 'bg-pink-500/10 text-pink-400' },
};

const ENTITY_LABELS: Record<string, string> = {
  devolution: 'Devolução', user: 'Usuário', sku: 'SKU',
  supplier: 'Fornecedor', carrier: 'Transportadora', financial: 'Financeiro',
  technical: 'Análise Técnica', donation: 'Doação', lalamove: 'Lalamove',
  fiscal: 'Doc. Fiscal', attachment: 'Anexo', auth: 'Autenticação',
};

export default function AuditPage() {
  const { checkPermission } = useAuthStore();
  const canView = checkPermission('VIEW_AUDIT');

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit', search, actionFilter, entityFilter, dateFrom, dateTo, page],
    queryFn: async () => {
      const r = await auditAPI.list({
        search, action: actionFilter, entity: entityFilter,
        dateFrom, dateTo, page, limit: 20,
      });
      return r.data;
    },
    enabled: canView,
  });

  const { data: summary } = useQuery({
    queryKey: ['audit-summary'],
    queryFn: async () => {
      const r = await auditAPI.getSummary();
      return r.data.data;
    },
    enabled: canView,
    staleTime: 60000,
  });

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-10 h-10 text-yellow-500" />
        <p className="text-muted-foreground text-sm">Acesso restrito a administradores e supervisores.</p>
      </div>
    );
  }

  const kpis = [
    { label: 'Total de Eventos', value: summary?.total ?? 0, icon: Activity, color: 'bg-indigo-500/10 text-indigo-400' },
    { label: 'Hoje', value: summary?.today ?? 0, icon: Clock, color: 'bg-blue-500/10 text-blue-400' },
    { label: 'Usuários Ativos', value: summary?.activeUsers ?? 0, icon: User, color: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'Ações Críticas', value: summary?.critical ?? 0, icon: Shield, color: 'bg-red-500/10 text-red-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Log de Auditoria</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Rastreamento completo de todas as ações realizadas no sistema
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
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

      {/* Recent logins */}
      {summary?.recentLogins && summary.recentLogins.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <LogIn className="w-4 h-4 text-muted-foreground" />
            Últimos Acessos
          </h3>
          <div className="flex flex-wrap gap-2">
            {summary.recentLogins.slice(0, 8).map((log: any) => (
              <div key={log.id}
                className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border rounded-lg">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {log.user?.name?.charAt(0) ?? '?'}
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{log.user?.name ?? 'Desconhecido'}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDateTime(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar por usuário, entidade ou descrição..."
                className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
            </div>
            <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none">
              <option value="">Todas as ações</option>
              {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              placeholder="De"
              className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none" />
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
              placeholder="Até"
              className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none" />
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['Quando', 'Usuário', 'Ação', 'Entidade', 'ID da Entidade', 'Descrição', 'IP'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(logs?.data ?? []).map((log: any, i: number) => {
                const actionCfg = ACTION_CONFIG[log.action] ?? { label: log.action, icon: Activity, color: 'bg-slate-500/10 text-slate-400' };
                const Icon = actionCfg.icon;
                return (
                  <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                          {log.user?.name?.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">{log.user?.name ?? 'Sistema'}</p>
                          <p className="text-[10px] text-muted-foreground">{log.user?.email ?? ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('flex items-center gap-1.5 w-fit px-2 py-1 rounded-full text-xs font-medium', actionCfg.color)}>
                        <Icon className="w-3 h-3" />
                        {actionCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {ENTITY_LABELS[log.entity] ?? log.entity ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[10px] font-mono text-muted-foreground truncate max-w-[100px]">
                      {log.entityId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground max-w-[220px] truncate">
                      {log.description ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                      {log.ipAddress ?? '—'}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && (!logs?.data || logs.data.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum registro de auditoria encontrado.</p>
            </div>
          )}
        </div>

        {logs?.meta && logs.meta.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{logs.meta.total} eventos · Pág. {logs.meta.page} de {logs.meta.totalPages}</p>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(logs.meta.totalPages, 7) }, (_, i) => i + 1).map(p => (
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
