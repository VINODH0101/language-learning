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
import { SUPPORTED_LEARNING_LANGUAGES, getLanguageName } from '../../lib/languages/languageMatrix';
import { toast } from 'sonner';

export const AdminUserManagement: React.FC = () => {
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
      toast.error('Erro ao carregar lista de usuários.');
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
        `Conta de ${user.full_name || user.email} foi ${newStatus === 'active' ? 'ativada' : 'suspensa'}.`
      );
    } catch {
      toast.error('Erro ao alterar status da conta.');
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Governança de Usuários & Contas
            </span>
            <Badge variant="indigo" size="sm">
              {users.length} Registrados
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-slate-100">Gestão e Auditoria de Alunos</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Inspeção de progresso individual, status de conta, trilhas de aprendizagem ativas e papéis de segurança.
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
            Atualizar Lista
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, email ou ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos ({users.length})</option>
            <option value="active">Ativos</option>
            <option value="disabled">Suspensos</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-2">
            <span>Idioma:</span>
          </div>
          <select
            value={targetLangFilter}
            onChange={e => setTargetLangFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos os Idiomas</option>
            {SUPPORTED_LEARNING_LANGUAGES.map(lang => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()} — {getLanguageName(lang)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Papel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Trilha Alvo</th>
                <th className="py-3 px-4 text-center">Lições</th>
                <th className="py-3 px-4 text-center">Ofensiva</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum usuário encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">
                        {user.full_name || 'Sem nome registrado'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={user.role === 'admin' ? 'rose' : 'slate'} size="sm">
                        {user.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={user.account_status === 'active' ? 'emerald' : 'rose'} size="sm">
                        {user.account_status === 'active' ? 'Ativo' : 'Suspenso'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-200">
                        {(user.primary_target_language || 'pt').toUpperCase()}
                      </span>
                      <span className="text-slate-500 text-[10px] ml-1">
                        ({getLanguageName((user.primary_target_language as any) || 'pt')})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-200 font-bold">
                      {user.total_lessons_completed || 0}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-amber-400 font-bold">
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
                          Ver Detalhes
                        </Button>
                        <Button
                          variant={user.account_status === 'active' ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleStatus(user)}
                          className={`cursor-pointer ${
                            user.account_status === 'active'
                              ? 'text-rose-400 hover:bg-rose-950/40 border-rose-800/50'
                              : 'bg-emerald-600 hover:bg-emerald-500'
                          }`}
                        >
                          {user.account_status === 'active' ? 'Suspender' : 'Ativar'}
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
