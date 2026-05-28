'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, CheckCircle2, Clock, XCircle, Plus, X, Search, Calendar, User, Package } from 'lucide-react';
import { donationAPI } from '@/lib/api';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING:   { label: 'Pendente',  className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  APPROVED:  { label: 'Aprovada',  className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  COMPLETED: { label: 'Concluída', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  CANCELLED: { label: 'Cancelada', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export default function DonationsPage() {
  const queryClient = useQueryClient();
  const { checkPermission } = useAuthStore();
  const canApprove = checkPermission('APPROVE');
  const canCreate = checkPermission('CREATE');

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    devolutionId: '', recipientName: '', recipientContact: '',
    quantity: '1', scheduledDate: '', notes: '',
  });

  const { data: donations, isLoading } = useQuery({
    queryKey: ['donations', statusFilter, search, page],
    queryFn: async () => {
      const r = await donationAPI.list({ status: statusFilter, search, page, limit: 15 });
      return r.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['donations-stats'],
    queryFn: async () => {
      const r = await donationAPI.list({ limit: 999 });
      const items = r.data.data ?? [];
      return {
        total: items.length,
        pending: items.filter((d: any) => d.status === 'PENDING').length,
        approved: items.filter((d: any) => d.status === 'APPROVED').length,
        completed: items.filter((d: any) => d.status === 'COMPLETED').length,
      };
    },
    staleTime: 60000,
  });

  const { mutate: create, isPending: createPending } = useMutation({
    mutationFn: (data: any) => donationAPI.create({ ...data, quantity: parseInt(data.quantity) }),
    onSuccess: () => {
      toast.success('Doação registrada com sucesso');
      setShowForm(false);
      setForm({ devolutionId: '', recipientName: '', recipientContact: '', quantity: '1', scheduledDate: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['donations-stats'] });
    },
    onError: () => toast.error('Erro ao registrar doação'),
  });

  const { mutate: approve } = useMutation({
    mutationFn: (id: string) => donationAPI.approve(id),
    onSuccess: () => {
      toast.success('Doação aprovada');
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['donations-stats'] });
    },
    onError: () => toast.error('Erro ao aprovar doação'),
  });

  const { mutate: complete } = useMutation({
    mutationFn: (id: string) => donationAPI.update(id, { status: 'COMPLETED' }),
    onSuccess: () => {
      toast.success('Doação marcada como concluída');
      queryClient.invalidateQueries({ queryKey: ['donations'] });
    },
    onError: () => toast.error('Erro ao concluir'),
  });

  const kpis = [
    { label: 'Total', value: stats?.total ?? 0, icon: Gift, color: 'bg-pink-500/10 text-pink-400' },
    { label: 'Pendentes', value: stats?.pending ?? 0, icon: Clock, color: 'bg-yellow-500/10 text-yellow-400' },
    { label: 'Aprovadas', value: stats?.approved ?? 0, icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'Concluídas', value: stats?.completed ?? 0, icon: Package, color: 'bg-blue-500/10 text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Módulo de Doações</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gestão de doações de produtos devolvidos a instituições
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Registrar Doação
          </button>
        )}
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

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Nova Doação</h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">ID da Devolução *</label>
                  <input value={form.devolutionId} onChange={e => setForm({ ...form, devolutionId: e.target.value })}
                    placeholder="UUID da devolução"
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5"><User className="w-3 h-3" />Instituição / Beneficiário *</label>
                  <input value={form.recipientName} onChange={e => setForm({ ...form, recipientName: e.target.value })}
                    placeholder="Nome da instituição"
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Contato</label>
                  <input value={form.recipientContact} onChange={e => setForm({ ...form, recipientContact: e.target.value })}
                    placeholder="E-mail ou telefone"
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5"><Package className="w-3 h-3" />Quantidade</label>
                  <input type="number" value={form.quantity} min="1" onChange={e => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5"><Calendar className="w-3 h-3" />Data Prevista</label>
                  <input type="date" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Observações</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    rows={2} placeholder="Informações adicionais sobre a doação..."
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground resize-none" />
                </div>
              </div>
              <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
                <button onClick={() => create(form)} disabled={createPending || !form.devolutionId || !form.recipientName}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {createPending ? 'Registrando...' : 'Registrar Doação'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters + List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por instituição ou caso..."
              className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none">
            <option value="">Todos os status</option>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['Caso', 'Instituição', 'Contato', 'Qtd', 'Status', 'Data Prevista', 'Criado Por', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(donations?.data ?? []).map((d: any, i: number) => (
                <motion.tr key={d.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-primary whitespace-nowrap">{d.devolution?.caseNumber ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-foreground font-medium">{d.recipientName}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{d.recipientContact ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{d.quantity}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full border', STATUS_CONFIG[d.status]?.className ?? '')}>
                      {STATUS_CONFIG[d.status]?.label ?? d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {d.scheduledDate ? formatDate(d.scheduledDate) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{d.createdBy?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {d.status === 'PENDING' && canApprove && (
                        <button onClick={() => approve(d.id)}
                          className="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors whitespace-nowrap">
                          Aprovar
                        </button>
                      )}
                      {d.status === 'APPROVED' && canApprove && (
                        <button onClick={() => complete(d.id)}
                          className="px-2.5 py-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors whitespace-nowrap">
                          Concluir
                        </button>
                      )}
                    </div>
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

          {!isLoading && (!donations?.data || donations.data.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Gift className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma doação encontrada.</p>
            </div>
          )}
        </div>

        {donations?.meta && donations.meta.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{donations.meta.total} doações</p>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(donations.meta.totalPages, 5) }, (_, i) => i + 1).map(p => (
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
