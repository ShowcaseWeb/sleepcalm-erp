'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, ChevronUp, Minus, ChevronDown } from 'lucide-react';

const PRIORITY_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  CRITICAL: { label: 'Crítico',  className: 'bg-red-500/10 text-red-400 border-red-500/20',       icon: AlertTriangle },
  HIGH:     { label: 'Alto',     className: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: ChevronUp },
  MEDIUM:   { label: 'Médio',    className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Minus },
  LOW:      { label: 'Baixo',    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',  icon: ChevronDown },
};

interface PriorityBadgeProps {
  priority: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function PriorityBadge({ priority, showIcon = true, size = 'md', className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] ?? { label: priority, className: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Minus };
  const Icon = config.icon;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      config.className,
      className
    )}>
      {showIcon && <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />}
      {config.label}
    </span>
  );
}
