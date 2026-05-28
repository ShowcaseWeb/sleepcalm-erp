'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Search } from 'lucide-react';
import { devolutionAPI, skuAPI, carrierAPI, supplierAPI, userAPI } from '@/lib/api';
import { toast } from 'sonner';

interface Props {
  devolutionId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CHANNELS = [
  { value: 'SLEEPCALM_SITE', label: 'Site SleepCalm' },
  { value: 'MERCADO_LIVRE', label: 'Mercado Livre' },
  { value: 'SHOPEE', label: 'Shopee' },
  { value: 'AMAZON', label: 'Amazon' },
  { value: 'MAGALU', label: 'Magalu' },
  { value: 'VIA_VAREJO', label: 'Via Varejo' },
  { value: 'AMERICANAS', label: 'Americanas' },
  { value: 'OUTROS', label: 'Outros' },
];

const TYPES = [
  { value: 'FULL_REFUND', label: 'Reembolso Integral' },
  { value: 'PARTIAL_REFUND', label: 'Reembolso Parcial' },
  { value: 'EXCHANGE', label: 'Troca' },
  { value: 'COLLECTION', label: 'Coleta' },
  { value: 'RETURN_TO_FACTORY', label: 'Devolução para Fábrica' },
  { value: 'REUSE', label: 'Reaproveitamento' },
  { value: 'DONATION', label: 'Doação' },
  { value: 'DISPOSAL', label: 'Descarte' },
  { value: 'RESEND', label: 'Reenvio' },
];

const REASONS = [
  'Afundamento do colchão',
  'Defeito estrutural',
  'Rasgo no tecido',
  'Manchas de fábrica',
  'Odor forte',
  'Produto diferente do pedido',
  'Tamanho incorreto',
  'Produto avariado no transporte',
  'Embalagem danificada',
  'Conforto inadequado',
  'Densidade incorreta',
  'Produto não atendeu expectativas',
  'Desistência da compra',
  'Compra duplicada',
  'Defeito de costura',
  'Problema na espuma',
  'Problema nas molas',
];

const PRIORITIES = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'CRITICAL', label: 'Crítica' },
];

export function DevolutionModal({ devolutionId, onClose, onSuccess }: Props) {
  const isEdit = !!devolutionId;
  const [activeTab, setActiveTab] = useState('customer');
  const [skuSearch, setSkuSearch] = useState('');

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCpf: '',
    orderNumber: '',
    saleChannel: 'SLEEPCALM_SITE',
    type: 'FULL_REFUND',
    priority: 'MEDIUM',
    reasonCategory: '',
    reasonDetail: '',
    customerDescription: '',
    carrierId: '',
    supplierId: '',
    trackingCode: '',
    assignedToId: '',
    slaHours: '72',
    internalNotes: '',
    items: [{ skuCode: '', productName: '', quantity: 1, unitValue: 0 }],
  });

  const { data: existingDev } = useQuery({
    queryKey: ['devolution', devolutionId],
    queryFn: async () => { const r = await devolutionAPI.getById(devolutionId!); return r.data.data; },
    enabled: !!devolutionId,
  });

  const { data: skuResults } = useQuery({
    queryKey: ['sku-search', skuSearch],
    queryFn: async () => { const r = await skuAPI.search(skuSearch); return r.data.data; },
    enabled: skuSearch.length >= 2,
  });

  const { data: carriers } = useQuery({
    queryKey: ['carriers-select'],
    queryFn: async () => { const r = await carrierAPI.list({ limit: 100 }); return r.data.data; },
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-select'],
    queryFn: async () => { const r = await supplierAPI.list({ limit: 100 }); return r.data.data; },
  });

  const { data: users } = useQuery({
    queryKey: ['users-select'],
    queryFn: async () => { const r = await userAPI.list({ limit: 100 }); return r.data.data; },
  });

  useEffect(() => {
    if (existingDev) {
      setForm({
        customerName: existingDev.customer?.name || '',
        customerEmail: existingDev.customer?.email || '',
        customerPhone: existingDev.customer?.phone || '',
        customerCpf: existingDev.customer?.cpf || '',
        orderNumber: existingDev.orderNumber || '',
        saleChannel: existingDev.saleChannel || 'SLEEPCALM_SITE',
        type: existingDev.type || 'FULL_REFUND',
        priority: existingDev.priority || 'MEDIUM',
        reasonCategory: existingDev.reasonCategory || '',
        reasonDetail: existingDev.reasonDetail || '',
        customerDescription: existingDev.customerDescription || '',
        carrierId: existingDev.carrierId || '',
        supplierId: existingDev.supplierId || '',
        trackingCode: existingDev.trackingCode || '',
        assignedToId: existingDev.assignedToId || '',
        slaHours: String(existingDev.slaHours || 72),
        internalNotes: existingDev.internalNotes || '',
        items: existingDev.items?.length > 0 ? existingDev.items.map((i: any) => ({
          skuCode: i.skuCode,
          productName: i.productName,
          quantity: i.quantity,
          unitValue: parseFloat(i.unitValue),
        })) : [{ skuCode: '', productName: '', quantity: 1, unitValue: 0 }],
      });
    }
  }, [existingDev]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) return devolutionAPI.update(devolutionId!, data);
      return devolutionAPI.create(data);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Devolução atualizada!' : 'Devolução criada com sucesso!');
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Erro ao salvar devolução.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderNumber || !form.reasonCategory || !form.saleChannel || !form.type) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    if (form.items.some(i => !i.skuCode || !i.productName || !i.unitValue)) {
      toast.error('Preencha todos os itens corretamente.');
      return;
    }
    mutation.mutate(form);
  };

  const addItem = () => setForm(f => ({
    ...f,
    items: [...f.items, { skuCode: '', productName: '', quantity: 1, unitValue: 0 }],
  }));

  const removeItem = (idx: number) => setForm(f => ({
    ...f,
    items: f.items.filter((_, i) => i !== idx),
  }));

  const updateItem = (idx: number, field: string, value: any) => setForm(f => ({
    ...f,
    items: f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item),
  }));

  const selectSku = (sku: any, idx: number) => {
    updateItem(idx, 'skuCode', sku.code);
    updateItem(idx, 'productName', sku.name);
    updateItem(idx, 'unitValue', parseFloat(sku.unitValue));
    setSkuSearch('');
  };

  const totalValue = form.items.reduce((s, i) => s + (parseFloat(String(i.unitValue)) || 0) * (parseInt(String(i.quantity)) || 1), 0);

  const tabs = [
    { id: 'customer', label: 'Cliente' },
    { id: 'order', label: 'Pedido' },
    { id: 'items', label: 'Produtos' },
    { id: 'logistics', label: 'Logística' },
    { id: 'notes', label: 'Observações' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card border border-border rounded-2xl shadow-premium w-full max-w-3xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isEdit ? 'Editar Devolução' : 'Nova Devolução'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEdit ? `Caso ${existingDev?.caseNumber}` : 'Preencha os dados do processo de devolução'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 flex items-center gap-1 border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">

            {/* ABA: Cliente */}
            {activeTab === 'customer' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Nome do Cliente *</label>
                    <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Nome completo" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">CPF</label>
                    <input value={form.customerCpf} onChange={e => setForm(f => ({ ...f, customerCpf: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="000.000.000-00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">E-mail</label>
                    <input type="email" value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="cliente@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Telefone</label>
                    <input value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="(11) 99999-0000" />
                  </div>
                </div>
              </div>
            )}

            {/* ABA: Pedido */}
            {activeTab === 'order' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Nº do Pedido *</label>
                    <input value={form.orderNumber} onChange={e => setForm(f => ({ ...f, orderNumber: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="PED-XXXXXXXX" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Canal de Venda *</label>
                    <select value={form.saleChannel} onChange={e => setForm(f => ({ ...f, saleChannel: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Tipo de Processo *</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Prioridade</label>
                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Categoria do Motivo *</label>
                    <select value={form.reasonCategory} onChange={e => setForm(f => ({ ...f, reasonCategory: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" required>
                      <option value="">Selecione o motivo...</option>
                      {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">SLA (horas)</label>
                    <select value={form.slaHours} onChange={e => setForm(f => ({ ...f, slaHours: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option value="24">24h (Crítico)</option>
                      <option value="48">48h (Alto)</option>
                      <option value="72">72h (Padrão)</option>
                      <option value="120">120h (5 dias)</option>
                      <option value="168">168h (7 dias)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Detalhes do Motivo</label>
                    <textarea value={form.reasonDetail} onChange={e => setForm(f => ({ ...f, reasonDetail: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                      rows={3} placeholder="Descreva o problema em detalhes..." />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Descrição do Cliente</label>
                    <textarea value={form.customerDescription} onChange={e => setForm(f => ({ ...f, customerDescription: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                      rows={2} placeholder="Relato do cliente..." />
                  </div>
                </div>
              </div>
            )}

            {/* ABA: Produtos */}
            {activeTab === 'items' && (
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Buscar SKU</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={skuSearch}
                      onChange={e => setSkuSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Digite código ou nome do produto..."
                    />
                  </div>
                  {skuResults && skuResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-premium overflow-hidden">
                      {skuResults.map((sku: any) => (
                        <button
                          key={sku.id}
                          type="button"
                          onClick={() => selectSku(sku, form.items.length - 1)}
                          className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium">{sku.code}</p>
                            <p className="text-xs text-muted-foreground">{sku.name}</p>
                          </div>
                          <span className="text-sm font-medium text-primary">R$ {parseFloat(sku.unitValue).toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-3 bg-muted/30 rounded-xl border border-border">
                      <div className="col-span-3">
                        <label className="text-xs text-muted-foreground mb-1 block">Código SKU</label>
                        <input value={item.skuCode} onChange={e => updateItem(idx, 'skuCode', e.target.value)}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                          placeholder="SC-XXXX" />
                      </div>
                      <div className="col-span-4">
                        <label className="text-xs text-muted-foreground mb-1 block">Nome do Produto</label>
                        <input value={item.productName} onChange={e => updateItem(idx, 'productName', e.target.value)}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                          placeholder="Nome do produto" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground mb-1 block">Qtd</label>
                        <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground mb-1 block">Valor Unit.</label>
                        <input type="number" step="0.01" min="0" value={item.unitValue} onChange={e => updateItem(idx, 'unitValue', parseFloat(e.target.value))}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      </div>
                      <div className="col-span-1 flex items-end pb-0.5">
                        <button type="button" onClick={() => removeItem(idx)} disabled={form.items.length === 1}
                          className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addItem}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
                    <Plus className="w-4 h-4" />
                    Adicionar item
                  </button>
                </div>

                <div className="flex justify-end p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                    <p className="text-xl font-bold text-primary">
                      R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ABA: Logística */}
            {activeTab === 'logistics' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Transportadora</label>
                    <select value={form.carrierId} onChange={e => setForm(f => ({ ...f, carrierId: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option value="">Selecione...</option>
                      {(carriers || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Código de Rastreio</label>
                    <input value={form.trackingCode} onChange={e => setForm(f => ({ ...f, trackingCode: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Código de rastreamento" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Fornecedor</label>
                    <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option value="">Selecione...</option>
                      {(suppliers || []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Responsável</label>
                    <select value={form.assignedToId} onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option value="">Selecione...</option>
                      {(users || []).map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ABA: Observações */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Observações Internas</label>
                  <textarea value={form.internalNotes} onChange={e => setForm(f => ({ ...f, internalNotes: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                    rows={6} placeholder="Observações internas (visíveis apenas para a equipe)..." />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-2">
              {tabs.map((tab, i) => (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                  className={`w-2 h-2 rounded-full transition-colors ${activeTab === tab.id ? 'bg-primary' : 'bg-border'}`} />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={mutation.isPending}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2">
                {mutation.isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isEdit ? 'Salvar Alterações' : 'Criar Devolução'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
