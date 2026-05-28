'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, RotateCcw, DollarSign, Truck, Heart,
  BarChart3, Users, Settings, LogOut, Moon, Bell, Search,
  ChevronLeft, ChevronRight, Microscope, FileText, Building2,
  ClipboardList, Shield, TrendingDown, ChevronDown
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', badge: null },
  { icon: RotateCcw, label: 'Devoluções', href: '/dashboard/devolutions', badge: 'novo' },
  { icon: Microscope, label: 'Análise Técnica', href: '/dashboard/technical' },
  { icon: DollarSign, label: 'Financeiro', href: '/dashboard/financial' },
  { icon: Truck, label: 'Lalamove', href: '/dashboard/lalamove' },
  { icon: Heart, label: 'Doações', href: '/dashboard/donations' },
  { icon: FileText, label: 'Relatórios', href: '/dashboard/reports' },
  null, // separador
  { icon: Package, label: 'SKUs', href: '/dashboard/skus' },
  { icon: Building2, label: 'Fornecedores', href: '/dashboard/suppliers' },
  { icon: Truck, label: 'Transportadoras', href: '/dashboard/carriers' },
  { icon: Users, label: 'Clientes', href: '/dashboard/customers' },
  null,
  { icon: Users, label: 'Usuários', href: '/dashboard/users', roles: ['OWNER', 'ADMIN'] },
  { icon: Shield, label: 'Auditoria', href: '/dashboard/audit', roles: ['OWNER', 'ADMIN', 'SUPERVISOR'] },
  { icon: Settings, label: 'Configurações', href: '/dashboard/settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const filteredItems = menuItems.filter(item => {
    if (!item) return true; // separadores
    if (!item.roles) return true;
    return item.roles.includes(user?.role || '');
  });

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex-shrink-0 h-screen bg-navy-900 border-r border-white/5 flex flex-col relative z-20"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow-sm">
            <Moon className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="overflow-hidden"
            >
              <p className="text-white font-bold text-sm leading-none">SleepCalm</p>
              <p className="text-slate-500 text-xs mt-0.5">ERP Sistema</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin space-y-0.5">
        {filteredItems.map((item, i) => {
          if (!item) {
            return <div key={i} className="my-2 border-t border-white/5" />;
          }

          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group relative',
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo-400 rounded-r-full"
                  />
                )}
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-indigo-400' : '')} />
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                )}
                {!collapsed && item.badge && (
                  <span className="ml-auto text-xs bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip quando collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-navy-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-50">
                    {item.label}
                  </div>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Usuário */}
      <div className="p-3 border-t border-white/5">
        <div className={cn(
          'flex items-center gap-3 p-2 rounded-lg',
          !collapsed && 'hover:bg-white/5 cursor-pointer'
        )}>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-white text-xs font-medium truncate">{user?.name}</p>
              <p className="text-slate-500 text-xs truncate">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="text-slate-500 hover:text-red-400 transition-colors ml-auto"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-navy-800 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-md z-30"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
