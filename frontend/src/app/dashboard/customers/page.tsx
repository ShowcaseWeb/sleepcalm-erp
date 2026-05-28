'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Search, Mail, Phone, MapPin, Calendar, Package } from 'lucide-react';
import { customerAPI } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { StatusBadge } from '@/components/modules/StatusBadge';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: async () => {
      const r = await customerAPI.list({ search, page, limit: 15 });
      return r.data;
    },
  });

  const { data: customerDetail } = useQuery({
    queryKey: ['customer-detail', expanded],
    queryFn: async () => {
      if (!expanded) return null;
      const r = await customerAPI.getById(expanded);
      return r.data.data;
    },
    enabled: !!expanded,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {customers?.meta?.total ?? 0} clientes com devoluções registradas
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nome, CPF, e-mail ou telefone..."
              className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground"
            />
          </div>
        </div>

        <div className="divide-y divide-border">
          {(customers?.data ?? []).map((customer: any, i: number) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              {/* Customer row */}
              <div
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 cursor-pointer transition-colors"
                onClick={() => setExpanded(expanded === customer.id ? null : customer.id)}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {customer.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{customer.name}</p>
                    {customer.cpfCnpj && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {customer.cpfCnpj}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {customer.email && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {customer.email}
                      </span>
                    )}
                    {customer.phone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {customer.phone}
                      </span>
                    )}
                    {customer.city && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {customer.city}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center hidden sm:block">
                    <p className="text-lg font-bold text-foreground">{customer._count?.devolutions ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">Devoluções</p>
                  </div>
                  <div className="text-center hidden md:block">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(customer.createdAt)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Cadastro</p>
                  </div>
                  <div className={cn(
                    'w-5 h-5 flex items-center justify-center text-muted-foreground transition-transform',
                    expanded === customer.id && 'rotate-180'
                  )}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded devolutions */}
              {expanded === customer.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border/50 bg-muted/10 px-5 py-4"
                >
                  {customerDetail ? (
                    <div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {customerDetail.address && (
                          <div className="col-span-2">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Endereço</p>
                            <p className="text-xs text-foreground mt-0.5">{customerDetail.address}</p>
                          </div>
                        )}
                      </div>

                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Package className="w-3 h-3" />
                        Histórico de Devoluções ({customerDetail.devolutions?.length ?? 0})
                      </h4>

                      {customerDetail.devolutions && customerDetail.devolutions.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-border">
                                {['Caso', 'Tipo', 'Canal', 'Status', 'Data'].map(h => (
                                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {customerDetail.devolutions.slice(0, 10).map((d: any) => (
                                <tr key={d.id} className="border-b border-border/30 hover:bg-muted/20">
                                  <td className="px-3 py-2 text-xs font-mono text-primary">{d.caseNumber}</td>
                                  <td className="px-3 py-2 text-xs text-muted-foreground">{d.type?.replace('_', ' ')}</td>
                                  <td className="px-3 py-2 text-xs text-muted-foreground">{d.channel?.replace('_', ' ')}</td>
                                  <td className="px-3 py-2"><StatusBadge status={d.status} size="sm" /></td>
                                  <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(d.createdAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Nenhuma devolução registrada.</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && (!customers?.data || customers.data.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
          </div>
        )}

        {customers?.meta && customers.meta.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{customers.meta.total} clientes · Pág. {customers.meta.page} de {customers.meta.totalPages}</p>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(customers.meta.totalPages, 5) }, (_, i) => i + 1).map(p => (
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
