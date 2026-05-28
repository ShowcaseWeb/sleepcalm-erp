'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, X, Search, Edit, Trash2, ToggleLeft, ToggleRight, Phone, Mail, Globe } from 'lucide-react';
import { supplierAPI } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

interface SupplierForm {
  name: string; tradeName: string; cnpj: string; email: string;
  phone: string; website: string; address: string; city: string;
  state: string; country: string; contactName: string; notes: string;
}

const EMPTY: SupplierForm = {
  name: '', tradeName: '', cnpj: '', email: '', phone: '',
  website: '', address: '', city: '', state: '', country: 'Brasil',
  contactName: '', notes: '',
};

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const { checkPermission } = useAuthStore();
  const canManage = checkPermission('MANAGE_SUPPLIERS');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<SupplierForm>(EMPTY);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', search, page],
    queryFn: async () => {
      const r = await supplierAPI.list({ search, page, limit: 15 });
      return r.data;
    },
  });

  const { mutate: create, isPending: createPending } = useMutation({
    mutationFn: (data: any) => supplierAPI.create(data),
    onSuccess: () => {
      toast.success('Fornecedor criado'); reset();
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Erro ao criar'),
  });

  const { mutate: update, isPending: updatePending } = useMutation({
    mutationFn: ({ id, data }: any) => supplierAPI.update(id, data),
    onSuccess: () => {
      toast.success('Fornecedor atualizado'); reset();
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: () => toast.error('Erro ao atualizar'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => supplierAPI.remove(id),
    onSuccess: () => { toast.success('Fornecedor removido'); queryClient.invalidateQueries({ queryKey: ['suppliers'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Erro ao remover'),
  });

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => supplierAPI.update(id, { active }),
    onSuccess: () => { toast.success('Status alterado'); queryClient.invalidateQueries({ queryKey: ['suppliers'] }); },
  });

  const reset = () => { setShowForm(false); setEditingId(null); setForm(EMPTY); };

  const openEdit = (s: any) => {
    setForm({ name: s.name, tradeName: s.tradeName ?? '', cnpj: s.cnpj ?? '', email: s.email ?? '',
      phone: s.phone ?? '', website: s.website ?? '', address: s.address ?? '',
      city: s.city ?? '', state: s.state ?? '', country: s.country ?? 'Brasil',
      contactName: s.contactName ?? '', notes: s.notes ?? '' });
    setEditingId(s.id);
    setShowForm(true);
  };

  const F = ({ label, fkey, placeholder, type = 'text', span = 1 }: any) => (
    <div className={span === 2 ? 'sm:col-span-2 lg:col-span-3' : span === 'full' ? 'col-span-full' : ''}>
      <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
      <input type={type} value={(form as any)[fkey]} onChange={e => setForm({ ...form, [fkey]: e.target.value })}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fornecedores</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{suppliers?.meta?.total ?? 0} fornecedores cadastrados</p>
        </div>
        {canManage && (
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Novo Fornecedor
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
                <button onClick={reset}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <F label="Razão Social *" fkey="name" placeholder="Razão Social" />
                <F label="Nome Fantasia" fkey="tradeName" placeholder="Nome comercial" />
                <F label="CNPJ" fkey="cnpj" placeholder="00.000.000/0000-00" />
                <F label="E-mail" fkey="email" placeholder="contato@empresa.com" type="email" />
                <F label="Telefone" fkey="phone" placeholder="(11) 3000-0000" />
                <F label="Website" fkey="website" placeholder="https://empresa.com.br" />
                <F label="Contato Principal" fkey="contactName" placeholder="Nome do responsável" />
                <F label="Endereço" fkey="address" placeholder="Rua, número, complemento" />
                <F label="Cidade" fkey="city" placeholder="São Paulo" />
                <F label="Estado" fkey="state" placeholder="SP" />
                <F label="País" fkey="country" placeholder="Brasil" />
                <div className="col-span-full">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Observações</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    rows={2} placeholder="Observações sobre o fornecedor..."
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 resize-none placeholder-muted-foreground" />
                </div>
              </div>
              <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
                <button onClick={reset} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted">Cancelar</button>
                <button onClick={() => editingId ? update({ id: editingId, data: form }) : create(form)}
                  disabled={createPending || updatePending || !form.name}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {(createPending || updatePending) ? 'Salvando...' : editingId ? 'Salvar' : 'Criar Fornecedor'}
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
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar fornecedor..."
              className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['Nome', 'CNPJ', 'Contato', 'Cidade', 'Devolucões', 'Status', 'Cadastro', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(suppliers?.data ?? []).map((s: any, i: number) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      {s.tradeName && <p className="text-[10px] text-muted-foreground">{s.tradeName}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{s.cnpj ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {s.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{s.email}</p>}
                      {s.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{s.phone}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.city ? `${s.city}/${s.state}` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{s._count?.devolutions ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${s.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {s.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    {canManage && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(s)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => toggleActive({ id: s.id, active: !s.active })} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors">
                          {s.active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => { if (window.confirm('Remover fornecedor?')) remove(s.id); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {isLoading && <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
          {!isLoading && (!suppliers?.data || suppliers.data.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum fornecedor encontrado.</p>
            </div>
          )}
        </div>

        {suppliers?.meta && suppliers.meta.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{suppliers.meta.total} fornecedores</p>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(suppliers.meta.totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={cn('w-7 h-7 rounded text-xs font-medium transition-colors', page === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
