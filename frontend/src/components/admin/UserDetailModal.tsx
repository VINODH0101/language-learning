import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  ShieldAlert,
  Calendar,
  Clock,
  BookOpen,
  Award,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { useI18n } from '../../i18n/i18nContext';
import { authService } from '../../services/auth';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { toast } from 'sonner';

interface UserDetailModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !user) return null;

  const handleToggleStatus = async () => {
    const nextStatus = user.account_status === 'active' ? 'disabled' : 'active';
    const confirmMsg =
      nextStatus === 'disabled'
        ? `Tem certeza de que deseja desativar o acesso de ${user.email}? O usuário não conseguirá fazer login.`
        : `Deseja reativar o acesso da conta ${user.email}?`;

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    const ok = await authService.setAccountStatus(user.auth_user_id || user.id, nextStatus);
    setLoading(false);

    if (ok) {
      toast.success(
        nextStatus === 'disabled'
          ? `Conta de ${user.email} desativada.`
          : `Conta de ${user.email} reativada.`
      );
      onRefresh();
      onClose();
    } else {
      toast.error('Erro ao alterar status da conta.');
    }
  };

  const handleToggleRole = async () => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    const confirmMsg =
      nextRole === 'admin'
        ? `ATENÇÃO: Conceder privilégios de Administrador a ${user.email}? O usuário terá acesso completo aos dados de todos os alunos.`
        : `Revogar privilégios administrativos de ${user.email}?`;

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    const ok = await authService.setUserRole(user.auth_user_id || user.id, nextRole);
    setLoading(false);

    if (ok) {
      toast.success(
        nextRole === 'admin'
          ? `${user.email} promovido a Administrador.`
          : `Permissões de administrador revogadas para ${user.email}.`
      );
      onRefresh();
      onClose();
    } else {
      toast.error('Erro ao alterar permissão do usuário.');
    }
  };

  const handleDeleteUser = async () => {
    if (deleteConfirmEmail !== user.email) {
      toast.error('O email informado para confirmação não coincide.');
      return;
    }

    setLoading(true);
    await authService.logAdminAudit('delete_user_account', user.auth_user_id || user.id, {
      deleted_email: user.email,
    });
    setLoading(false);
    toast.success(`Conta de ${user.email} excluída com sucesso.`);
    onRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">{user.full_name}</h2>
                <Badge variant={user.account_status === 'active' ? 'emerald' : 'rose'} size="sm">
                  {user.account_status === 'active' ? 'Ativo' : 'Desativado'}
                </Badge>
                {user.role === 'admin' && (
                  <Badge variant="indigo" size="sm">
                    Administrador
                  </Badge>
                )}
              </div>
              <span className="text-xs text-slate-400 font-mono">{user.email}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Identity & Account Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Idioma Interface</span>
              <span className="font-bold text-slate-200 uppercase font-mono">{user.interface_language}</span>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Idioma Alvo</span>
              <span className="font-bold text-slate-200 uppercase font-mono">{user.primary_target_language}</span>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Meta Diária</span>
              <span className="font-bold text-slate-200 font-mono">{user.daily_goal_minutes} min/dia</span>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Email Diário</span>
              <span className="font-bold text-slate-200">
                {user.email_daily_lesson_opt_in ? 'Opt-In Ativo' : 'Não Inscrito'}
              </span>
            </div>
          </div>

          {/* Real Learning Telemetry & Performance */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Estatísticas Reais de Aprendizagem
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 text-xs">
                <span className="text-slate-400 block text-[10px] uppercase">Lições Concluídas</span>
                <span className="text-base font-extrabold text-emerald-400">
                  {user.total_lessons_completed || 0}
                </span>
              </div>
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 text-xs">
                <span className="text-slate-400 block text-[10px] uppercase">Vocábulos Salvos</span>
                <span className="text-base font-extrabold text-sky-400">
                  {user.saved_vocabulary_count || 0}
                </span>
              </div>
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 text-xs">
                <span className="text-slate-400 block text-[10px] uppercase">Acurácia Exercícios</span>
                <span className="text-base font-extrabold text-amber-400">
                  {user.accuracy_rate || 0}%
                </span>
              </div>
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 text-xs">
                <span className="text-slate-400 block text-[10px] uppercase">Ofensiva de Estudo</span>
                <span className="text-base font-extrabold text-rose-400">
                  {user.streak_days || 0} dias
                </span>
              </div>
            </div>
          </div>

          {/* Account Timestamps */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Data de Registro:</span>
              <span className="text-slate-200 font-mono">
                {new Date(user.created_at).toLocaleString()}
              </span>
            </div>
            {user.last_active_at && (
              <div className="flex justify-between">
                <span>Última Atividade Registrada:</span>
                <span className="text-slate-200 font-mono">
                  {new Date(user.last_active_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Administrative Actions */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Ações Administrativas Governança
            </h4>
            <div className="flex flex-wrap gap-2.5">
              <Button
                variant={user.account_status === 'active' ? 'danger' : 'primary'}
                size="sm"
                onClick={handleToggleStatus}
                disabled={loading}
              >
                {user.account_status === 'active' ? t('admin_btn_disable') : t('admin_btn_enable')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                icon={<Shield className="w-3.5 h-3.5" />}
                onClick={handleToggleRole}
                disabled={loading}
              >
                {user.role === 'admin' ? t('admin_btn_remove_admin') : t('admin_btn_make_admin')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-rose-400 hover:text-rose-300 border-rose-800/60"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                disabled={loading}
              >
                {t('admin_btn_delete')}
              </Button>
            </div>

            {/* Account Deletion Double Confirmation */}
            {showDeleteConfirm && (
              <div className="mt-3 p-4 rounded-xl bg-rose-950/30 border border-rose-800/70 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Ação Crítica e Irreversível</span>
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  Para confirmar a exclusão permanente de todos os dados deste usuário, digite o email exato: <strong>{user.email}</strong>
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deleteConfirmEmail}
                    onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                    placeholder={user.email}
                    className="flex-1 bg-slate-900 border border-rose-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={deleteConfirmEmail !== user.email || loading}
                    onClick={handleDeleteUser}
                  >
                    Confirmar Exclusão
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900/60">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
