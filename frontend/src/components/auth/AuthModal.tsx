import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';
import { authService } from '../../services/auth';
import { Button } from '../common/Button';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup' | 'forgot_password';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signin',
}) => {
  const { t, interfaceLanguage } = useI18n();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot_password'>(defaultMode);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Guest Migration Prompt State
  const [migrationPrompt, setMigrationPrompt] = useState<{
    userId: string;
    show: boolean;
  }>({ userId: '', show: false });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('Por favor, informe seu nome completo.');
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setErrorMsg(t('auth_password_min_length'));
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg(t('auth_password_mismatch'));
        setLoading(false);
        return;
      }

      const res = await authService.signUp(email, password, fullName, {
        interface_language: interfaceLanguage,
      });

      setLoading(false);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.user) {
        toast.success(`Conta criada com sucesso! Bem-vindo(a), ${res.user.full_name}!`);
        // Check if there is guest data to import
        setMigrationPrompt({ userId: res.user.id, show: true });
      }
    } else if (mode === 'signin') {
      const res = await authService.signIn(email, password);
      setLoading(false);

      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.user) {
        toast.success(`Login realizado com sucesso! Olá, ${res.user.full_name}!`);
        onClose();
      }
    } else if (mode === 'forgot_password') {
      const res = await authService.resetPassword(email);
      setLoading(false);
      if (res.success) {
        toast.success(res.message);
        setMode('signin');
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  const handleConfirmMigration = async () => {
    setLoading(true);
    const result = await authService.migrateGuestProgress(migrationPrompt.userId);
    setLoading(false);
    toast.success(`Importação concluída: ${result.wordsImported} vocábulos salvos com segurança.`);
    setMigrationPrompt({ userId: '', show: false });
    onClose();
  };

  const handleSkipMigration = () => {
    setMigrationPrompt({ userId: '', show: false });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
              <Lock className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-100">
              {mode === 'signin' && t('auth_sign_in_title')}
              {mode === 'signup' && t('auth_sign_up_title')}
              {mode === 'forgot_password' && t('auth_forgot_password_title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest Progress Migration Step */}
        {migrationPrompt.show ? (
          <div className="p-6 sm:p-8 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/70 border border-indigo-700 flex items-center justify-center text-indigo-400 mx-auto">
              <Download className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-100">Preservar Progresso de Visitante</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t('auth_guest_migration_prompt')}
              </p>
            </div>
            <div className="space-y-2.5 pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={handleConfirmMigration}
                disabled={loading}
              >
                {t('auth_guest_migration_confirm')}
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full text-slate-400"
                onClick={handleSkipMigration}
                disabled={loading}
              >
                {t('auth_guest_migration_skip')}
              </Button>
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('auth_full_name_label')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu Nome Completo"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('auth_email_label')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@polyglot.dev"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {mode !== 'forgot_password' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    {t('auth_password_label')}
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot_password')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      {t('auth_forgot_password_link')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('auth_confirm_password_label')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={loading}
              >
                {loading
                  ? 'Aguarde...'
                  : mode === 'signin'
                  ? t('auth_sign_in_btn')
                  : mode === 'signup'
                  ? t('auth_sign_up_btn')
                  : t('auth_reset_btn')}
              </Button>
            </div>

            {/* Toggle Modes Footer */}
            <div className="pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
              {mode === 'signin' ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  {t('auth_no_account')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  {t('auth_back_to_sign_in')}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
