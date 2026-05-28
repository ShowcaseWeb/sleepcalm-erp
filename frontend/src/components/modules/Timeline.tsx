'use client';

import { motion } from 'framer-motion';
import { formatDateTime } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import {
  CheckCircle2, XCircle, Clock, AlertCircle, ArrowRight,
  User, MessageSquare, Package, FileText, Truck, Star, RefreshCw
} from 'lucide-react';

const ACTION_ICONS: Record<string, React.ElementType> = {
  STATUS_CHANGED: ArrowRight,
  COMMENT_ADDED: MessageSquare,
  ASSIGNED: User,
  ATTACHMENT_ADDED: Package,
  FISCAL_DOC_ADDED: FileText,
  LALAMOVE_REQUESTED: Truck,
  TECHNICAL_ANALYSIS: Star,
  REFUND_APPROVED: CheckCircle2,
  CANCELLED: XCircle,
  CREATED: RefreshCw,
};

const ACTION_COLORS: Record<string, string> = {
  STATUS_CHANGED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  COMMENT_ADDED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  ASSIGNED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ATTACHMENT_ADDED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  FISCAL_DOC_ADDED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  LALAMOVE_REQUESTED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  TECHNICAL_ANALYSIS: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  REFUND_APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
  CREATED: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

interface TimelineItem {
  id: string;
  action: string;
  description: string;
  fromStatus?: string;
  toStatus?: string;
  user?: { name: string; email: string };
  createdAt: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="w-10 h-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Nenhum histórico disponível.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-4">
        {items.map((item, idx) => {
          const Icon = ACTION_ICONS[item.action] ?? AlertCircle;
          const colorClass = ACTION_COLORS[item.action] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20';
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="relative flex items-start gap-4 pl-2"
            >
              <div className={`relative z-10 w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-sm text-foreground font-medium">{item.description}</p>
                    {item.fromStatus && item.toStatus && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <StatusBadge status={item.fromStatus} size="sm" />
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <StatusBadge status={item.toStatus} size="sm" />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {formatDateTime(item.createdAt)}
                  </span>
                </div>
                {item.user && (
                  <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {item.user.name}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
