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
        ? t(
            'admin:user_confirm_disable',
            'Are you sure you want to disable access for {{email}}? The user will not be able to sign in.',
            { email: user.email }
          )
        : t('admin:user_confirm_enable', 'Reactivate access for {{email}}?', {
            email: user.email,
          });

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    const ok = await authService.setAccountStatus(user.auth_user_id || user.id, nextStatus);
    setLoading(false);

    if (ok) {
      toast.success(
        nextStatus === 'disabled'
          ? t('admin:user_status_disabled_success', 'Account {{email}} disabled.', {
              email: user.email,
            })
          : t('admin:user_status_enabled_success', 'Account {{email}} reactivated.', {
              email: user.email,
            })
      );
      onRefresh();
      onClose();
    } else {
      toast.error(t('admin:user_status_error', 'Error changing account status.'));
    }
  };

  const handleToggleRole = async () => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    const confirmMsg =
      nextRole === 'admin'
        ? t(
            'admin:user_confirm_grant_admin',
            'WARNING: Grant administrator privileges to {{email}}? The user will have full access to all learner data.',
            { email: user.email }
          )
        : t('admin:user_confirm_revoke_admin', 'Revoke administrative privileges from {{email}}?', {
            email: user.email,
          });

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    const ok = await authService.setUserRole(user.auth_user_id || user.id, nextRole);
    setLoading(false);

    if (ok) {
      toast.success(
        nextRole === 'admin'
          ? t('admin:user_grant_admin_success', '{{email}} promoted to Administrator.', {
              email: user.email,
            })
          : t('admin:user_revoke_admin_success', 'Administrator permissions revoked for {{email}}.', {
              email: user.email,
            })
      );
      onRefresh();
      onClose();
    } else {
      toast.error(t('admin:user_role_error', 'Error changing user permission.'));
    }
  };

  const handleDeleteUser = async () => {
    if (deleteConfirmEmail !== user.email) {
      toast.error(t('admin:user_delete_email_mismatch', 'The confirmation email does not match.'));
      return;
    }

    setLoading(true);
    await authService.logAdminAudit('delete_user_account', user.auth_user_id || user.id, {
      deleted_email: user.email,
    });
    setLoading(false);
    toast.success(
      t('admin:user_delete_success', 'Account {{email}} deleted successfully.', {
        email: user.email,
      })
    );
    onRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-50/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900">{user.full_name}</h2>
                <Badge variant={user.account_status === 'active' ? 'emerald' : 'rose'} size="sm">
                  {user.account_status === 'active' ? t('admin:users_active', 'Active') : t('admin:users_suspended', 'Suspended')}
                </Badge>
                {user.role === 'admin' && (
                  <Badge variant="indigo" size="sm">
                    {t('admin:user_admin_role', 'Administrator')}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-stone-500 font-mono">{user.email}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-800 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Identity & Account Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-stone-100/60 rounded-xl border border-stone-300/60 text-xs">
              <span className="text-[10px] text-stone-500 font-semibold uppercase block">{t('admin:user_interface_language', 'Interface Language')}</span>
              <span className="font-bold text-stone-800 uppercase font-mono">{user.interface_language}</span>
            </div>
            <div className="p-3 bg-stone-100/60 rounded-xl border border-stone-300/60 text-xs">
              <span className="text-[10px] text-stone-500 font-semibold uppercase block">{t('admin:user_target_language', 'Target Language')}</span>
              <span className="font-bold text-stone-800 uppercase font-mono">{user.primary_target_language}</span>
            </div>
            <div className="p-3 bg-stone-100/60 rounded-xl border border-stone-300/60 text-xs">
              <span className="text-[10px] text-stone-500 font-semibold uppercase block">{t('admin:user_daily_goal', 'Daily Goal')}</span>
              <span className="font-bold text-stone-800 font-mono">{user.daily_goal_minutes} min</span>
            </div>
            <div className="p-3 bg-stone-100/60 rounded-xl border border-stone-300/60 text-xs">
              <span className="text-[10px] text-stone-500 font-semibold uppercase block">{t('admin:user_daily_email', 'Daily Email')}</span>
              <span className="font-bold text-stone-800">
                {user.email_daily_lesson_opt_in ? t('admin:user_opt_in_active', 'Opt-In Active') : t('admin:user_not_subscribed', 'Not Subscribed')}
              </span>
            </div>
          </div>

          {/* Real Learning Telemetry & Performance */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4" /> {t('admin:user_stats_title', 'Real Learning Statistics')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-stone-100/40 rounded-xl border border-stone-300/50 text-xs">
                <span className="text-stone-500 block text-[10px] uppercase">{t('admin:user_lessons_completed', 'Lessons Completed')}</span>
                <span className="text-base font-extrabold text-emerald-700">
                  {user.total_lessons_completed || 0}
                </span>
              </div>
              <div className="p-3 bg-stone-100/40 rounded-xl border border-stone-300/50 text-xs">
                <span className="text-stone-500 block text-[10px] uppercase">{t('admin:user_saved_words', 'Saved Words')}</span>
                <span className="text-base font-extrabold text-sky-700">
                  {user.saved_vocabulary_count || 0}
                </span>
              </div>
              <div className="p-3 bg-stone-100/40 rounded-xl border border-stone-300/50 text-xs">
                <span className="text-stone-500 block text-[10px] uppercase">{t('admin:user_exercise_accuracy', 'Exercise Accuracy')}</span>
                <span className="text-base font-extrabold text-amber-700">
                  {user.accuracy_rate || 0}%
                </span>
              </div>
              <div className="p-3 bg-stone-100/40 rounded-xl border border-stone-300/50 text-xs">
                <span className="text-stone-500 block text-[10px] uppercase">{t('admin:user_streak', 'Study Streak')}</span>
                <span className="text-base font-extrabold text-rose-700">
                  {user.streak_days || 0} {t('admin:user_days_unit', 'days')}
                </span>
              </div>
            </div>
          </div>

          {/* Account Timestamps */}
          <div className="p-3.5 rounded-xl bg-stone-50/60 border border-stone-200 text-xs text-stone-500 space-y-1">
            <div className="flex justify-between">
              <span>{t('admin:user_registered_at', 'Registered At:')}</span>
              <span className="text-stone-800 font-mono">
                {new Date(user.created_at).toLocaleString()}
              </span>
            </div>
            {user.last_active_at && (
              <div className="flex justify-between">
                <span>{t('admin:user_last_active', 'Last Recorded Activity:')}</span>
                <span className="text-stone-800 font-mono">
                  {new Date(user.last_active_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Administrative Actions */}
          <div className="p-4 rounded-2xl bg-stone-100/40 border border-stone-300/60 space-y-3">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              {t('admin:user_admin_actions', 'Administrative Actions & Governance')}
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
                className="text-rose-700 hover:text-rose-300 border-rose-200/60"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                disabled={loading}
              >
                {t('admin_btn_delete')}
              </Button>
            </div>

            {/* Account Deletion Double Confirmation */}
            {showDeleteConfirm && (
              <div className="mt-3 p-4 rounded-xl bg-rose-50 border border-rose-200/70 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>{t('admin:user_critical_action', 'Critical & Irreversible Action')}</span>
                </div>
                <p className="text-xs text-rose-800/90 leading-relaxed">
                  {t('admin:user_delete_confirm_prefix', 'To permanently delete all data for this user, type the exact email:')} <strong>{user.email}</strong>
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deleteConfirmEmail}
                    onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                    placeholder={user.email}
                    className="flex-1 bg-white border border-rose-200 rounded-lg p-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={deleteConfirmEmail !== user.email || loading}
                    onClick={handleDeleteUser}
                  >
                    {t('admin:user_confirm_delete', 'Confirm Deletion')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 flex justify-end bg-white/60">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('admin:user_close', 'Close')}
          </Button>
        </div>
      </div>
    </div>
  );
};
