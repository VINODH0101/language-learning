import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Globe,
  Languages,
  BookOpen,
  Award,
  Zap,
  Target,
  Compass,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';
import { InterfaceLanguage } from '../../i18n/translations';
import { CEFRLevel, Language, SessionDuration, RegionalVariety } from '../../types';
import { authService } from '../../services/auth';
import { courseService } from '../../services/courseService';
import {
  REGIONAL_VARIETIES_BY_LANGUAGE,
  REGIONAL_VARIETY_METADATA,
  DEFAULT_REGIONAL_VARIETY,
  enforceRegionalVariety,
  getLanguageName,
} from '../../lib/languages/languageMatrix';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface GuidedOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartLesson?: () => void;
}

export const GuidedOnboardingModal: React.FC<GuidedOnboardingModalProps> = ({
  isOpen,
  onClose,
  onStartLesson,
}) => {
  const { t, interfaceLanguage, setInterfaceLanguage } = useI18n();
  const [step, setStep] = useState<number>(1);

  // Onboarding Selection State
  const [targetLang, setTargetLang] = useState<Language>('pt');
  const [regionalVariant, setRegionalVariant] = useState<RegionalVariety>('pt-BR');
  const [explanationLang, setExplanationLang] = useState<InterfaceLanguage>(interfaceLanguage);
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B2');
  const [sessionDuration, setSessionDuration] = useState<SessionDuration>('10');

  if (!isOpen) return null;

  const totalSteps = 8;

  const handleSelectTargetLang = (lang: Language) => {
    setTargetLang(lang);
    setRegionalVariant(DEFAULT_REGIONAL_VARIETY[lang]);
  };

  const handleFinish = async () => {
    try {
      localStorage.setItem('polyglot_onboarding_completed', 'true');
      localStorage.setItem('polyglot_target_lang', targetLang);
      localStorage.setItem('polyglot_explanation_lang', explanationLang);
      localStorage.setItem('polyglot_regional_variety', regionalVariant);
      localStorage.setItem('polyglot_cefr_level', cefrLevel);
      localStorage.setItem('polyglot_session_duration', sessionDuration);

      // Create and activate course in CourseService
      courseService.createCourse({
        target_language: targetLang,
        regional_variant: regionalVariant,
        cefr_level: cefrLevel,
        explanation_language: explanationLang,
        daily_goal_minutes: parseInt(sessionDuration, 10),
        streak_days: 1,
        total_lessons_completed: 0,
        completed_curriculum_node_ids: [],
        is_active: true,
      });

      const auth = authService.getState();
      if (auth.user) {
        await authService.updateProfile({
          onboarding_completed: true,
          interface_language: interfaceLanguage,
          explanation_language: explanationLang,
          primary_target_language: targetLang,
          daily_goal_minutes: parseInt(sessionDuration, 10),
        });
      }
    } catch {}

    onClose();
    if (onStartLesson) onStartLesson();
  };

  const handleSkip = () => {
    try {
      localStorage.setItem('polyglot_onboarding_completed', 'true');
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Progress Bar & Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              {t('onboarding_step')} {step} de {totalSteps}
            </span>
            <div className="flex gap-1 ml-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i + 1 === step
                      ? 'w-6 bg-indigo-500'
                      : i + 1 < step
                      ? 'w-2 bg-indigo-700'
                      : 'w-2 bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            {t('onboarding_skip')}
          </button>
        </div>

        {/* Step Body */}
        <div className="p-6 sm:p-8 space-y-6 flex-1 min-h-[340px]">
          {/* STEP 1: Welcome */}
          {step === 1 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white mx-auto shadow-lg">
                <GraduationCap className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-100">
                {t('onboarding_step1_title')}
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                {t('onboarding_step1_desc')}
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <Badge variant="indigo" size="sm">Authentic C1 Readings</Badge>
                <Badge variant="emerald" size="sm">Native Audio & Practical Sentences</Badge>
                <Badge variant="amber" size="sm">False Friends Drills</Badge>
              </div>
            </div>
          )}

          {/* STEP 2: Interface Language */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100">{t('onboarding_step2_title')}</h3>
                <p className="text-xs text-slate-400">{t('onboarding_step2_desc')}</p>
              </div>
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {[
                  { id: 'en' as const, label: 'English', desc: 'Default interface language' },
                  { id: 'pt' as const, label: 'Português', desc: 'Interface em português brasileiro/europeu' },
                  { id: 'es' as const, label: 'Español', desc: 'Interfaz en español' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setInterfaceLanguage(opt.id)}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition ${
                      interfaceLanguage === opt.id
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-100 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-sm block text-slate-100">{opt.label}</span>
                      <span className="text-xs text-slate-400">{opt.desc}</span>
                    </div>
                    {interfaceLanguage === opt.id && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Primary Target Language */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100">{t('onboarding_step3_title')}</h3>
                <p className="text-xs text-slate-400">{t('onboarding_step3_desc')}</p>
              </div>
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {[
                  { id: 'pt' as const, label: 'Português', desc: 'Variedades pt-BR e pt-PT com leitura C1 e áudios nativos' },
                  { id: 'es' as const, label: 'Español', desc: 'Variedades es-ES y es-419 con gramática avanzada y comprensión' },
                  { id: 'en' as const, label: 'English (para falantes de PT/ES)', desc: 'Desafios de tradução inversa para dominar inglês' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectTargetLang(opt.id as any)}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition ${
                      targetLang === opt.id
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-100 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-sm block text-slate-100">{opt.label}</span>
                      <span className="text-xs text-slate-400">{opt.desc}</span>
                    </div>
                    {targetLang === opt.id && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Regional Variety Qualified by Target Learning Language */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100">
                  Variedade Dialetal de {getLanguageName(targetLang, interfaceLanguage)}
                </h3>
                <p className="text-xs text-slate-400">
                  Qualifique o sotaque, convenções gramaticais e síntese de voz (TTS) para o aprendizado de {getLanguageName(targetLang, interfaceLanguage)}.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {REGIONAL_VARIETIES_BY_LANGUAGE[targetLang].filter(v => v !== 'all').map(varId => {
                  const meta = REGIONAL_VARIETY_METADATA[varId];
                  return (
                    <button
                      key={varId}
                      onClick={() => setRegionalVariant(varId)}
                      className={`p-4 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition ${
                        regionalVariant === varId
                          ? 'bg-indigo-950/60 border-indigo-500 text-indigo-100 shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{meta.flag}</span>
                        <div>
                          <span className="font-bold text-sm block text-slate-100">
                            {interfaceLanguage === 'pt' ? meta.labelPt : interfaceLanguage === 'es' ? meta.labelEs : meta.labelEn}
                          </span>
                          <span className="text-xs text-slate-400">
                            Áudio nativo calibrado & fonética ({meta.voiceLocale})
                          </span>
                        </div>
                      </div>
                      {regionalVariant === varId && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Explanation Language Independently */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100">{t('onboarding_step4_title')}</h3>
                <p className="text-xs text-slate-400">{t('onboarding_step4_desc')}</p>
              </div>
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {[
                  { id: 'en' as const, label: 'English Explanations', desc: 'Grammar and false cognate notes explained in English' },
                  { id: 'pt' as const, label: 'Explicações em Português', desc: 'Análise linguística detalhada em português' },
                  { id: 'es' as const, label: 'Explicaciones en Español', desc: 'Fórmulas y reglas estructurales en español' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setExplanationLang(opt.id)}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition ${
                      explanationLang === opt.id
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-100 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-sm block text-slate-100">{opt.label}</span>
                      <span className="text-xs text-slate-400">{opt.desc}</span>
                    </div>
                    {explanationLang === opt.id && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: CEFR Level */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100">{t('onboarding_step5_title')}</h3>
                <p className="text-xs text-slate-400">{t('onboarding_step5_desc')}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {[
                  { id: 'A1' as const, label: 'A1 — Iniciante', desc: 'Frases simples e verbos regulares no presente' },
                  { id: 'A2' as const, label: 'A2 — Básico', desc: 'Narrativas passadas e conexões cotidianas' },
                  { id: 'B1' as const, label: 'B1 — Intermediário', desc: 'Subjuntivo básico e argumentação geral' },
                  { id: 'B2' as const, label: 'B2 — Independente', desc: 'Fluência conversacional e nuances de registro' },
                  { id: 'C1' as const, label: 'C1 — Autônomo Avançado', desc: 'Discurso culto, textos autênticos e precisão idiomática' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setCefrLevel(opt.id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition ${
                      cefrLevel === opt.id
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-100 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block text-slate-100">{opt.label}</span>
                      <span className="text-[11px] text-slate-400">{opt.desc}</span>
                    </div>
                    {cefrLevel === opt.id && <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: Daily Learning Goal */}
          {step === 7 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100">{t('onboarding_step6_title')}</h3>
                <p className="text-xs text-slate-400">{t('onboarding_step6_desc')}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 pt-2">
                {[
                  { id: '5' as const, icon: <Zap className="w-5 h-5 text-amber-400" />, label: '5 min — Micro-sessão', desc: 'Foco em vocabulário e recordação rápida de falsos cognatos' },
                  { id: '10' as const, icon: <Target className="w-5 h-5 text-indigo-400" />, label: '10 min — Padrão Recomendado', desc: 'Leitura comentada de artigo autêntico e ponto gramatical' },
                  { id: '20' as const, icon: <Compass className="w-5 h-5 text-emerald-400" />, label: '20 min — Imersão C1 Completa', desc: 'Todas as 12 seções: áudio, diálogo, redação e exercícios' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSessionDuration(opt.id)}
                    className={`p-4 rounded-2xl border text-left flex items-center gap-3.5 cursor-pointer transition ${
                      sessionDuration === opt.id
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-100 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
                      {opt.icon}
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-sm block text-slate-100">{opt.label}</span>
                      <span className="text-xs text-slate-400">{opt.desc}</span>
                    </div>
                    {sessionDuration === opt.id && <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 8: All Set & Launch */}
          {step === 8 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-950/70 border border-emerald-800 flex items-center justify-center text-emerald-400 mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-100">
                {t('onboarding_step7_title')}
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                {t('onboarding_step7_desc')}
              </p>

              {/* Preferences Summary Badge Row */}
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-xs text-slate-300 flex flex-wrap justify-center gap-3 font-mono">
                <span>🖥️ UI: <strong>{interfaceLanguage.toUpperCase()}</strong></span>
                <span>•</span>
                <span>🎯 Alvo: <strong>{targetLang.toUpperCase()} ({regionalVariant})</strong></span>
                <span>•</span>
                <span>💡 Explicação: <strong>{explanationLang.toUpperCase()}</strong></span>
                <span>•</span>
                <span>🗣️ Nível: <strong>{cefrLevel}</strong></span>
                <span>•</span>
                <span>⏱️ Meta: <strong>{sessionDuration}m/dia</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
          {step > 1 ? (
            <Button
              variant="outline"
              size="md"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setStep(step - 1)}
            >
              {t('onboarding_back')}
            </Button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <Button
              variant="primary"
              size="md"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setStep(step + 1)}
            >
              {t('onboarding_continue')}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              className="bg-emerald-600 hover:bg-emerald-700"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleFinish}
            >
              {t('onboarding_finish')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
