'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { devolutionAPI, skuAPI, carrierAPI, supplierAPI } from '@/lib/api';

const CHANNELS = ['SLEEPCALM_SITE','MERCADO_LIVRE','SHOPEE','AMAZON','MAGALU','VIA_VAREJO','AMERICANAS','OUTROS'];
const TYPES = ['FULL_REFUND','PARTIAL_REFUND','EXCHANGE','COLLECTION','RETURN_TO_FACTORY','REUSE','DONATION','DISPOSAL','RESEND'];
const PRIORITIES = ['LOW','MEDIUM','HIGH','CRITICAL'];
const REASONS = ['Produto Defeituoso','Produto Errado','Produto Danificado','Insatisfação','Arrependimento','Técnico'];

const TYPE_LABELS: Record<string,string> = { FULL_REFUND:'Reembolso Integral', PARTIAL_REFUND:'Reembolso Parcial', EXCHANGE:'Troca', COLLECTION:'Coleta', RETURN_TO_FACTORY:'Devolução Fábrica', REUSE:'Reaproveitamento', DONATION:'Doação', DISPOSAL:'Descarte', RESEND:'Reenvio' };
const PRIORITY_LABELS: Record<string,string> = { LOW:'Baixa', MEDIUM:'Média', HIGH:'Alta', CRITICAL:'Crítica' };
const CHANNEL_LABELS: Record<string,string> = { SLEEPCALM_SITE:'Site SleepCalm', MERCADO_LIVRE:'Mercado Livre', SHOPEE:'Shopee', AMAZON:'Amazon', MAGALU:'Magalu', VIA_VAREJO:'Via Varejo', AMERICANAS:'Americanas', OUTROS:'Outros' };

export default function NewDevolutionPage() {
  const router = useRouter();
  const [skuSearch, setSkuSearch] = useState('');

  const [form, setForm] = useState({
    customerName: '', customerEmail: '', customerPhone: '', customerCpf: '',
    orderNumber: '', saleChannel: 'SLEEPCALM_SITE', orderDate: '',
    type: 'FULL_REFUND', priority: 'MEDIUM',
    reasonCategory: 'Produto Defeituoso', reasonDetail: '', customerDescription: '',
    supplierId: '', carrierId: '', trackingCode: '',
    slaHours: '72', assignedToId: '', internalNotes: '',
    items: [{ skuCode: '', productName: '', quantity: 1, unitValue: '', condition: '', notes: '' }],
  });

  const { data: skuResults } = useQuery({
    queryKey: ['sku-search', skuSearch],
    queryFn: async () => {
      if (skuSearch.length < 2) return [];
      const res = await skuAPI.search(skuSearch);
      return res.data.data;
    },
    enabled: skuSearch.length >= 2,
  });

  const { data: carriersData } = useQuery({
    queryKey: ['carriers-select'],
    queryFn: async () => { const r = await carrierAPI.list({ limit: 100 }); return r.data.data; },
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-select'],
    queryFn: async () => { const r = await supplierAPI.list({ limit: 100 }); return r.data.data; },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => devolutionAPI.create(data),
    onSuccess: (res) => {
      toast.success(`Devolução ${res.data.data.caseNumber} criada com sucesso!`);
      router.push(`/dashboard/devolutions/${res.data.data.id}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Erro ao criar devolução.');
    },
  });

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { skuCode:'', productName:'', quantity:1, unitValue:'', condition:'', notes:'' }] }));
  const removeItem = (i: number) => setForm(p => ({ ...p, items: p.items.filter((_,idx) => idx !== i) }));
  const updateItem = (i: number, field: string, value: any) => setForm(p => ({ ...p, items: p.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.orderNumber || !form.items[0].skuCode) {
      toast.error('Preencha os campos obrigatórios: Nome do cliente, Pedido e SKU.');
      return;
    }
    mutation.mutate({ ...form, items: form.items.map(item => ({ ...item, quantity: parseInt(String(item.quantity)), unitValue: parseFloat(String(item.unitValue)) })) });
  };

  const InputClass = "w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";
  const LabelClass = "block text-xs font-medium text-muted-foreground mb-1.5";
  const SectionClass = "bg-card border border-border rounded-xl p-5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/devolutions" className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nova Devolução</h1>
            <p className="text-muted-foreground text-sm">Preencha todos os dados do processo</p>
          </div>
        </div>
        <button type="submit" disabled={mutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-glow-sm disabled:opacity-60">
          <Save className="w-4 h-4" />
          {mutation.isPending ? 'Salvando...' : 'Salvar Devolução'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cliente */}
        <div className={SectionClass}>
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary/15 text-primary rounded-full flex items-center justify-center text-xs font-bold">1</span>
            Dados do Cliente
          </h2>
          <div className="space-y-3">
            <div><label className={LabelClass}>Nome do Cliente *</label>
              <input required className={InputClass} value={form.customerName} onChange={e => setForm(p=>({...p, customerName:e.target.value}))} placeholder="Nome completo" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LabelClass}>E-mail</label>
                <input type="email" className={InputClass} value={form.customerEmail} onChange={e => setForm(p=>({...p, customerEmail:e.target.value}))} placeholder="cliente@email.com" /></div>
              <div><label className={LabelClass}>Telefone</label>
                <input className={InputClass} value={form.customerPhone} onChange={e => setForm(p=>({...p, customerPhone:e.target.value}))} placeholder="(11) 99999-9999" /></div>
            </div>
            <div><label className={LabelClass}>CPF</label>
              <input className={InputClass} value={form.customerCpf} onChange={e => setForm(p=>({...p, customerCpf:e.target.value}))} placeholder="000.000.000-00" /></div>
          </div>
        </div>

        {/* Pedido */}
        <div className={SectionClass}>
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary/15 text-primary rounded-full flex items-center justify-center text-xs font-bold">2</span>
            Dados do Pedido
          </h2>
          <div className="space-y-3">
            <div><label className={LabelClass}>Número do Pedido *</label>
              <input required className={InputClass} value={form.orderNumber} onChange={e => setForm(p=>({...p, orderNumber:e.target.value}))} placeholder="PED-123456" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LabelClass}>Canal de Venda *</label>
                <select required className={InputClass} value={form.saleChannel} onChange={e => setForm(p=>({...p, saleChannel:e.target.value}))}>
                  {CHANNELS.map(c => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}
                </select></div>
              <div><label className={LabelClass}>Data do Pedido</label>
                <input type="date" className={InputClass} value={form.orderDate} onChange={e => setForm(p=>({...p, orderDate:e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LabelClass}>Tipo de Processo *</label>
                <select required className={InputClass} value={form.type} onChange={e => setForm(p=>({...p, type:e.target.value}))}>
                  {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select></div>
              <div><label className={LabelClass}>Prioridade</label>
                <select className={InputClass} value={form.priority} onChange={e => setForm(p=>({...p, priority:e.target.value}))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                </select></div>
            </div>
          </div>
        </div>
      </div>

      {/* Produtos / Items */}
      <div className={SectionClass}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <span className="w-6 h-6 bg-primary/15 text-primary rounded-full flex items-center justify-center text-xs font-bold">3</span>
            Produtos
          </h2>
          <button type="button" onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Adicionar Item
          </button>
        </div>

        {/* Busca SKU */}
        <div className="mb-4 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input className={`${InputClass} pl-10`} value={skuSearch} onChange={e => setSkuSearch(e.target.value)} placeholder="Buscar SKU para autocomplete..." />
          </div>
          {skuResults && skuResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-xl shadow-premium max-h-48 overflow-y-auto">
              {skuResults.map((sku: any) => (
                <button key={sku.id} type="button"
                  onClick={() => {
                    updateItem(0, 'skuCode', sku.code);
                    updateItem(0, 'productName', sku.name);
                    updateItem(0, 'unitValue', sku.unitValue);
                    setSkuSearch('');
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left">
                  <div>
                    <span className="font-mono text-primary text-xs">{sku.code}</span>
                    <span className="ml-3 text-foreground">{sku.name}</span>
                  </div>
                  <span className="text-muted-foreground font-medium">R$ {sku.unitValue}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {form.items.map((item, i) => (
            <div key={i} className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
                {i > 0 && <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><label className={LabelClass}>Código SKU *</label>
                  <input required className={InputClass} value={item.skuCode} onChange={e => updateItem(i, 'skuCode', e.target.value)} placeholder="SC-COLCHAO-..." /></div>
                <div className="md:col-span-2"><label className={LabelClass}>Nome do Produto *</label>
                  <input required className={InputClass} value={item.productName} onChange={e => updateItem(i, 'productName', e.target.value)} placeholder="Nome do produto" /></div>
                <div><label className={LabelClass}>Qtd *</label>
                  <input required type="number" min="1" className={InputClass} value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} /></div>
                <div><label className={LabelClass}>Valor Unitário *</label>
                  <input required type="number" step="0.01" className={InputClass} value={item.unitValue} onChange={e => updateItem(i, 'unitValue', e.target.value)} placeholder="0.00" /></div>
                <div><label className={LabelClass}>Condição</label>
                  <input className={InputClass} value={item.condition} onChange={e => updateItem(i, 'condition', e.target.value)} placeholder="Ex: Defeituoso" /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Motivo e Logística */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className={SectionClass}>
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary/15 text-primary rounded-full flex items-center justify-center text-xs font-bold">4</span>
            Motivo da Devolução
          </h2>
          <div className="space-y-3">
            <div><label className={LabelClass}>Categoria do Motivo *</label>
              <select required className={InputClass} value={form.reasonCategory} onChange={e => setForm(p=>({...p, reasonCategory:e.target.value}))}>
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select></div>
            <div><label className={LabelClass}>Detalhe do Motivo</label>
              <input className={InputClass} value={form.reasonDetail} onChange={e => setForm(p=>({...p, reasonDetail:e.target.value}))} placeholder="Detalhe específico" /></div>
            <div><label className={LabelClass}>Descrição do Cliente</label>
              <textarea rows={3} className={InputClass} value={form.customerDescription} onChange={e => setForm(p=>({...p, customerDescription:e.target.value}))} placeholder="O que o cliente relatou..." /></div>
          </div>
        </div>

        <div className={SectionClass}>
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary/15 text-primary rounded-full flex items-center justify-center text-xs font-bold">5</span>
            Logística e Operação
          </h2>
          <div className="space-y-3">
            <div><label className={LabelClass}>Transportadora</label>
              <select className={InputClass} value={form.carrierId} onChange={e => setForm(p=>({...p, carrierId:e.target.value}))}>
                <option value="">Selecionar transportadora</option>
                {carriersData?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div><label className={LabelClass}>Código de Rastreio</label>
              <input className={InputClass} value={form.trackingCode} onChange={e => setForm(p=>({...p, trackingCode:e.target.value}))} placeholder="TR123456789" /></div>
            <div><label className={LabelClass}>Fornecedor</label>
              <select className={InputClass} value={form.supplierId} onChange={e => setForm(p=>({...p, supplierId:e.target.value}))}>
                <option value="">Selecionar fornecedor</option>
                {suppliersData?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select></div>
            <div><label className={LabelClass}>SLA (horas)</label>
              <select className={InputClass} value={form.slaHours} onChange={e => setForm(p=>({...p, slaHours:e.target.value}))}>
                <option value="24">24 horas (Crítico)</option>
                <option value="48">48 horas (Alto)</option>
                <option value="72">72 horas (Padrão)</option>
                <option value="120">120 horas (Baixo)</option>
              </select></div>
          </div>
        </div>
      </div>

      {/* Notas internas */}
      <div className={SectionClass}>
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-primary/15 text-primary rounded-full flex items-center justify-center text-xs font-bold">6</span>
          Observações Internas
        </h2>
        <textarea rows={3} className={InputClass} value={form.internalNotes} onChange={e => setForm(p=>({...p, internalNotes:e.target.value}))} placeholder="Observações internas visíveis apenas para a equipe..." />
      </div>

      <div className="flex justify-end gap-3 pb-6">
        <Link href="/dashboard/devolutions" className="px-5 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
          Cancelar
        </Link>
        <button type="submit" disabled={mutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60">
          <Save className="w-4 h-4" />
          {mutation.isPending ? 'Salvando...' : 'Criar Devolução'}
        </button>
      </div>
    </form>
  );
}
