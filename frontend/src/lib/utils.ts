import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'agora mesmo';
  if (minutes < 60) return `${minutes} min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  return formatDate(date);
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    OPEN: 'Aberto',
    IN_ANALYSIS: 'Em Análise',
    AWAITING_COLLECTION: 'Aguardando Coleta',
    COLLECTION_SCHEDULED: 'Coleta Agendada',
    IN_TRANSIT: 'Em Trânsito',
    RECEIVED: 'Recebido',
    IN_INSPECTION: 'Em Inspeção',
    AWAITING_FINANCIAL: 'Aguardando Financeiro',
    REFUND_APPROVED: 'Reembolso Aprovado',
    REFUND_PROCESSED: 'Reembolso Realizado',
    EXCHANGE_SENT: 'Troca Enviada',
    FINALIZED: 'Finalizado',
    CANCELLED: 'Cancelado',
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    IN_ANALYSIS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    AWAITING_COLLECTION: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    COLLECTION_SCHEDULED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    IN_TRANSIT: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    RECEIVED: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    IN_INSPECTION: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    AWAITING_FINANCIAL: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    REFUND_APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    REFUND_PROCESSED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    EXCHANGE_SENT: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
    FINALIZED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
    CRITICAL: 'Crítica',
  };
  return labels[priority] || priority;
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[priority] || 'bg-gray-100 text-gray-700';
}

export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    FULL_REFUND: 'Reembolso Integral',
    PARTIAL_REFUND: 'Reembolso Parcial',
    EXCHANGE: 'Troca',
    COLLECTION: 'Coleta',
    RETURN_TO_FACTORY: 'Devolução Fábrica',
    REUSE: 'Reaproveitamento',
    DONATION: 'Doação',
    DISPOSAL: 'Descarte',
    RESEND: 'Reenvio',
  };
  return labels[type] || type;
}

export function getChannelLabel(channel: string): string {
  const labels: Record<string, string> = {
    SLEEPCALM_SITE: 'Site SleepCalm',
    MERCADO_LIVRE: 'Mercado Livre',
    SHOPEE: 'Shopee',
    AMAZON: 'Amazon',
    MAGALU: 'Magalu',
    VIA_VAREJO: 'Via Varejo',
    AMERICANAS: 'Americanas',
    OUTROS: 'Outros',
  };
  return labels[channel] || channel;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    OWNER: 'Proprietário',
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
    ANALYST: 'Analista',
    FINANCIAL: 'Financeiro',
    SAC: 'SAC',
    OPERATIONAL: 'Operacional',
    VIEWER: 'Visualizador',
  };
  return labels[role] || role;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
