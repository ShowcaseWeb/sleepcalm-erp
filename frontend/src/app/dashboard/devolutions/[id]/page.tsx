'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { devolutionAPI, attachmentAPI, technicalAPI, financialAPI, lalamoveAPI, donationAPI, fiscalAPI } from '@/lib/api';
import { formatCurrency, formatDateTime, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/modules/StatusBadge';
import { PriorityBadge } from '@/components/modules/PriorityBadge';
import { Timeline } from '@/components/modules/Timeline';
import { CommentSection } from '@/components/modules/CommentSection';
import { useAuthStore } from '@/store/auth.store';
import {
  ArrowLeft, ChevronDown, User, Package, Truck, DollarSign,
  FileText, Image, Film, Paperclip, MessageSquare, Clock, Edit,
  CheckCircle2, XCircle, AlertTriangle, ExternalLink, Download,
  Star, Gift, RefreshCw, Phone, Mail, MapPin, Hash, Calendar,
  BarChart2, Building2
} from 'lucide-react';

const STATUS_FLOW: Record<string, string[]> = {
  OPEN:                ['IN_ANALYSIS', 'CANCELLED'],
  IN_ANALYSIS:         ['AWAITING_COLLECTION', 'APPROVED', 'REJECTED', 'CANCELLED'],
  AWAITING_COLLECTION: ['COLLECTED', 'CANCELLED'],
  COLLECTED:           ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT:          ['RECEIVED_WAREHOUSE', 'CANCELLED'],
  RECEIVED_WAREHOUSE:  ['TECHNICAL_ANALYSIS', 'APPROVED'],
  TECHNICAL_ANALYSIS:  ['APPROVED', 'REJECTED'],
  APPROVED:            ['REFUND_PENDING', 'EXCHANGE_PENDING', 'DONATED'],
  REJECTED:            ['CLOSED'],
  REFUND_PENDING:      ['REFUNDED', 'CLOSED'],
  EXCHANGE_PENDING:    ['EXCHANGED', 'CLOSED'],
  REFUNDED:            ['CLOSED'],
  EXCHANGED:           ['CLOSED'],
  DONATED:             ['CLOSED'],
  DISCARDED:           ['CLOSED'],
  CANCELLED:           [],
  CLOSED:              [],
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto', IN_ANALYSIS: 'Em Análise', AWAITING_COLLECTION: 'Ag. Coleta',
  COLLECTED: 'Coletado', IN_TRANSIT: 'Em Trânsito', RECEIVED_WAREHOUSE: 'No Armazém',
  TECHNICAL_ANALYSIS: 'Análise Técnica', APPROVED: 'Aprovado', REJECTED: 'Rejeitado',
  REFUND_PENDING: 'Reembolso Pend.', EXCHANGE_PENDING: 'Troca Pend.',
  REFUNDED: 'Reembolsado', EXCHANGED: 'Trocado', DONATED: 'Doado',
  DISCARDED: 'Descartado', CANCELLED: 'Cancelado', CLOSED: 'Fechado',
};

const TABS = [
  { id: 'overview',   label: 'Visão Geral',     icon: BarChart2 },
  { id: 'items',      label: 'Itens',            icon: Package },
  { id: 'timeline',   label: 'Linha do Tempo',   icon: Clock },
  { id: 'comments',   label: 'Comentários',      icon: MessageSquare },
  { id: 'technical',  label: 'Análise Técnica',  icon: Star },
  { id: 'financial',  label: 'Financeiro',       icon: DollarSign },
  { id: 'lalamove',   label: 'Lalamove',         icon: Truck },
  { id: 'fiscal',     label: 'Docs. Fiscais',    icon: FileText },
  { id: 'attachments',label: 'Anexos',           icon: Paperclip },
  { id: 'donation',   label: 'Doação',           icon: Gift },
];

function InfoRow({ label, value, className }: { label: string; value?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      <span className="text-sm text-foreground">{value ?? <span className="text-muted-foreground/60">—</span>}</span>
    </div>
  );
}

function SectionCard({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-card border border-border rounded-xl', className)}>
      {title && <div className="px-5 py-3.5 border-b border-border"><h3 className="font-semibold text-sm text-foreground">{title}</h3></div>}
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function DevolutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { checkPermission } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [statusOpen, setStatusOpen] = useState(false);
  const [note, setNote] = useState('');

  const QK = ['devolution', id];

  const { data: devolution, isLoading } = useQuery({
    queryKey: QK,
    queryFn: async () => {
      const r = await devolutionAPI.getById(id);
      return r.data.data;
    },
    refetchInterval: 30000,
  });

  const { mutate: changeStatus, isPending: statusPending } = useMutation({
    mutationFn: ({ toStatus, notes }: { toStatus: string; notes: string }) =>
      devolutionAPI.updateStatus(id, { status: toStatus, notes }),
    onSuccess: () => {
      toast.success('Status atualizado com sucesso');
      setStatusOpen(false);
      setNote('');
      queryClient.invalidateQueries({ queryKey: QK });
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const nextStatuses = devolution ? STATUS_FLOW[devolution.status] ?? [] : [];
  const canChangeStatus = checkPermission('EDIT');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!devolution) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-10 h-10 text-yellow-500" />
        <p className="text-muted-foreground">Devolução não encontrada.</p>
        <button onClick={() => router.back()} className="text-sm text-primary hover:underline">Voltar</button>
      </div>
    );
  }

  const totalItems = devolution.items?.reduce((s: number, i: any) => s + i.quantity, 0) ?? 0;
  const totalValue = devolution.items?.reduce((s: number, i: any) => s + (i.totalPrice || 0), 0) ?? 0;
  const slaBreach = devolution.slaDueDate && new Date(devolution.slaDueDate) < new Date() && !['CLOSED', 'CANCELLED', 'REFUNDED', 'EXCHANGED'].includes(devolution.status);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-foreground font-mono">{devolution.caseNumber}</h1>
              <StatusBadge status={devolution.status} />
              <PriorityBadge priority={devolution.priority} />
              {slaBreach && (
                <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                  <AlertTriangle className="w-3 h-3" /> SLA Vencido
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Criado em {formatDateTime(devolution.createdAt)}
              {devolution.assignedUser && ` · Responsável: ${devolution.assignedUser.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canChangeStatus && nextStatuses.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setStatusOpen(!statusOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Mudar Status
                <ChevronDown className={cn('w-4 h-4 transition-transform', statusOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {statusOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl w-72 p-3"
                  >
                    <p className="text-xs text-muted-foreground mb-2 px-1">Selecione o próximo status:</p>
                    <div className="space-y-1 mb-3">
                      {nextStatuses.map(st => (
                        <button
                          key={st}
                          onClick={() => {
                            if (note.trim() || window.confirm('Confirma mudança sem nota?')) {
                              changeStatus({ toStatus: st, notes: note });
                            }
                          }}
                          disabled={statusPending}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm text-foreground transition-colors flex items-center gap-2"
                        >
                          <StatusBadge status={st} size="sm" />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Nota (opcional)..."
                      rows={2}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground resize-none outline-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          {checkPermission('EDIT') && (
            <button
              onClick={() => router.push(`/dashboard/devolutions?edit=${id}`)}
              className="flex items-center gap-2 px-4 py-2 border border-border text-sm font-medium rounded-lg hover:bg-muted transition-colors text-foreground"
            >
              <Edit className="w-4 h-4" /> Editar
            </button>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Itens', value: totalItems, icon: Package, color: 'text-indigo-400 bg-indigo-500/10' },
          { label: 'Valor Total', value: formatCurrency(totalValue), icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Canal', value: devolution.channel?.replace('_', ' '), icon: Hash, color: 'text-blue-400 bg-blue-500/10' },
          { label: 'SLA Due', value: devolution.slaDueDate ? formatDate(devolution.slaDueDate) : '—', icon: Calendar, color: slaBreach ? 'text-red-400 bg-red-500/10' : 'text-orange-400 bg-orange-500/10' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className="text-sm font-semibold text-foreground truncate">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex overflow-x-auto border-b border-border">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <SectionCard title="Cliente">
                    <div className="grid grid-cols-2 gap-4">
                      <InfoRow label="Nome" value={devolution.customer?.name} />
                      <InfoRow label="CPF / CNPJ" value={devolution.customer?.cpfCnpj} />
                      <InfoRow label="Email" value={
                        devolution.customer?.email
                          ? <a href={`mailto:${devolution.customer.email}`} className="text-primary hover:underline flex items-center gap-1">
                              <Mail className="w-3 h-3" />{devolution.customer.email}
                            </a>
                          : undefined
                      } />
                      <InfoRow label="Telefone" value={
                        devolution.customer?.phone
                          ? <a href={`tel:${devolution.customer.phone}`} className="text-primary hover:underline flex items-center gap-1">
                              <Phone className="w-3 h-3" />{devolution.customer.phone}
                            </a>
                          : undefined
                      } />
                      {devolution.customer?.address && (
                        <InfoRow
                          label="Endereço"
                          className="col-span-2"
                          value={<span className="flex items-start gap-1"><MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />{devolution.customer.address}</span>}
                        />
                      )}
                    </div>
                  </SectionCard>

                  <SectionCard title="Pedido / Caso">
                    <div className="grid grid-cols-2 gap-4">
                      <InfoRow label="Nº Pedido" value={devolution.orderNumber} />
                      <InfoRow label="Canal" value={devolution.channel?.replace('_', ' ')} />
                      <InfoRow label="Tipo" value={devolution.type?.replace('_', ' ')} />
                      <InfoRow label="Motivo" value={devolution.reason?.name} />
                      <InfoRow label="SLA (horas)" value={devolution.slaHours} />
                      <InfoRow label="Vencimento SLA" value={devolution.slaDueDate ? formatDateTime(devolution.slaDueDate) : '—'} />
                    </div>
                  </SectionCard>

                  <SectionCard title="Logística">
                    <div className="grid grid-cols-2 gap-4">
                      <InfoRow label="Transportadora" value={devolution.carrier?.name} />
                      <InfoRow label="Rastreio" value={devolution.trackingCode} />
                      <InfoRow label="Fornecedor" value={devolution.supplier?.name} />
                      <InfoRow label="Endereço Coleta" value={devolution.pickupAddress} />
                    </div>
                  </SectionCard>

                  <SectionCard title="Observações Internas">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {devolution.internalNotes ?? <span className="text-muted-foreground/60 italic">Sem observações.</span>}
                    </p>
                  </SectionCard>
                </div>
              )}

              {/* ITEMS TAB */}
              {activeTab === 'items' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {['SKU', 'Produto', 'Qtd', 'Preço Unit.', 'Total', 'Condição', 'Motivo'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(devolution.items ?? []).map((item: any) => (
                        <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="px-3 py-3 text-xs font-mono text-muted-foreground">{item.sku?.code}</td>
                          <td className="px-3 py-3 text-sm text-foreground font-medium">{item.sku?.name ?? item.productName}</td>
                          <td className="px-3 py-3 text-sm text-foreground">{item.quantity}</td>
                          <td className="px-3 py-3 text-sm text-foreground">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-3 py-3 text-sm font-semibold text-foreground">{formatCurrency(item.totalPrice)}</td>
                          <td className="px-3 py-3 text-sm text-muted-foreground">{item.condition ?? '—'}</td>
                          <td className="px-3 py-3 text-sm text-muted-foreground">{item.defectDescription ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/20">
                        <td colSpan={3} className="px-3 py-3 text-xs text-muted-foreground uppercase font-semibold">Total</td>
                        <td className="px-3 py-3"></td>
                        <td className="px-3 py-3 text-sm font-bold text-foreground">{formatCurrency(totalValue)}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                  {(!devolution.items || devolution.items.length === 0) && (
                    <div className="py-10 text-center text-sm text-muted-foreground">Nenhum item registrado.</div>
                  )}
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === 'timeline' && (
                <Timeline items={devolution.statusHistory ?? []} />
              )}

              {/* COMMENTS TAB */}
              {activeTab === 'comments' && (
                <CommentSection
                  devolutionId={id}
                  comments={devolution.comments ?? []}
                  queryKey={QK}
                />
              )}

              {/* TECHNICAL ANALYSIS TAB */}
              {activeTab === 'technical' && (
                <TechnicalTab devolutionId={id} analyses={devolution.technicalAnalyses ?? []} queryKey={QK} />
              )}

              {/* FINANCIAL TAB */}
              {activeTab === 'financial' && (
                <FinancialTab devolutionId={id} records={devolution.financialRecords ?? []} queryKey={QK} />
              )}

              {/* LALAMOVE TAB */}
              {activeTab === 'lalamove' && (
                <LalamoveTab devolutionId={id} orders={devolution.lalamoveOrders ?? []} queryKey={QK} />
              )}

              {/* FISCAL DOCS TAB */}
              {activeTab === 'fiscal' && (
                <FiscalTab devolutionId={id} docs={devolution.fiscalDocuments ?? []} queryKey={QK} />
              )}

              {/* ATTACHMENTS TAB */}
              {activeTab === 'attachments' && (
                <AttachmentsTab devolutionId={id} attachments={devolution.attachments ?? []} queryKey={QK} />
              )}

              {/* DONATION TAB */}
              {activeTab === 'donation' && (
                <DonationTab devolutionId={id} donations={devolution.donations ?? []} queryKey={QK} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-tab components ─── */

function TechnicalTab({ devolutionId, analyses, queryKey }: any) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ result: 'DEFECT_CONFIRMED', defectType: '', description: '', recommendation: '' });

  const { mutate: create, isPending } = useMutation({
    mutationFn: (data: any) => technicalAPI.create({ ...data, devolutionId }),
    onSuccess: () => { toast.success('Análise técnica criada'); setShowForm(false); queryClient.invalidateQueries({ queryKey }); },
    onError: () => toast.error('Erro ao criar análise'),
  });

  const { mutate: approve } = useMutation({
    mutationFn: (id: string) => technicalAPI.approve(id),
    onSuccess: () => { toast.success('Análise aprovada'); queryClient.invalidateQueries({ queryKey }); },
    onError: () => toast.error('Erro ao aprovar'),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Star className="w-4 h-4" /> Nova Análise
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-3">
              <h4 className="font-medium text-sm text-foreground">Nova Análise Técnica</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Resultado</label>
                  <select value={form.result} onChange={e => setForm({ ...form, result: e.target.value })}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none">
                    <option value="DEFECT_CONFIRMED">Defeito Confirmado</option>
                    <option value="NO_DEFECT">Sem Defeito</option>
                    <option value="MISUSE">Mau Uso</option>
                    <option value="NORMAL_WEAR">Desgaste Normal</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tipo de Defeito</label>
                  <input value={form.defectType} onChange={e => setForm({ ...form, defectType: e.target.value })}
                    placeholder="Ex: Estrutural, Tecido..."
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none placeholder-muted-foreground" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={3} placeholder="Descrição detalhada da análise..."
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none placeholder-muted-foreground resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Recomendação</label>
                  <input value={form.recommendation} onChange={e => setForm({ ...form, recommendation: e.target.value })}
                    placeholder="Recomendação de ação..."
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none placeholder-muted-foreground" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
                <button onClick={() => create(form)} disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {analyses.map((a: any) => (
        <div key={a.id} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium border ${a.result === 'DEFECT_CONFIRMED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : a.result === 'NO_DEFECT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                  {a.result?.replace('_', ' ')}
                </span>
                {a.approved && <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" />Aprovada</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Por {a.analyst?.name} · {formatDateTime(a.createdAt)}</p>
            </div>
            {!a.approved && (
              <button onClick={() => approve(a.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs hover:bg-emerald-500/20 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {a.defectType && <InfoRow label="Tipo de Defeito" value={a.defectType} />}
            {a.recommendation && <InfoRow label="Recomendação" value={a.recommendation} />}
            {a.description && <InfoRow label="Descrição" className="md:col-span-2" value={<p className="whitespace-pre-wrap">{a.description}</p>} />}
          </div>
        </div>
      ))}

      {analyses.length === 0 && !showForm && (
        <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
          <Star className="w-9 h-9 mb-2 opacity-30" />
          <p className="text-sm">Nenhuma análise técnica registrada.</p>
        </div>
      )}
    </div>
  );
}

function FinancialTab({ devolutionId, records, queryKey }: any) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'REFUND', description: '', amount: '', isExpense: 'true' });

  const { mutate: create, isPending } = useMutation({
    mutationFn: (data: any) => financialAPI.create({ ...data, devolutionId, amount: parseFloat(data.amount), isExpense: data.isExpense === 'true' }),
    onSuccess: () => { toast.success('Registro financeiro criado'); setShowForm(false); queryClient.invalidateQueries({ queryKey }); },
    onError: () => toast.error('Erro ao criar registro'),
  });

  const { mutate: approve } = useMutation({
    mutationFn: (id: string) => financialAPI.approve(id),
    onSuccess: () => { toast.success('Registro aprovado'); queryClient.invalidateQueries({ queryKey }); },
    onError: () => toast.error('Erro ao aprovar'),
  });

  const total = records.reduce((s: number, r: any) => s + (r.isExpense ? -r.amount : r.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Saldo neste caso</p>
          <p className={`text-xl font-bold ${total >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(Math.abs(total))} {total < 0 ? '(Prejuízo)' : '(Receita)'}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Novo Registro
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none">
                    {['REFUND','PARTIAL_REFUND','EXCHANGE_COST','SHIPPING_COST','REPAIR_COST','DISCOUNT','LOSS','INSURANCE','OTHER'].map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Movimento</label>
                  <select value={form.isExpense} onChange={e => setForm({ ...form, isExpense: e.target.value })}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none">
                    <option value="true">Despesa</option>
                    <option value="false">Receita</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Valor (R$)</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00" step="0.01" min="0"
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none placeholder-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
                  <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Descrição do lançamento..."
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none placeholder-muted-foreground" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
                <button onClick={() => create(form)} disabled={isPending || !form.amount}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto bg-card border border-border rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              {['Tipo', 'Descrição', 'Valor', 'Movimento', 'Status', 'Data'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r: any) => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.type}</td>
                <td className="px-4 py-3 text-sm text-foreground">{r.description}</td>
                <td className="px-4 py-3 text-sm font-semibold text-foreground">{formatCurrency(r.amount)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.isExpense ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {r.isExpense ? 'Despesa' : 'Receita'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.approved ? (
                    <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Aprovado</span>
                  ) : (
                    <button onClick={() => approve(r.id)} className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 hover:underline">
                      <Clock className="w-3 h-3" />Aprovar
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">Nenhum registro financeiro.</div>
        )}
      </div>
    </div>
  );
}

function LalamoveTab({ devolutionId, orders, queryKey }: any) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ pickupAddress: '', deliveryAddress: '', serviceType: 'MOTORCYCLE', notes: '' });

  const { mutate: create, isPending } = useMutation({
    mutationFn: (data: any) => lalamoveAPI.create({ ...data, devolutionId }),
    onSuccess: () => { toast.success('Pedido Lalamove criado'); setShowForm(false); queryClient.invalidateQueries({ queryKey }); },
    onError: () => toast.error('Erro ao criar pedido'),
  });

  const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-slate-500/10 text-slate-400', REQUESTED: 'bg-blue-500/10 text-blue-400',
    ASSIGNING_DRIVER: 'bg-yellow-500/10 text-yellow-400', ON_GOING: 'bg-indigo-500/10 text-indigo-400',
    PICKED_UP: 'bg-purple-500/10 text-purple-400', COMPLETED: 'bg-emerald-500/10 text-emerald-400',
    CANCELLED: 'bg-red-500/10 text-red-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Truck className="w-4 h-4" /> Solicitar Coleta
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Endereço de Coleta</label>
                  <input value={form.pickupAddress} onChange={e => setForm({ ...form, pickupAddress: e.target.value })}
                    placeholder="Rua, número, bairro, cidade..."
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none placeholder-muted-foreground" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Endereço de Entrega</label>
                  <input value={form.deliveryAddress} onChange={e => setForm({ ...form, deliveryAddress: e.target.value })}
                    placeholder="Armazém ou destino..."
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none placeholder-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tipo de Veículo</label>
                  <select value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value })}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none">
                    {['MOTORCYCLE', 'CAR', 'VAN', 'TRUCK'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Observações</label>
                  <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Instruções para o motorista..."
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none placeholder-muted-foreground" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
                <button onClick={() => create(form)} disabled={isPending || !form.pickupAddress || !form.deliveryAddress}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {isPending ? 'Criando...' : 'Criar Pedido'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {orders.map((o: any) => (
        <div key={o.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              {o.externalId && <p className="text-xs font-mono text-muted-foreground">ID: {o.externalId}</p>}
              <p className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)} · {o.serviceType}</p>
            </div>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[o.status] ?? 'bg-slate-500/10 text-slate-400'}`}>{o.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="Coleta" value={o.pickupAddress} />
            <InfoRow label="Entrega" value={o.deliveryAddress} />
            {o.driverName && <InfoRow label="Motorista" value={`${o.driverName} ${o.driverPhone ? `· ${o.driverPhone}` : ''}`} />}
            {o.finalPrice && <InfoRow label="Valor Final" value={formatCurrency(o.finalPrice)} />}
            {!o.finalPrice && o.quotedPrice && <InfoRow label="Valor Cotado" value={formatCurrency(o.quotedPrice)} />}
          </div>
        </div>
      ))}

      {orders.length === 0 && !showForm && (
        <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
          <Truck className="w-9 h-9 mb-2 opacity-30" />
          <p className="text-sm">Nenhum pedido Lalamove.</p>
        </div>
      )}
    </div>
  );
}

function FiscalTab({ devolutionId, docs, queryKey }: any) {
  const queryClient = useQueryClient();

  const TYPE_LABELS: Record<string, string> = { NF: 'Nota Fiscal', NFD: 'NF Devolução', XML: 'XML', PDF: 'PDF', OTHER: 'Outro' };

  return (
    <div className="space-y-4">
      {docs.map((doc: any) => (
        <div key={doc.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:bg-muted/20 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{doc.number}</p>
            <p className="text-xs text-muted-foreground">{TYPE_LABELS[doc.type] ?? doc.type} · {formatDate(doc.issueDate)}</p>
            {doc.value && <p className="text-xs text-muted-foreground">Valor: {formatCurrency(doc.value)}</p>}
          </div>
          {doc.fileUrl && (
            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
              <Download className="w-3.5 h-3.5" /> Baixar
            </a>
          )}
        </div>
      ))}
      {docs.length === 0 && (
        <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
          <FileText className="w-9 h-9 mb-2 opacity-30" />
          <p className="text-sm">Nenhum documento fiscal anexado.</p>
        </div>
      )}
    </div>
  );
}

function AttachmentsTab({ devolutionId, attachments, queryKey }: any) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { mutate: removeAttachment } = useMutation({
    mutationFn: (id: string) => attachmentAPI.remove(id),
    onSuccess: () => { toast.success('Anexo removido'); queryClient.invalidateQueries({ queryKey }); },
    onError: () => toast.error('Erro ao remover anexo'),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('files', f));
      await attachmentAPI.upload(devolutionId, formData);
      toast.success('Arquivos enviados');
      queryClient.invalidateQueries({ queryKey });
    } catch {
      toast.error('Erro ao enviar arquivos');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const TYPE_ICONS: Record<string, React.ElementType> = {
    PHOTO: Image, VIDEO: Film, DOCUMENT: FileText, OTHER: Paperclip,
  };

  const EXT_COLORS: Record<string, string> = {
    PHOTO: 'bg-purple-500/10 text-purple-400', VIDEO: 'bg-blue-500/10 text-blue-400',
    DOCUMENT: 'bg-orange-500/10 text-orange-400', OTHER: 'bg-slate-500/10 text-slate-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <label className={cn('cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors', uploading && 'opacity-50 pointer-events-none')}>
          {uploading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</> : <><Paperclip className="w-4 h-4" />Adicionar Anexos</>}
          <input type="file" multiple className="hidden" onChange={handleUpload} />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {attachments.map((att: any) => {
          const Icon = TYPE_ICONS[att.category] ?? Paperclip;
          const colorClass = EXT_COLORS[att.category] ?? 'bg-slate-500/10 text-slate-400';
          return (
            <div key={att.id} className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-xl hover:bg-muted/20 transition-colors group">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{att.originalName}</p>
                <p className="text-[10px] text-muted-foreground">{att.category} · {formatDate(att.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={att.url} target="_blank" rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => removeAttachment(att.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {attachments.length === 0 && (
        <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
          <Paperclip className="w-9 h-9 mb-2 opacity-30" />
          <p className="text-sm">Nenhum anexo adicionado.</p>
        </div>
      )}
    </div>
  );
}

function DonationTab({ devolutionId, donations, queryKey }: any) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ recipientName: '', recipientContact: '', quantity: '1', scheduledDate: '', notes: '' });

  const { mutate: create, isPending } = useMutation({
    mutationFn: (data: any) => donationAPI.create({ ...data, devolutionId, quantity: parseInt(data.quantity) }),
    onSuccess: () => { toast.success('Doação registrada'); setShowForm(false); queryClient.invalidateQueries({ queryKey }); },
    onError: () => toast.error('Erro ao registrar doação'),
  });

  const { mutate: approve } = useMutation({
    mutationFn: (id: string) => donationAPI.approve(id),
    onSuccess: () => { toast.success('Doação aprovada'); queryClient.invalidateQueries({ queryKey }); },
    onError: () => toast.error('Erro ao aprovar'),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Gift className="w-4 h-4" /> Registrar Doação
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Instituição / Beneficiário</label>
                  <input value={form.recipientName} onChange={e => setForm({ ...form, recipientName: e.target.value })}
                    placeholder="Nome da instituição..."
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none placeholder-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Contato</label>
                  <input value={form.recipientContact} onChange={e => setForm({ ...form, recipientContact: e.target.value })}
                    placeholder="E-mail ou telefone..."
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none placeholder-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Quantidade</label>
                  <input type="number" value={form.quantity} min="1" onChange={e => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Data Prevista</label>
                  <input type="date" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Observações</label>
                  <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Observações da doação..."
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none placeholder-muted-foreground" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
                <button onClick={() => create(form)} disabled={isPending || !form.recipientName}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {donations.map((d: any) => (
        <div key={d.id} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div>
              <p className="font-medium text-sm text-foreground">{d.recipientName}</p>
              <p className="text-xs text-muted-foreground">{d.recipientContact} · Qtd: {d.quantity}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${d.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : d.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{d.status}</span>
              {d.status === 'PENDING' && (
                <button onClick={() => approve(d.id)} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs hover:bg-emerald-500/20 transition-colors">
                  <CheckCircle2 className="w-3 h-3" /> Aprovar
                </button>
              )}
            </div>
          </div>
          {d.scheduledDate && <p className="text-xs text-muted-foreground">Data prevista: {formatDate(d.scheduledDate)}</p>}
          {d.notes && <p className="text-xs text-muted-foreground mt-1">{d.notes}</p>}
        </div>
      ))}

      {donations.length === 0 && !showForm && (
        <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
          <Gift className="w-9 h-9 mb-2 opacity-30" />
          <p className="text-sm">Nenhuma doação registrada.</p>
        </div>
      )}
    </div>
  );
}


