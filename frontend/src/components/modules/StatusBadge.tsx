'use client';

import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  OPEN:                  { label: 'Aberto',              className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  IN_ANALYSIS:           { label: 'Em Análise',          className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  AWAITING_COLLECTION:   { label: 'Ag. Coleta',          className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  COLLECTED:             { label: 'Coletado',            className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  IN_TRANSIT:            { label: 'Em Trânsito',         className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  RECEIVED_WAREHOUSE:    { label: 'No Armazém',          className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  TECHNICAL_ANALYSIS:    { label: 'Análise Técnica',     className: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  APPROVED:              { label: 'Aprovado',            className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  REJECTED:              { label: 'Rejeitado',           className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  REFUND_PENDING:        { label: 'Reembolso Pend.',     className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  EXCHANGE_PENDING:      { label: 'Troca Pend.',         className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  REFUNDED:              { label: 'Reembolsado',         className: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  EXCHANGED:             { label: 'Trocado',             className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  DONATED:               { label: 'Doado',               className: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  DISCARDED:             { label: 'Descartado',          className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  CANCELLED:             { label: 'Cancelado',           className: 'bg-red-600/10 text-red-500 border-red-600/20' },
  CLOSED:                { label: 'Fechado',             className: 'bg-slate-600/10 text-slate-500 border-slate-600/20' },
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
