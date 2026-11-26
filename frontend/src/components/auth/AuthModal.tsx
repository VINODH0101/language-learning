import React, { useEffect, useState } from 'react';
import { X, Lock, Mail, User, AlertCircle, Download, Eye, EyeOff } from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';
import { authService } from '../../services/auth';
import { Button } from '../common/Button';
import { TurnstileWidget } from '../common/TurnstileWidget';
import { UmamiProvider } from '../../services/providers/analytics/umamiProvider';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  // Guest Migration Prompt State
  const [migrationPrompt, setMigrationPrompt] = useState<{
    userId: string;
    show: boolean;
  }>({ userId: '', show: false });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg(t('auth:error_full_name', 'Please enter your full name'));
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setErrorMsg(t('auth:error_password_length', 'Password must be at least 8 characters'));
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg(t('auth:error_password_mismatch', 'Passwords do not match'));
        setLoading(false);
        return;
      }

      // Check bot protection token
      if (!turnstileToken) {
        setErrorMsg(t('auth:error_bot_verification', 'Please complete the bot protection check'));
        setLoading(false);
        return;
      }

      const res = await authService.signUp(
        email,
        password,
        fullName,
        {
          interface_language: interfaceLanguage,
        },
        turnstileToken
      );

      setLoading(false);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.user) {
        UmamiProvider.getInstance().trackEvent('registration_completed');
        toast.success(t('auth:signup_success', 'Account created successfully. Welcome aboard!'));
        // Check if there is guest data to import
        setMigrationPrompt({ userId: res.user.id, show: true });
      }
    } else if (mode === 'signin') {
      const res = await authService.signIn(email, password);
      setLoading(false);

      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.user) {
        toast.success(t('auth:signin_success', 'Signed in successfully. Welcome back!'));
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
    toast.success(
      t('auth:migration_success', 'Guest progress imported successfully.') +
        ` (${result.wordsImported})`
    );
    setMigrationPrompt({ userId: '', show: false });
    onClose();
  };

  const handleSkipMigration = () => {
    setMigrationPrompt({ userId: '', show: false });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={event => event.stopPropagation()}
        className="bg-[#FDFBF7] border border-stone-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
              <Lock className="w-4 h-4" />
            </div>
            <h2 id="auth-modal-title" className="font-serif text-base font-bold text-stone-900">
              {mode === 'signin' && t('auth_sign_in_title')}
              {mode === 'signup' && t('auth_sign_up_title')}
              {mode === 'forgot_password' && t('auth_forgot_password_title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg p-1.5 cursor-pointer transition"
            aria-label={t('common:close', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest Progress Migration Step */}
        {migrationPrompt.show ? (
          <div className="p-6 sm:p-8 space-y-5">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 mx-auto">
              <Download className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-serif text-lg font-bold text-stone-900">{t('auth:guest_migration_title', 'Preserve Guest Progress')}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t('auth_guest_migration_prompt')}
              </p>
            </div>
            <div className="space-y-2.5 pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleConfirmMigration}
                disabled={loading}
              >
                {t('auth_guest_migration_confirm')}
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full"
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
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t('auth_full_name_label')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('auth:full_name_placeholder', 'Your full name')}
                    className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {t('auth_email_label')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth:email_placeholder', 'you@example.com')}
                  className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {mode !== 'forgot_password' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    {t('auth_password_label')}
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot_password')}
                      className="text-[11px] text-amber-700 hover:text-amber-800 cursor-pointer"
                    >
                      {t('auth_forgot_password_link')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-10 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-2 top-2 p-1.5 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                    aria-label={showPassword ? t('auth:hide_password', 'Hide password') : t('auth:show_password', 'Show password')}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t('auth_confirm_password_label')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-10 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    className="absolute right-2 top-2 p-1.5 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                    aria-label={
                      showConfirmPassword
                        ? t('auth:hide_password', 'Hide password')
                        : t('auth:show_password', 'Show password')
                    }
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {(mode === 'signup' || mode === 'forgot_password') && (
              <TurnstileWidget
                action={mode}
                onVerify={(token) => {
                  setTurnstileToken(token);
                  setErrorMsg(null);
                }}
                onError={(err) => setErrorMsg(err)}
                onExpire={() => setTurnstileToken('')}
              />
            )}

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                disabled={loading}
              >
                {loading
                  ? t('common:loading', 'Aguarde...')
                  : mode === 'signin'
                  ? t('auth_sign_in_btn')
                  : mode === 'signup'
                  ? t('auth_sign_up_btn')
                  : t('auth_reset_btn')}
              </Button>
            </div>

            {/* Toggle Modes Footer */}
            <div className="pt-3 border-t border-stone-200 text-center text-xs text-stone-500">
              {mode === 'signin' ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
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
                  className="text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
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
