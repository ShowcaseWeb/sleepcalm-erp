'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  RotateCcw, AlertTriangle, CheckCircle2, Clock, DollarSign, TrendingDown,
  TrendingUp, Truck, Heart, RefreshCw, BarChart3, Activity
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { dashboardAPI } from '@/lib/api';
import { formatCurrency, getStatusLabel } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3b82f6',
  IN_ANALYSIS: '#f59e0b',
  AWAITING_COLLECTION: '#f97316',
  IN_TRANSIT: '#06b6d4',
  RECEIVED: '#8b5cf6',
  IN_INSPECTION: '#6366f1',
  AWAITING_FINANCIAL: '#f59e0b',
  REFUND_APPROVED: '#10b981',
  FINALIZED: '#22c55e',
  CANCELLED: '#ef4444',
};

const CHANNEL_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#ef4444'];

function KPICard({ title, value, icon: Icon, iconColor, alert, index }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={`bg-card border rounded-xl p-5 flex items-start gap-4 hover:shadow-card-hover transition-all duration-200 ${
        alert ? 'border-red-500/30 bg-red-500/5' : 'border-border'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">{title}</p>
        <p className={`text-2xl font-bold ${alert ? 'text-red-500' : 'text-foreground'}`}>{value}</p>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => { const r = await dashboardAPI.getKPIs(); return r.data.data; },
    refetchInterval: 60000,
  });

  const { data: monthly } = useQuery({
    queryKey: ['dashboard-monthly'],
    queryFn: async () => { const r = await dashboardAPI.getMonthlyEvolution({ months: 12 }); return r.data.data; },
  });

  const { data: statusDist } = useQuery({
    queryKey: ['dashboard-status'],
    queryFn: async () => { const r = await dashboardAPI.getStatusDistribution(); return r.data.data; },
  });

  const { data: topSKUs } = useQuery({
    queryKey: ['dashboard-skus'],
    queryFn: async () => { const r = await dashboardAPI.getTopSKUs({ limit: 8 }); return r.data.data; },
  });

  const { data: channelDist } = useQuery({
    queryKey: ['dashboard-channels'],
    queryFn: async () => { const r = await dashboardAPI.getChannelDistribution(); return r.data.data; },
  });

  const { data: slaPerf } = useQuery({
    queryKey: ['dashboard-sla'],
    queryFn: async () => { const r = await dashboardAPI.getSLAPerformance(); return r.data.data; },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 h-24 shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const kpiCards = [
    { title: 'Total Devoluções', value: kpis?.totalDevolutions ?? 0, icon: RotateCcw, iconColor: 'bg-indigo-500/15 text-indigo-400' },
    { title: 'Em Aberto', value: kpis?.openDevolutions ?? 0, icon: Clock, iconColor: 'bg-blue-500/15 text-blue-400' },
    { title: 'Em Análise', value: kpis?.inAnalysis ?? 0, icon: Activity, iconColor: 'bg-yellow-500/15 text-yellow-400' },
    { title: 'Finalizadas', value: kpis?.finalized ?? 0, icon: CheckCircle2, iconColor: 'bg-emerald-500/15 text-emerald-400' },
    { title: 'SLA Vencidos', value: kpis?.slaBreached ?? 0, icon: AlertTriangle, iconColor: 'bg-red-500/15 text-red-400', alert: (kpis?.slaBreached ?? 0) > 0 },
    { title: 'Total Reembolsado', value: formatCurrency(kpis?.totalRefunded ?? 0), icon: DollarSign, iconColor: 'bg-orange-500/15 text-orange-400' },
    { title: 'Total Recuperado', value: formatCurrency(kpis?.totalRecovered ?? 0), icon: TrendingUp, iconColor: 'bg-teal-500/15 text-teal-400' },
    { title: 'Prejuízo Total', value: formatCurrency(kpis?.totalLoss ?? 0), icon: TrendingDown, iconColor: 'bg-rose-500/15 text-rose-400' },
    { title: 'Trocas', value: kpis?.totalExchanges ?? 0, icon: RefreshCw, iconColor: 'bg-purple-500/15 text-purple-400' },
    { title: 'Doações', value: kpis?.totalDonations ?? 0, icon: Heart, iconColor: 'bg-pink-500/15 text-pink-400' },
    { title: 'Em Transporte', value: formatCurrency(kpis?.totalInTransport ?? 0), icon: Truck, iconColor: 'bg-cyan-500/15 text-cyan-400' },
    { title: 'Taxa Resolução', value: `${kpis?.resolutionRate ?? 0}%`, icon: BarChart3, iconColor: 'bg-violet-500/15 text-violet-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Executivo</h1>
          <p className="text-muted-foreground text-sm mt-1">Bem-vindo, {user?.name?.split(' ')[0]}!</p>
        </div>
        <p className="text-xs text-muted-foreground">{new Date().toLocaleString('pt-BR')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
        {kpiCards.map((card, i) => <KPICard key={card.title} {...card} index={i} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div {...fadeInUp} transition={{ delay: 0.5 }} className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-1">Evolução Mensal</h3>
          <p className="text-muted-foreground text-xs mb-5">Devoluções criadas vs finalizadas</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly || []}>
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFinalized" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Legend />
              <Area type="monotone" dataKey="created" name="Criadas" stroke="#6366f1" fill="url(#colorCreated)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="finalized" name="Finalizadas" stroke="#22c55e" fill="url(#colorFinalized)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...fadeInUp} transition={{ delay: 0.6 }} className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-1">Status Atual</h3>
          <p className="text-muted-foreground text-xs mb-4">Distribuição por status</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={(statusDist || []).map((s: any) => ({ name: getStatusLabel(s.status), value: s._count?.id || 0, status: s.status }))}
                cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value"
              >
                {(statusDist || []).map((entry: any, index: number) => (
                  <Cell key={index} fill={STATUS_COLORS[entry.status] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {(statusDist || []).slice(0, 5).map((s: any) => (
              <div key={s.status} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[s.status] || '#64748b' }} />
                <span className="text-muted-foreground truncate">{getStatusLabel(s.status)}</span>
                <span className="ml-auto font-medium">{s._count?.id || 0}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...fadeInUp} transition={{ delay: 0.7 }} className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-1">Top SKUs com Mais Devoluções</h3>
          <p className="text-muted-foreground text-xs mb-4">Produtos com maior número de ocorrências</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={(topSKUs || []).slice(0, 6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="skuCode" width={110} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(v: any) => [v, 'Devoluções']} />
              <Bar dataKey="count" name="Devoluções" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...fadeInUp} transition={{ delay: 0.8 }} className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-1">Devoluções por Canal</h3>
          <p className="text-muted-foreground text-xs mb-4">Distribuição por canal de venda</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={channelDist || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="channel" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="count" name="Devoluções" radius={[4, 4, 0, 0]}>
                {(channelDist || []).map((_: any, index: number) => (
                  <Cell key={index} fill={CHANNEL_COLORS[index % CHANNEL_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {slaPerf && (
        <motion.div {...fadeInUp} transition={{ delay: 0.9 }} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Performance de SLA</h3>
              <p className="text-muted-foreground text-xs mt-0.5">Cumprimento dos prazos</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-500">{slaPerf.slaRate}%</p>
              <p className="text-xs text-muted-foreground">Taxa de cumprimento</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-muted/30 rounded-xl">
              <p className="text-2xl font-bold">{slaPerf.total}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Casos</p>
            </div>
            <div className="text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <p className="text-2xl font-bold text-emerald-500">{slaPerf.onTime}</p>
              <p className="text-xs text-emerald-600 mt-1">No Prazo</p>
            </div>
            <div className="text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
              <p className="text-2xl font-bold text-red-500">{slaPerf.breached}</p>
              <p className="text-xs text-red-600 mt-1">SLA Vencido</p>
            </div>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${slaPerf.slaRate}%` }}
              transition={{ delay: 1, duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
