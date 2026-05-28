'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Plus, X, Search, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { carrierAPI } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

interface CarrierForm {
  name: string; code: string; email: string; phone: string;
  website: string; trackingUrl: string; notes: string;
}

const EMPTY: CarrierForm = { name: '', code: '', email: '', phone: '', website: '', trackingUrl: '', notes: '' };

export default function CarriersPage() {
  const queryClient = useQueryClient();
  const { checkPermission } = useAuthStore();
  const canManage = checkPermission('MANAGE_CARRIERS');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<CarrierForm>(EMPTY);

  const { data: carriers, isLoading } = useQuery({
    queryKey: ['carriers', search, page],
    queryFn: async () => { const r = await carrierAPI.list({ search, page, limit: 15 }); return r.data; },
  });

  const { mutate: create, isPending: cp } = useMutation({
    mutationFn: (d: any) => carrierAPI.create(d),
    onSuccess: () => { toast.success('Transportadora criada'); reset(); queryClient.invalidateQueries({ queryKey: ['carriers'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Erro'),
  });

  const { mutate: update, isPending: up } = useMutation({
    mutationFn: ({ id, d }: any) => carrierAPI.update(id, d),
    onSuccess: () => { toast.success('Atualizado'); reset(); queryClient.invalidateQueries({ queryKey: ['carriers'] }); },
    onError: () => toast.error('Erro ao atualizar'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => carrierAPI.remove(id),
    onSuccess: () => { toast.success('Removida'); queryClient.invalidateQueries({ queryKey: ['carriers'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Erro'),
  });

  const { mutate: toggle } = useMutation({
    mutationFn: ({ id, active }: any) => carrierAPI.update(id, { active }),
    onSuccess: () => { toast.success('Status alterado'); queryClient.invalidateQueries({ queryKey: ['carriers'] }); },
  });

  const reset = () => { setShowForm(false); setEditingId(null); setForm(EMPTY); };

  const openEdit = (c: any) => {
    setForm({ name: c.name, code: c.code ?? '', email: c.email ?? '', phone: c.phone ?? '',
      website: c.website ?? '', trackingUrl: c.trackingUrl ?? '', notes: c.notes ?? '' });
    setEditingId(c.id);
    setShowForm(true);
  };

  const fields: { key: keyof CarrierForm; label: string; placeholder: string }[] = [
    { key: 'name', label: 'Nome *', placeholder: 'Ex: Correios, Jadlog...' },
    { key: 'code', label: 'Código', placeholder: 'Código interno' },
    { key: 'email', label: 'E-mail', placeholder: 'contato@transportadora.com' },
    { key: 'phone', label: 'Telefone', placeholder: '(11) 3000-0000' },
    { key: 'website', label: 'Website', placeholder: 'https://...' },
    { key: 'trackingUrl', label: 'URL de Rastreio', placeholder: 'https://rastreio.com/{code}' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transportadoras</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{carriers?.meta?.total ?? 0} transportadoras cadastradas</p>
        </div>
        {canManage && (
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Nova Transportadora
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{editingId ? 'Editar Transportadora' : 'Nova Transportadora'}</h3>
                <button onClick={reset}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fields.map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-muted-foreground mb-1.5 block">{f.label}</label>
                    <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                  </div>
                ))}
                <div className="col-span-full">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Observações</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                    placeholder="Observações..."
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 resize-none placeholder-muted-foreground" />
                </div>
              </div>
              <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
                <button onClick={reset} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted">Cancelar</button>
                <button onClick={() => editingId ? update({ id: editingId, d: form }) : create(form)}
                  disabled={cp || up || !form.name}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {(cp || up) ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar transportadora..."
              className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['Nome', 'Código', 'Contato', 'Rastreio', 'Devoluções', 'Status', 'Cadastro', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(carriers?.data ?? []).map((c: any, i: number) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{c.code ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div>{c.email && <p>{c.email}</p>}{c.phone && <p>{c.phone}</p>}</div>
                  </td>
                  <td className="px-4 py-3">
                    {c.trackingUrl ? (
                      <a href={c.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Ver link</a>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{c._count?.devolutions ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${c.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {c.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    {canManage && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(c)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => toggle({ id: c.id, active: !c.active })} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors">
                          {c.active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => { if (window.confirm('Remover?')) remove(c.id); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {isLoading && <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
          {!isLoading && (!carriers?.data || carriers.data.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Truck className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma transportadora encontrada.</p>
            </div>
          )}
        </div>

        {carriers?.meta && carriers.meta.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{carriers.meta.total} transportadoras</p>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(carriers.meta.totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={cn('w-7 h-7 rounded text-xs font-medium transition-colors', page === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
