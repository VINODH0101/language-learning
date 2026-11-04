/**
 * Lexilume — Admin User Governance & Learning Telemetry Component
 * Pillar 2 of the Administrative Workbench
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Shield,
  Activity,
  Award,
  BookOpen,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { authService } from '../../services/auth';
import { adminService } from '../../services/adminService';
import { UserDetailModal } from '../../components/admin/UserDetailModal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { getLanguageName } from '../../lib/languages/languageMatrix';
import { useI18n } from '../../i18n/i18nContext';
import { toast } from 'sonner';

export const AdminUserManagement: React.FC = () => {
  const { t } = useI18n();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [targetLangFilter, setTargetLangFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await authService.getAdminUserList();
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users', err);
      toast.error(t('admin:users_load_error', 'Error loading the learner list.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    const unsub = adminService.subscribe(loadUsers);
    return unsub;
  }, []);

  const handleToggleStatus = async (user: UserProfile) => {
    const newStatus = user.account_status === 'active' ? 'disabled' : 'active';
    try {
      await adminService.updateUserStatus(user.id, newStatus);
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, account_status: newStatus } : u))
      );
      toast.success(
        t('admin:users_status_updated', 'Account {{name}} was {{status}}.', {
          name: user.full_name || user.email,
          status: t(
            newStatus === 'active' ? 'admin:users_status_active_word' : 'admin:users_status_suspended_word',
            newStatus === 'active' ? 'activated' : 'suspended'
          ),
        })
      );
    } catch {
      toast.error(t('admin:users_status_error', 'Error changing account status.'));
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || u.account_status === statusFilter;
    const matchesLang = targetLangFilter === 'all' || u.primary_target_language === targetLangFilter;

    return matchesSearch && matchesStatus && matchesLang;
  });

  return (
    <div className="space-y-6">
      {/* User Governance Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-amber-500/10 border border-amber-400/20 text-amber-700">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              {t('admin:users_kicker', 'User Governance & Accounts')}
            </span>
            <Badge variant="indigo" size="sm">
              {t('admin:users_registered', '{{count}} Registered', { count: users.length })}
            </Badge>
          </div>
          <h2 className="font-serif text-xl font-bold text-stone-900">
            {t('admin:users_heading', 'Learner Management & Audit')}
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            {t('admin:users_desc', 'Inspect individual progress, account status, active learning tracks, and security roles.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={loadUsers}
            className="cursor-pointer"
          >
            {t('admin:users_refresh', 'Refresh List')}
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('admin:users_search', 'Search by name, email or ID...')}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Filter className="w-3.5 h-3.5" />
            <span>{t('admin:users_status', 'Status:')}</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-400"
          >
            <option value="all">{t('admin:users_all', 'All ({{count}})', { count: users.length })}</option>
            <option value="active">{t('admin:users_active', 'Active')}</option>
            <option value="disabled">{t('admin:users_suspended', 'Suspended')}</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-stone-500 ml-2">
            <span>{t('admin:users_language', 'Language:')}</span>
          </div>
          <select
            value={targetLangFilter}
            onChange={e => setTargetLangFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-400"
          >
            <option value="all">{t('admin:users_all_languages', 'All Languages')}</option>
            {(['pt', 'es', 'en'] as const).map(lang => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()} — {getLanguageName(lang)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50/70 border-b border-stone-200 text-[11px] uppercase tracking-wider text-stone-500">
              <tr>
                <th className="py-3 px-4">{t('admin:users_col_user', 'Learner')}</th>
                <th className="py-3 px-4">{t('admin:users_col_role', 'Role')}</th>
                <th className="py-3 px-4">{t('admin:users_col_status', 'Status')}</th>
                <th className="py-3 px-4">{t('admin:users_col_track', 'Target Track')}</th>
                <th className="py-3 px-4 text-center">{t('admin:users_col_lessons', 'Lessons')}</th>
                <th className="py-3 px-4 text-center">{t('admin:users_col_streak', 'Streak')}</th>
                <th className="py-3 px-4 text-right">{t('admin:users_col_actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-500">
                    {t('admin:users_empty', 'No learners match the current filters.')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-stone-100/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900">
                        {user.full_name || t('admin:users_no_name', 'No name recorded')}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono">{user.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={user.role === 'admin' ? 'rose' : 'slate'} size="sm">
                        {user.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={user.account_status === 'active' ? 'emerald' : 'rose'} size="sm">
                        {user.account_status === 'active'
                          ? t('admin:users_active', 'Active')
                          : t('admin:users_suspended', 'Suspended')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-stone-800">
                        {(user.primary_target_language || 'pt').toUpperCase()}
                      </span>
                      <span className="text-stone-500 text-[10px] ml-1">
                        ({getLanguageName((user.primary_target_language as any) || 'pt')})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-stone-800 font-bold">
                      {user.total_lessons_completed || 0}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-amber-700 font-bold">
                      {user.streak_days || 0}d
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedUser(user)}
                          className="cursor-pointer"
                        >
                          {t('admin:users_view', 'View Details')}
                        </Button>
                        <Button
                          variant={user.account_status === 'active' ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleStatus(user)}
                          className={`cursor-pointer ${
                            user.account_status === 'active'
                              ? 'text-rose-700 hover:bg-rose-50/40 border-rose-200/50'
                              : 'bg-emerald-600 hover:bg-emerald-500'
                          }`}
                        >
                          {user.account_status === 'active'
                            ? t('admin:users_suspend', 'Suspend')
                            : t('admin:users_activate', 'Activate')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onRefresh={loadUsers}
        />
      )}
    </div>
  );
};
