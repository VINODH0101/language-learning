import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  Users,
  Search,
  Filter,
  Activity,
  FileText,
  BarChart3,
  Calendar,
  Lock,
  ArrowRight,
  RefreshCw,
  Award,
  BookOpen,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { UserProfile, AdminAuditLog } from '../types';
import { useI18n } from '../i18n/i18nContext';
import { authService } from '../services/auth';
import { UserDetailModal } from '../components/admin/UserDetailModal';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { AdminWorkbench } from '../features/admin/AdminWorkbench';

interface AdminPageProps {
  onNavigateTab: (tab: any) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigateTab }) => {
  const { t } = useI18n();
  const authState = authService.getState();

  const [activeAdminTab, setActiveAdminTab] = useState<'workbench' | 'users' | 'analytics' | 'audit'>('workbench');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [targetLangFilter, setTargetLangFilter] = useState<string>('all');

  // Selected User Modal
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const loadData = async () => {
    setLoading(true);
    const userList = await authService.getAdminUserList();
    setUsers(userList);

    // Initial mock/real audit logs
    setAuditLogs([
      {
        id: 'aud_01',
        admin_id: 'usr_admin_001',
        admin_email: 'admin@polyglot.dev',
        action: 'bootstrap_initial_admin',
        target_user_id: 'usr_admin_001',
        details: { mechanism: 'bootstrap_admin.py' },
        created_at: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
      },
      {
        id: 'aud_02',
        admin_id: 'usr_admin_001',
        admin_email: 'admin@polyglot.dev',
        action: 'system_security_scan',
        details: { rls_verified: true, keys_scrubbed: true },
        created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
      },
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (authState.role === 'admin') {
      loadData();
    }
  }, [authState.role]);

  // Unauthorized Access Screen
  if (authState.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">{t('admin_unauthorized_title')}</h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
          {t('admin_unauthorized_desc')}
        </p>
        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => onNavigateTab('dashboard')}
          >
            {t('admin_unauthorized_btn')}
          </Button>
        </div>
      </div>
    );
  }

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || u.account_status === statusFilter;

    const matchesLang =
      targetLangFilter === 'all' || u.primary_target_language === targetLangFilter;

    return matchesSearch && matchesStatus && matchesLang;
  });

  // Platform Metrics
  const activeUsersCount = users.filter(u => u.account_status === 'active').length;
  const totalCompletedLessons = users.reduce((acc, u) => acc + (u.total_lessons_completed || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Admin Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              {t('admin_title')}
            </span>
            <Badge variant="indigo" size="sm">
              RLS Server Enforced
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Painel de Governança e Usuários</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {t('admin_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={loadData}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                {t('admin_stat_registered_users')}
              </span>
              <span className="text-2xl font-extrabold text-slate-100 mt-1 block">
                {users.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                {t('admin_stat_active_users')}
              </span>
              <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
                {activeUsersCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                {t('admin_stat_lessons_completed')}
              </span>
              <span className="text-2xl font-extrabold text-sky-400 mt-1 block">
                {totalCompletedLessons}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-800/60 flex items-center justify-center text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                {t('admin_stat_guest_sessions')}
              </span>
              <span className="text-2xl font-extrabold text-amber-400 mt-1 block">
                Local-First
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveAdminTab('workbench')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
            activeAdminTab === 'workbench'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Admin Workbench & Ferramentas
        </button>
        <button
          onClick={() => setActiveAdminTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
            activeAdminTab === 'users'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {t('admin_tab_users')} ({users.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
            activeAdminTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {t('admin_tab_analytics')}
        </button>
        <button
          onClick={() => setActiveAdminTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
            activeAdminTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {t('admin_tab_audit')} ({auditLogs.length})
        </button>
      </div>

      {/* TAB 0: ADMIN WORKBENCH & ADVANCED SYSTEM TOOLS */}
      {activeAdminTab === 'workbench' && (
        <AdminWorkbench />
      )}

      {/* TAB 1: USERS MANAGEMENT TABLE */}
      {activeAdminTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('admin_search_placeholder')}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativo</option>
                <option value="disabled">Desativado</option>
              </select>
              <select
                value={targetLangFilter}
                onChange={(e) => setTargetLangFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">Todos os Idiomas</option>
                <option value="pt">Português</option>
                <option value="es">Espanhol</option>
                <option value="en">Inglês</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-[11px] text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">{t('admin_table_user')}</th>
                    <th className="py-3 px-4">{t('admin_table_email')}</th>
                    <th className="py-3 px-4">{t('admin_table_role')}</th>
                    <th className="py-3 px-4">{t('admin_table_status')}</th>
                    <th className="py-3 px-4">Alvo / CEFR</th>
                    <th className="py-3 px-4">{t('admin_table_created')}</th>
                    <th className="py-3 px-4 text-right">{t('admin_table_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Nenhum aluno encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-100">{u.full_name}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === 'admin'
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.account_status === 'active'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {u.account_status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          {u.primary_target_language.toUpperCase()} • {u.study_mode}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setSelectedUser(u)}
                          >
                            {t('admin_btn_view_details')}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS */}
      {activeAdminTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Distribuição de Metas de Estudo Diário">
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">5 minutos (Micro-sessão)</span>
                <span className="font-mono text-slate-400">25%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full w-1/4" />
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-300">10 minutos (Padrão)</span>
                <span className="font-mono text-slate-400">55%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-[55%]" />
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-300">20 minutos (Imersão C1)</span>
                <span className="font-mono text-slate-400">20%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-1/5" />
              </div>
            </div>
          </Card>

          <Card title="Distribuição de Idiomas Alvo">
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Português C1 (pt-BR / pt-PT)</span>
                <span className="font-mono text-slate-400">48%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[48%]" />
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Español C1 (es-ES / es-419)</span>
                <span className="font-mono text-slate-400">38%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full w-[38%]" />
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Inglês Reverso (para falantes de PT/ES)</span>
                <span className="font-mono text-slate-400">14%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full w-[14%]" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeAdminTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-[11px] text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Administrador</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4">ID Usuário Alvo</th>
                  <th className="py-3 px-4">Detalhes JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 font-mono text-[11px]">
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-indigo-400 font-semibold">{log.admin_email || log.admin_id}</td>
                    <td className="py-3 px-4 font-bold text-slate-200">{log.action}</td>
                    <td className="py-3 px-4 text-slate-400">{log.target_user_id || '—'}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Detail & Management Modal */}
      <UserDetailModal
        user={selectedUser}
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        onRefresh={loadData}
      />
    </div>
  );
};
