'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, X, Search, Edit, Trash2, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react';
import { skuAPI } from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

const CATEGORIES = ['MATTRESS', 'PILLOW', 'TOPPER', 'SHEET', 'COMFORTER', 'PROTECTOR', 'BASE', 'ACCESSORY', 'OTHER'];
const CATEGORY_LABELS: Record<string, string> = {
  MATTRESS: 'Colchão', PILLOW: 'Travesseiro', TOPPER: 'Pillow Top',
  SHEET: 'Lençol', COMFORTER: 'Edredom', PROTECTOR: 'Protetor',
  BASE: 'Base', ACCESSORY: 'Acessório', OTHER: 'Outro',
};

interface SKUForm {
  code: string;
  name: string;
  description: string;
  category: string;
  price: string;
  weight: string;
  width: string;
  height: string;
  depth: string;
}

const EMPTY_FORM: SKUForm = {
  code: '', name: '', description: '', category: 'MATTRESS',
  price: '', weight: '', width: '', height: '', depth: '',
};

export default function SKUsPage() {
  const queryClient = useQueryClient();
  const { checkPermission } = useAuthStore();
  const canManage = checkPermission('MANAGE_SKUS');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<SKUForm>(EMPTY_FORM);

  const { data: skus, isLoading } = useQuery({
    queryKey: ['skus', search, categoryFilter, activeFilter, page],
    queryFn: async () => {
      const r = await skuAPI.list({ search, category: categoryFilter, active: activeFilter, page, limit: 15 });
      return r.data;
    },
  });

  const { mutate: create, isPending: createPending } = useMutation({
    mutationFn: (data: any) => skuAPI.create(data),
    onSuccess: () => {
      toast.success('SKU criado com sucesso');
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ['skus'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Erro ao criar SKU'),
  });

  const { mutate: update, isPending: updatePending } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => skuAPI.update(id, data),
    onSuccess: () => {
      toast.success('SKU atualizado');
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ['skus'] });
    },
    onError: () => toast.error('Erro ao atualizar SKU'),
  });

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => skuAPI.update(id, { active }),
    onSuccess: (_, vars) => {
      toast.success(vars.active ? 'SKU ativado' : 'SKU desativado');
      queryClient.invalidateQueries({ queryKey: ['skus'] });
    },
    onError: () => toast.error('Erro ao alterar status'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => skuAPI.remove(id),
    onSuccess: () => {
      toast.success('SKU removido');
      queryClient.invalidateQueries({ queryKey: ['skus'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Erro ao remover SKU'),
  });

  const openEdit = (sku: any) => {
    setForm({
      code: sku.code,
      name: sku.name,
      description: sku.description ?? '',
      category: sku.category,
      price: sku.price?.toString() ?? '',
      weight: sku.weight?.toString() ?? '',
      width: sku.width?.toString() ?? '',
      height: sku.height?.toString() ?? '',
      depth: sku.depth?.toString() ?? '',
    });
    setEditingId(sku.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    const data = {
      ...form,
      price: form.price ? parseFloat(form.price) : undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      width: form.width ? parseFloat(form.width) : undefined,
      height: form.height ? parseFloat(form.height) : undefined,
      depth: form.depth ? parseFloat(form.depth) : undefined,
    };
    if (editingId) {
      update({ id: editingId, data });
    } else {
      create(data);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de SKUs</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Catálogo de produtos SleepCalm — {skus?.meta?.total ?? 0} produtos cadastrados</p>
        </div>
        {canManage && (
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Novo SKU
          </button>
        )}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{editingId ? 'Editar SKU' : 'Novo SKU'}</h3>
                <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'code', label: 'Código *', placeholder: 'Ex: SC-MAT-001' },
                  { key: 'name', label: 'Nome *', placeholder: 'Nome do produto' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-muted-foreground mb-1.5 block">{f.label}</label>
                    <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Categoria *</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50">
                    {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Descrição</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={2} placeholder="Descrição do produto..."
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground resize-none" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Preço (R$)</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    step="0.01" min="0" placeholder="0.00"
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Peso (kg)</label>
                  <input type="number" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })}
                    step="0.1" min="0" placeholder="0.0"
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                </div>
                {[
                  { key: 'width', label: 'Largura (cm)' },
                  { key: 'height', label: 'Altura (cm)' },
                  { key: 'depth', label: 'Profundidade (cm)' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-muted-foreground mb-1.5 block">{f.label}</label>
                    <input type="number" value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      step="0.1" min="0" placeholder="0"
                      className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
                <button onClick={handleCancel} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
                <button onClick={handleSubmit} disabled={createPending || updatePending || !form.code || !form.name}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {(createPending || updatePending) ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Criar SKU'}
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
              placeholder="Buscar por código ou nome..."
              className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
          </div>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none">
            <option value="">Todas as categorias</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
          <select value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none">
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['Código', 'Nome', 'Categoria', 'Preço', 'Peso', 'Devoluções', 'Status', 'Cadastro', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(skus?.data ?? []).map((sku: any, i: number) => (
                <motion.tr key={sku.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-primary">{sku.code}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{sku.name}</p>
                      {sku.description && <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{sku.description}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                      {CATEGORY_LABELS[sku.category] ?? sku.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{sku.price ? formatCurrency(sku.price) : '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{sku.weight ? `${sku.weight}kg` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{sku._count?.items ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${sku.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {sku.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(sku.createdAt)}</td>
                  <td className="px-4 py-3">
                    {canManage && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(sku)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleActive({ id: sku.id, active: !sku.active })}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors">
                          {sku.active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Remover SKU ${sku.code}?`)) remove(sku.id);
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
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

          {!isLoading && (!skus?.data || skus.data.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum SKU encontrado.</p>
            </div>
          )}
        </div>

        {skus?.meta && skus.meta.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{skus.meta.total} SKUs · Pág. {skus.meta.page} de {skus.meta.totalPages}</p>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(skus.meta.totalPages, 7) }, (_, i) => i + 1).map(p => (
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
