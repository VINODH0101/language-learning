import React, { useState, useEffect } from 'react';
import {
  Save,
  CheckCircle,
  Globe,
  Clock,
  Mail,
  ShieldAlert,
  Layers,
  Sparkles,
} from 'lucide-react';
import { UserSettings, StudyMode, CEFRLevel, Course, ExplanationLanguage, RegionalVariety, Language } from '../types';
import { StorageService } from '../services/storage';
import { courseService } from '../services/courseService';
import { useI18n } from '../i18n/i18nContext';
import { authService } from '../services/auth';
import {
  enforceRegionalVariety,
  REGIONAL_VARIETIES_BY_LANGUAGE,
  REGIONAL_VARIETY_METADATA,
  LANGUAGE_METADATA,
  getLanguageName,
  getRegionalVarietyLabel,
} from '../lib/languages/languageMatrix';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Badge } from '../components/common/Badge';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { t, interfaceLanguage, setInterfaceLanguage, theme, setTheme } = useI18n();
  const [settings, setSettings] = useState<UserSettings>(StorageService.getSettings());
  const [courses, setCourses] = useState<Course[]>(courseService.getCourses());
  const [activeCourse, setActiveCourse] = useState<Course>(courseService.getActiveCourse());
  const [explanationLang, setExplanationLang] = useState<ExplanationLanguage>(() => {
    try {
      const active = courseService.getActiveCourse();
      if (active?.explanation_language) return active.explanation_language;
      const saved = localStorage.getItem('polyglot_explanation_lang');
      if (saved === 'en' || saved === 'pt' || saved === 'es') return saved;
    } catch {}
    return 'en';
  });
  const [emailOptIn, setEmailOptIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('polyglot_email_opt_in') === 'true';
    } catch {
      return false;
    }
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const unsub = courseService.subscribe((all, active) => {
      setCourses(all);
      setActiveCourse(active);
      if (active?.explanation_language) {
        setExplanationLang(active.explanation_language);
      }
    });
    return unsub;
  }, []);

  const handleActiveCourseChange = (courseId: string) => {
    try {
      const newActive = courseService.setActiveCourse(courseId);
      setActiveCourse(newActive);
      setExplanationLang(newActive.explanation_language);
      toast.success(`Curso ativo: ${getLanguageName(newActive.target_language, interfaceLanguage)}`);
    } catch {
      toast.error('Erro ao trocar curso.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settings);

    try {
      localStorage.setItem('lexilume_explanation_lang', explanationLang);
      localStorage.setItem('polyglot_explanation_lang', explanationLang);
      localStorage.setItem('lexilume_email_opt_in', emailOptIn ? 'true' : 'false');
      localStorage.setItem('polyglot_email_opt_in', emailOptIn ? 'true' : 'false');
    } catch {}

    // Synchronize current course in courseService with selected explanation language and variety
    if (activeCourse) {
      const activeVariety =
        activeCourse.target_language === 'pt'
          ? settings.pt_variety
          : activeCourse.target_language === 'es'
          ? settings.es_variety
          : (settings.en_variety || 'en-US');

      courseService.updateCourse(activeCourse.id, {
        explanation_language: explanationLang,
        regional_variant: enforceRegionalVariety(activeCourse.target_language, activeVariety),
      });
    }

    // Also update track states in storage
    const ptTrack = StorageService.getTrackState('pt');
    ptTrack.regional_variety = settings.pt_variety;
    StorageService.saveTrackState(ptTrack);

    const esTrack = StorageService.getTrackState('es');
    esTrack.regional_variety = settings.es_variety;
    StorageService.saveTrackState(esTrack);

    // If authenticated, also persist to Supabase profile
    const auth = authService.getState();
    if (auth.user) {
      authService.updateProfile({
        interface_language: interfaceLanguage,
        explanation_language: explanationLang,
        email_daily_lesson_opt_in: emailOptIn,
        theme,
      });
    }

    setSavedSuccess(true);
    toast.success(t('settings_saved_success'));
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const activeTargetLang = activeCourse?.target_language || 'pt';
  const activeVarietyOptions = REGIONAL_VARIETIES_BY_LANGUAGE[activeTargetLang] || ['all'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header with Title and Decoupled Matrix Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{t('settings_title')}</h1>
            <p className="text-xs text-slate-400 mt-1">
              {t('settings_subtitle')}
            </p>
          </div>
          {/* Live Matrix Decoupled Badges */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 font-mono text-xs">
            <Badge variant="indigo" size="sm">
              {t('matrix_badge_interface')}: {interfaceLanguage.toUpperCase()}
            </Badge>
            <Badge variant="emerald" size="sm">
              {t('matrix_badge_learning')}: {LANGUAGE_METADATA[activeTargetLang]?.flag} {activeTargetLang.toUpperCase()}
            </Badge>
            <Badge variant="sky" size="sm">
              {t('matrix_badge_variety')}: {activeCourse?.regional_variant || 'all'}
            </Badge>
            <Badge variant="amber" size="sm">
              {t('matrix_badge_explanation')}: {explanationLang.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <Alert type="success" title={t('settings_saved_success')}>
          {t('settings_saved_success')}
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Card: Decoupled 4-Way Language Separation Architecture */}
        <Card
          title={t('settings_decoupled_matrix_title')}
          subtitle={t('settings_decoupled_matrix_subtitle')}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Interface Language (UI Chrome) */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    1. {t('settings_interface_lang')}
                  </label>
                  <span className="text-[10px] text-slate-400">UI & Menus</span>
                </div>
                <select
                  value={interfaceLanguage}
                  onChange={(e) => setInterfaceLanguage(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
                >
                  <option value="en">🇬🇧 English (Interface Chrome)</option>
                  <option value="pt">🇵🇹 Português (Interface do Sistema)</option>
                  <option value="es">🇪🇸 Español (Interfaz del Sistema)</option>
                </select>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Controls buttons, tab bars, notifications, and headers. Completely independent of what you study.
                </p>
              </div>

              {/* 2. Active Course Learning Target */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    2. {t('settings_learning_lang')}
                  </label>
                  <span className="text-[10px] text-slate-400">Target Study</span>
                </div>
                <select
                  value={activeCourse?.id || ''}
                  onChange={(e) => handleActiveCourseChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {LANGUAGE_METADATA[c.target_language]?.flag} {getLanguageName(c.target_language, interfaceLanguage)} ({c.cefr_level} • {c.regional_variant})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The language you are acquiring: daily reading texts, dialogues, and target exercise forms.
                </p>
              </div>

              {/* 3. Explanation Language (Pedagogy & Grammar) */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                    3. {t('settings_explanation_lang')}
                  </label>
                  <span className="text-[10px] text-slate-400">Grammar & Glosses</span>
                </div>
                <select
                  value={explanationLang}
                  onChange={(e) => setExplanationLang(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
                >
                  <option value="en">English (Grammar explanations & glosses in English)</option>
                  <option value="pt">Português (Explicações teóricas e notas em Português)</option>
                  <option value="es">Español (Explicaciones teóricas y notas en Español)</option>
                </select>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Language used to instruct: syntactic formulas, false friend warnings, and error explanations.
                </p>
              </div>

              {/* 4. Regional Variety (Dialect / Accent for Active Course) */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-sky-300 uppercase tracking-wider">
                    4. {t('settings_regional_variety')} ({getLanguageName(activeTargetLang, interfaceLanguage)})
                  </label>
                  <span className="text-[10px] text-slate-400">Phonetics & TTS</span>
                </div>
                <select
                  value={
                    activeTargetLang === 'pt'
                      ? settings.pt_variety
                      : activeTargetLang === 'es'
                      ? settings.es_variety
                      : (settings.en_variety || 'en-US')
                  }
                  onChange={(e) => {
                    const val = e.target.value as RegionalVariety;
                    if (activeTargetLang === 'pt') setSettings({ ...settings, pt_variety: val as any });
                    else if (activeTargetLang === 'es') setSettings({ ...settings, es_variety: val as any });
                    else setSettings({ ...settings, en_variety: val as any });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
                >
                  {activeVarietyOptions.map(v => (
                    <option key={v} value={v}>
                      {REGIONAL_VARIETY_METADATA[v]?.flag || '🌐'} {getRegionalVarietyLabel(v, interfaceLanguage)}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Controls pronunciation audio synthesis locale and regional grammatical nuances.
                </p>
              </div>
            </div>

            {/* Appearance Theme Selector */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-300 block">{t('settings_theme_label')}</span>
                <span className="text-[11px] text-slate-500">Ajuste o modo de exibição de cores da interface</span>
              </div>
              <div className="w-full sm:w-60">
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="dark">{t('theme_dark')}</option>
                  <option value="light">{t('theme_light')}</option>
                  <option value="system">{t('theme_system')}</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Global Regional Dialect Standards across all language tracks */}
        <Card
          title="Padrões Dialetais Globais por Idioma"
          subtitle="Variantes padrão salvas no perfil para cada idioma estudado"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('settings_pt_variety')}
              </label>
              <select
                value={settings.pt_variety}
                onChange={(e) => setSettings({ ...settings, pt_variety: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="pt-BR">🇧🇷 Português Brasileiro (pt-BR)</option>
                <option value="pt-PT">🇵🇹 Português Europeu (pt-PT)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('settings_es_variety')}
              </label>
              <select
                value={settings.es_variety}
                onChange={(e) => setSettings({ ...settings, es_variety: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="es-ES">🇪🇸 Peninsular (es-ES)</option>
                <option value="es-419">🌎 Hispanoamericano (es-419)</option>
                <option value="es-MX">🇲🇽 Mexicano (es-MX)</option>
                <option value="es-AR">🇦🇷 Rioplatense (es-AR)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('settings_en_variety')}
              </label>
              <select
                value={settings.en_variety || 'en-US'}
                onChange={(e) => setSettings({ ...settings, en_variety: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="en-US">🇺🇸 American English (en-US)</option>
                <option value="en-GB">🇬🇧 British English (en-GB)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Study Mode & Duration */}
        <Card
          title={t('settings_study_mode_title')}
          subtitle={t('settings_study_mode_subtitle')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setSettings({ ...settings, study_mode: 'full' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                settings.study_mode === 'full'
                  ? 'border-indigo-500 bg-indigo-950/40 text-slate-100'
                  : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="font-bold text-sm">{t('settings_study_mode_full_title')}</div>
              <p className="text-xs text-slate-400 mt-1">
                {t('settings_study_mode_full_desc')}
              </p>
            </div>

            <div
              onClick={() => setSettings({ ...settings, study_mode: 'compact' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                settings.study_mode === 'compact'
                  ? 'border-indigo-500 bg-indigo-950/40 text-slate-100'
                  : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="font-bold text-sm">{t('settings_study_mode_compact_title')}</div>
              <p className="text-xs text-slate-400 mt-1">
                {t('settings_study_mode_compact_desc')}
              </p>
            </div>
          </div>
        </Card>

        {/* Delivery & Schedule Preferences */}
        <Card
          title="Preferências de Notificação e Email Diário"
          subtitle="Configuração de fuso horário e entrega matinal via automação GitHub Actions"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email do Destinatário
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Fuso Horário Configurado
              </label>
              <input
                type="text"
                value={settings.target_timezone}
                onChange={(e) => setSettings({ ...settings, target_timezone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="email_opt_in"
                checked={emailOptIn}
                onChange={(e) => setEmailOptIn(e.target.checked)}
                className="mt-0.5 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="email_opt_in" className="text-xs text-slate-300 cursor-pointer">
                <span className="font-bold text-slate-200 block">{t('settings_email_opt_in_title')}</span>
                <span className="text-slate-400 text-[11px]">{t('settings_email_opt_in_desc')}</span>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
              <input
                type="checkbox"
                id="email_notifications"
                checked={settings.email_notifications_enabled}
                onChange={(e) => setSettings({ ...settings, email_notifications_enabled: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="email_notifications" className="text-xs text-slate-300 cursor-pointer">
                Notificações de sistema e alertas de ofensiva de estudo
              </label>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button variant="primary" size="lg" icon={<Save className="w-4 h-4" />}>
            {t('settings_save_btn')}
          </Button>
        </div>
      </form>

    </div>
  );
};
