'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, X, Search, Edit, Shield, ToggleLeft, ToggleRight,
  Eye, EyeOff, ChevronDown, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { userAPI } from '@/lib/api';
import { formatDate, getRoleLabel, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

const ROLES = ['OWNER', 'ADMIN', 'SUPERVISOR', 'ANALYST', 'FINANCIAL', 'SAC', 'OPERATIONAL', 'VIEWER'] as const;
const ROLE_COLORS: Record<string, string> = {
  OWNER:       'bg-red-500/10 text-red-400 border-red-500/20',
  ADMIN:       'bg-orange-500/10 text-orange-400 border-orange-500/20',
  SUPERVISOR:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  ANALYST:     'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  FINANCIAL:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SAC:         'bg-blue-500/10 text-blue-400 border-blue-500/20',
  OPERATIONAL: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  VIEWER:      'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const ALL_PERMISSIONS = [
  'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'VIEW', 'EXPORT',
  'CLOSE_CASES', 'MANAGE_USERS', 'MANAGE_FINANCIAL', 'MANAGE_SKUS',
  'MANAGE_SUPPLIERS', 'MANAGE_CARRIERS', 'VIEW_AUDIT', 'VIEW_REPORTS',
] as const;

const PERMISSION_LABELS: Record<string, string> = {
  CREATE: 'Criar', EDIT: 'Editar', DELETE: 'Deletar', APPROVE: 'Aprovar',
  VIEW: 'Visualizar', EXPORT: 'Exportar', CLOSE_CASES: 'Fechar Casos',
  MANAGE_USERS: 'Gerenciar Usuários', MANAGE_FINANCIAL: 'Gerenciar Financeiro',
  MANAGE_SKUS: 'Gerenciar SKUs', MANAGE_SUPPLIERS: 'Gerenciar Fornecedores',
  MANAGE_CARRIERS: 'Gerenciar Transportadoras', VIEW_AUDIT: 'Ver Auditoria',
  VIEW_REPORTS: 'Ver Relatórios',
};

interface UserForm {
  name: string; email: string; password: string; role: string;
}
const EMPTY_FORM: UserForm = { name: '', email: '', password: '', role: 'ANALYST' };

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser, checkPermission } = useAuthStore();
  const canManage = checkPermission('MANAGE_USERS');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [permissionsTarget, setPermissionsTarget] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);
  const [showPass, setShowPass] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter, page],
    queryFn: async () => {
      const r = await userAPI.list({ search, role: roleFilter, page, limit: 15 });
      return r.data;
    },
  });

  const { mutate: create, isPending: cp } = useMutation({
    mutationFn: (d: any) => userAPI.create(d),
    onSuccess: () => {
      toast.success('Usuário criado com sucesso');
      reset(); queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Erro ao criar usuário'),
  });

  const { mutate: update, isPending: up } = useMutation({
    mutationFn: ({ id, d }: any) => userAPI.update(id, d),
    onSuccess: () => {
      toast.success('Usuário atualizado');
      reset(); queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('Erro ao atualizar usuário'),
  });

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, active }: any) => active ? userAPI.activate(id) : userAPI.deactivate(id),
    onSuccess: () => { toast.success('Status alterado'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: () => toast.error('Erro ao alterar status'),
  });

  const { mutate: updatePermissions, isPending: permPending } = useMutation({
    mutationFn: ({ id, permissions }: any) => userAPI.updatePermissions(id, { permissions }),
    onSuccess: () => {
      toast.success('Permissões atualizadas');
      setPermissionsTarget(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('Erro ao atualizar permissões'),
  });

  const reset = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); };

  const openEdit = (u: any) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setEditingId(u.id);
    setShowForm(true);
  };

  const openPermissions = (u: any) => {
    setPermissionsTarget(u);
    setSelectedPermissions(u.permissions?.map((p: any) => p.permission) ?? []);
  };

  const togglePermission = (p: string) => {
    setSelectedPermissions(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleSubmit = () => {
    const d: any = { ...form };
    if (!d.password) delete d.password;
    if (editingId) { update({ id: editingId, d }); } else { create(d); }
  };

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-10 h-10 text-yellow-500" />
        <p className="text-muted-foreground text-sm">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Usuários</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{users?.meta?.total ?? 0} usuários no sistema</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                <button onClick={reset}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Nome Completo *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Nome do usuário"
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">E-mail *</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="usuario@sleepcalm.com.br"
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Senha {editingId ? '(deixar em branco para manter)' : '*'}
                  </label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full px-3 py-2.5 pr-10 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Perfil de Acesso *</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50">
                    {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                  </select>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
                <button onClick={reset} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted">Cancelar</button>
                <button onClick={handleSubmit} disabled={cp || up || !form.name || !form.email || (!editingId && !form.password)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {(cp || up) ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Criar Usuário'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permissions Modal */}
      <AnimatePresence>
        {permissionsTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setPermissionsTarget(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Permissões Granulares
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {permissionsTarget.name} · Perfil: {getRoleLabel(permissionsTarget.role)}
                  </p>
                </div>
                <button onClick={() => setPermissionsTarget(null)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-xs text-muted-foreground mb-4">
                  ℹ️ OWNER e ADMIN têm todas as permissões automaticamente. Estas configurações se aplicam a outros perfis.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PERMISSIONS.map(perm => (
                    <button
                      key={perm}
                      onClick={() => togglePermission(perm)}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all text-xs font-medium',
                        selectedPermissions.includes(perm)
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-muted/30 border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        selectedPermissions.includes(perm)
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/40'
                      )}>
                        {selectedPermissions.includes(perm) && (
                          <CheckCircle2 className="w-2.5 h-2.5 text-primary-foreground" />
                        )}
                      </div>
                      {PERMISSION_LABELS[perm]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{selectedPermissions.length} permissões selecionadas</p>
                <div className="flex gap-2">
                  <button onClick={() => setPermissionsTarget(null)}
                    className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
                    Cancelar
                  </button>
                  <button
                    onClick={() => updatePermissions({ id: permissionsTarget.id, permissions: selectedPermissions })}
                    disabled={permPending}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {permPending ? 'Salvando...' : 'Salvar Permissões'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters + Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary/50 placeholder-muted-foreground" />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none">
            <option value="">Todos os perfis</option>
            {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['Usuário', 'E-mail', 'Perfil', 'Permissões', 'Casos', 'Status', 'Último Acesso', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(users?.data ?? []).map((u: any, i: number) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.name}</p>
                        {u.id === currentUser?.id && (
                          <span className="text-[10px] text-primary bg-primary/10 px-1 py-0.5 rounded">Você</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full border', ROLE_COLORS[u.role] ?? '')}>
                      {getRoleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {['OWNER', 'ADMIN'].includes(u.role) ? (
                      <span className="text-xs text-emerald-400">Todas</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{u.permissions?.length ?? 0} permissões</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{u._count?.assignedDevolutions ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${u.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {u.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {u.lastLoginAt ? formatDate(u.lastLoginAt) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(u)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {!['OWNER', 'ADMIN'].includes(u.role) && (
                        <button onClick={() => openPermissions(u)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10 transition-colors">
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {u.id !== currentUser?.id && (
                        <button onClick={() => toggleActive({ id: u.id, active: !u.active })}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors">
                          {u.active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {isLoading && <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
          {!isLoading && (!users?.data || users.data.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
            </div>
          )}
        </div>

        {users?.meta && users.meta.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{users.meta.total} usuários</p>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(users.meta.totalPages, 5) }, (_, i) => i + 1).map(p => (
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
