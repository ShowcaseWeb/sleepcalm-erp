'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Package, CheckCircle2, Clock, Plus, X,
  Search, MapPin, Phone, User, DollarSign, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { lalamoveAPI } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

const SERVICE_TYPES = ['MOTORCYCLE', 'CAR', 'VAN', 'TRUCK'];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING:          { label: 'Pendente',           className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  REQUESTED:        { label: 'Solicitado',          className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  ASSIGNING_DRIVER: { label: 'Buscando Motorista',  className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  ON_GOING:         { label: 'Em Andamento',        className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  PICKED_UP:        { label: 'Coletado',            className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  COMPLETED:        { label: 'Concluído',           className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  CANCELLED:        { label: 'Cancelado',           className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  REJECTED:         { label: 'Rejeitado',           className: 'bg-red-600/10 text-red-500 border-red-600/20' },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  return (
    <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full border', config.className)}>
      {config.label}
    </span>
  );
}

export default function LalamovePage() {
  const queryClient = useQueryClient();
  const { checkPermission } = useAuthStore();
  const canCreate = checkPermission('CREATE');

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    devolutionId: '', pickupAddress: '', deliveryAddress: '',
    serviceType: 'MOTORCYCLE', notes: '', contactName: '', contactPhone: '',
  });

  const { data: stats } = useQuery({
    queryKey: ['lalamove-stats'],
    queryFn: async () => { const r = await lalamoveAPI.getStats(); return r.data.data; },
    staleTime: 60000,
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['lalamove-list', statusFilter, search, page],
    queryFn: async () => {
      const r = await lalamoveAPI.list({ status: statusFilter, search, page, limit: 15 });
      return r.data;
    },
  });

  const { mutate: createOrder, isPending: createPending } = useMutation({
    mutationFn: (data: any) => lalamoveAPI.create(data),
    onSuccess: () => {
      toast.success('Pedido Lalamove criado com sucesso');
      setShowForm(false);
      setForm({ devolutionId: '', pickupAddress: '', deliveryAddress: '', serviceType: 'MOTORCYCLE', notes: '', contactName: '', contactPhone: '' });
      queryClient.invalidateQueries({ queryKey: ['lalamove-list'] });
      queryClient.invalidateQueries({ queryKey: ['lalamove-stats'] });
    },
    onError: () => toast.error('Erro ao criar pedido'),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      lalamoveAPI.updateStatus(id, { status }),
    onSuccess: () => {
      toast.success('Status atualizado');
      queryClient.invalidateQueries({ queryKey: ['lalamove-list'] });
      queryClient.invalidateQueries({ queryKey: ['lalamove-stats'] });
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const kpis = [
    { label: 'Total Pedidos', value: stats?.total ?? 0, icon: Package, color: 'bg-indigo-500/10 text-indigo-400' },
    { label: 'Em Andamento', value: stats?.ongoing ?? 0, icon: Truck, color: 'bg-yellow-500/10 text-yellow-400' },
    { label: 'Concluídos', value: stats?.completed ?? 0, icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'Custo Total', value: formatCurrency(stats?.totalCost ?? 0), icon: DollarSign, color: 'bg-blue-500/10 text-blue-400' },
    { label: 'Cancelados', value: stats?.cancelled ?? 0, icon: X, color: 'bg-red-500/10 text-red-400' },
    { label: 'Taxa Conclusão', value: `${stats?.completionRate ?? 0}%`, icon: Clock, color: 'bg-purple-500/10 text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Módulo Lalamove</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gestão de coletas e logística reversa</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Solicitar Coleta
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${k.color}`}>
              <k.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{k.label}</p>
              <p className="text-lg font-bold text-foreground">{k.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Completion rate bar */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Taxa de Conclusão</h3>
          <span className="text-2xl font-bold text-emerald-400">{stats?.completionRate ?? 0}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats?.completionRate ?? 0}%` }}
            transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>0%</span>
          <span>100%</span>
        </div>
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
                <h3 className="font-semibold text-foreground">Solicitar Nova Coleta</h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">ID da Devolução *</label>
                  <input value={form.devolutionId} onChange={e => setForm({ ...form, devolutionId: e.target.value })}
                    placeholder="UUID da devolução vinculada"
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> Endereço de Coleta *
                  </label>
                  <textarea value={form.pickupAddress} onChange={e => setForm({ ...form, pickupAddress: e.target.value })}
                    rows={2} placeholder="Rua, número, bairro, cidade, CEP..."
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground resize-none" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> Endereço de Entrega *
                  </label>
                  <textarea value={form.deliveryAddress} onChange={e => setForm({ ...form, deliveryAddress: e.target.value })}
                    rows={2} placeholder="Armazém SleepCalm ou outro destino..."
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground resize-none" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Tipo de Veículo *</label>
                  <select value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50">
                    {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Contato no Local
                  </label>
                  <input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })}
                    placeholder="Nome do contato"
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> Telefone do Contato
                  </label>
                  <input value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Observações para o Motorista</label>
                  <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Instruções especiais de coleta..."
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                </div>
              </div>
              <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={() => createOrder(form)}
                  disabled={createPending || !form.devolutionId || !form.pickupAddress || !form.deliveryAddress}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {createPending ? 'Criando...' : 'Criar Pedido'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por endereço ou caso..."
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['Caso', 'Coleta', 'Entrega', 'Veículo', 'Status', 'Motorista', 'Valor', 'Data', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(orders?.data ?? []).map((o: any) => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-primary whitespace-nowrap">{o.devolution?.caseNumber ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px] truncate" title={o.pickupAddress}>{o.pickupAddress}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px] truncate" title={o.deliveryAddress}>{o.deliveryAddress}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{o.serviceType}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3">
                    {o.driverName ? (
                      <div>
                        <p className="text-xs text-foreground">{o.driverName}</p>
                        {o.driverPhone && <p className="text-[10px] text-muted-foreground">{o.driverPhone}</p>}
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">
                    {o.finalPrice ? formatCurrency(o.finalPrice) : o.quotedPrice ? formatCurrency(o.quotedPrice) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <StatusActionButton order={o} onUpdate={updateStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && (!orders?.data || orders.data.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Truck className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum pedido Lalamove encontrado.</p>
            </div>
          )}
        </div>

        {orders?.meta && orders.meta.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {orders.meta.total} pedidos · Página {orders.meta.page} de {orders.meta.totalPages}
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(orders.meta.totalPages, 5) }, (_, i) => i + 1).map(p => (
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

function StatusActionButton({ order, onUpdate }: { order: any; onUpdate: any }) {
  const [open, setOpen] = useState(false);
  const nextStatuses: Record<string, string[]> = {
    PENDING: ['REQUESTED', 'CANCELLED'],
    REQUESTED: ['ASSIGNING_DRIVER', 'CANCELLED'],
    ASSIGNING_DRIVER: ['ON_GOING', 'CANCELLED'],
    ON_GOING: ['PICKED_UP', 'CANCELLED'],
    PICKED_UP: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
    REJECTED: [],
  };
  const next = nextStatuses[order.status] ?? [];
  if (next.length === 0) return null;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground hover:bg-muted transition-colors">
        <RefreshCw className="w-3 h-3" /> Atualizar
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl min-w-[140px] py-1"
          >
            {next.map(st => (
              <button key={st} onClick={() => { onUpdate({ id: order.id, status: st }); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors text-foreground">
                {STATUS_CONFIG[st]?.label ?? st}
              </button>
            ))}
            <button onClick={() => setOpen(false)} className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
