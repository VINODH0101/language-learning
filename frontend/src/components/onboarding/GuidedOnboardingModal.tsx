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
  HelpCircle,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';
import { InterfaceLanguage } from '../../i18n/translations';
import { CEFRLevel, Language, SessionDuration, RegionalVariety, ExplanationLanguage } from '../../types';
import { authService } from '../../services/auth';
import { courseService } from '../../services/courseService';
import {
  REGIONAL_VARIETIES_BY_LANGUAGE,
  REGIONAL_VARIETY_METADATA,
  DEFAULT_REGIONAL_VARIETY,
  getLanguageName,
} from '../../lib/languages/languageMatrix';
import { LANGUAGE_REGISTRY } from '../../config/languages/languageRegistry';
import { SupportedLanguage } from '../../config/languages/types';
import { INTERFACE_LANGUAGES_LIST } from '../../i18n/interfaceLanguages';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { SmartOnboardingService, SmartOnboardingSuggestions } from '../../services/smartOnboardingService';
import { UmamiProvider } from '../../services/providers/analytics/umamiProvider';
import { toast } from 'sonner';

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
  const [explanationLang, setExplanationLang] = useState<ExplanationLanguage>(
    interfaceLanguage.startsWith('pt') ? 'pt' : interfaceLanguage === 'es' ? 'es' : 'en'
  );
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B2');
  const [sessionDuration, setSessionDuration] = useState<SessionDuration>('10');

  // Placement Test State (Step 6)
  const [placementOption, setPlacementOption] = useState<'skip' | 'test'>('skip');
  const [placementAnswer1, setPlacementAnswer1] = useState<number | null>(null);
  const [placementAnswer2, setPlacementAnswer2] = useState<number | null>(null);
  const [placementResult, setPlacementResult] = useState<CEFRLevel | null>(null);

  // Smart Onboarding Suggestions (Zero GPS / Non-intrusive)
  const [smartSuggestions] = useState<SmartOnboardingSuggestions>(() =>
    SmartOnboardingService.getSmartSuggestions()
  );
  const [suggestionsApplied, setSuggestionsApplied] = useState(false);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);

  const handleApplySmartSuggestions = () => {
    setInterfaceLanguage(smartSuggestions.suggestedInterfaceLanguage);
    handleSelectTargetLang(smartSuggestions.suggestedTargetLanguage as Language);
    setExplanationLang(smartSuggestions.suggestedExplanationLanguage);
    setSuggestionsApplied(true);
    toast.success('Sugestões inteligentes aplicadas com sucesso!');
  };

  if (!isOpen) return null;

  const totalSteps = 8;

  const supportedLanguagesList: SupportedLanguage[] = [
    'en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'ru', 'nl', 'zh', 'tr', 'ta'
  ];

  const handleSelectTargetLang = (lang: Language) => {
    setTargetLang(lang);
    const def = DEFAULT_REGIONAL_VARIETY[lang];
    if (def) setRegionalVariant(def);
  };

  const handleAnswerPlacement = (qNum: 1 | 2, optionIndex: number) => {
    if (qNum === 1) {
      setPlacementAnswer1(optionIndex);
    } else {
      setPlacementAnswer2(optionIndex);
      // Auto-evaluate placement result
      // Option 0 on Q1 is elementary, Option 1 on Q2 is advanced
      const isQ1Correct = optionIndex === 0; // elementary check
      const isQ2Correct = optionIndex === 1; // upper check
      if (isQ2Correct) {
        setPlacementResult('C1');
        setCefrLevel('C1');
      } else if (isQ1Correct) {
        setPlacementResult('B1');
        setCefrLevel('B1');
      } else {
        setPlacementResult('A2');
        setCefrLevel('A2');
      }
    }
  };

  const handleFinish = async () => {
    try {
      localStorage.setItem('polyglot_onboarding_completed', 'true');
      localStorage.setItem('lexilume_onboarding_completed', 'true');
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

      // Track privacy-friendly milestone
      UmamiProvider.getInstance().trackEvent('onboarding_completed');
      UmamiProvider.getInstance().trackEvent('language_selected', { language: targetLang });
    } catch {}

    onClose();
    if (onStartLesson) onStartLesson();
  };

  const handleSkip = () => {
    try {
      localStorage.setItem('polyglot_onboarding_completed', 'true');
      localStorage.setItem('lexilume_onboarding_completed', 'true');
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Progress Bar & Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              {t('common:step', 'Passo')} {step} / {totalSteps}
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
            {t('common:skip', 'Pular')}
          </button>
        </div>

        {/* Step Body */}
        <div className="p-6 sm:p-7 space-y-5 flex-1 overflow-y-auto">
          {/* STEP 1: Choose Interface Language */}
          {step === 1 && (
            <div className="space-y-4">
              {!suggestionsDismissed && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/40 border border-indigo-700/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Sugestão Inteligente (Baseada no Navegador)
                    </span>
                    <button
                      type="button"
                      onClick={() => setSuggestionsDismissed(true)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      Dispensar
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Identificamos o idioma do navegador <code className="text-indigo-200 font-mono bg-slate-900 px-1 py-0.5 rounded">{smartSuggestions.browserLanguage}</code> e o fuso horário <code className="text-indigo-200 font-mono bg-slate-900 px-1 py-0.5 rounded">{smartSuggestions.detectedTimezone}</code> ({smartSuggestions.suggestedCountryCode}).
                    <span className="block text-[11px] text-slate-400 mt-1">🔒 Zero GPS ou rastreamento de IP. Você tem controle total em todas as etapas.</span>
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 py-1.5 px-3"
                      onClick={handleApplySmartSuggestions}
                      disabled={suggestionsApplied}
                    >
                      {suggestionsApplied ? '✓ Sugestões Aplicadas' : `Aplicar (${smartSuggestions.suggestedInterfaceLanguage.toUpperCase()} / ${smartSuggestions.suggestedTargetLanguage.toUpperCase()})`}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-bold text-slate-100">
                    1. {t('settings:interface_lang_label', 'Escolha o Idioma da Interface')}
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  {t('settings:interface_lang_desc', 'Controla os botões, navegação e menus do aplicativo Lexilume.')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {INTERFACE_LANGUAGES_LIST.map(opt => (
                  <button
                    key={opt.code}
                    onClick={() => setInterfaceLanguage(opt.code)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition ${
                      interfaceLanguage === opt.code
                        ? 'bg-indigo-950/70 border-indigo-500 text-indigo-100 ring-1 ring-indigo-500/50 shadow-sm'
                        : 'bg-slate-800/50 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-xl leading-none">{opt.flag}</span>
                      <div className="truncate">
                        <span className="font-bold text-xs block text-slate-100 truncate">{opt.nativeName}</span>
                        <span className="text-[10px] text-slate-400 truncate">{opt.name}</span>
                      </div>
                    </div>
                    {interfaceLanguage === opt.code && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Choose Target Language (All 13 languages) */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Languages className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-slate-100">
                    2. Escolha o Idioma que Deseja Aprender
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Selecione seu idioma-alvo entre os 13 idiomas oficialmente integrados no Lexilume.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {supportedLanguagesList.map(langCode => {
                  const meta = LANGUAGE_REGISTRY[langCode];
                  const isSelected = targetLang === langCode;
                  return (
                    <button
                      key={langCode}
                      onClick={() => handleSelectTargetLang(langCode as Language)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? 'bg-indigo-950/70 border-indigo-500 text-indigo-100 ring-1 ring-indigo-500/50 shadow-sm'
                          : 'bg-slate-800/50 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-xl leading-none">{meta.flag}</span>
                        <div className="truncate">
                          <span className="font-bold text-xs block text-slate-100 truncate">
                            {meta.nativeName} ({meta.displayName})
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">
                            {meta.script} • {meta.id}
                          </span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Choose Explanation Language */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-slate-100">
                    3. Escolha o Idioma das Explicações Pedagógicas
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  O idioma em que as regras gramaticais, notas de falsos amigos e definições serão apresentadas.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {[
                  { id: 'en' as const, label: 'English Explanations', desc: 'Pedagogical grammar and lexical notes in English' },
                  { id: 'pt' as const, label: 'Explicações em Português', desc: 'Análise linguística detalhada em português' },
                  { id: 'es' as const, label: 'Explicaciones en Español', desc: 'Estructuras gramaticales y notas en español' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setExplanationLang(opt.id)}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition ${
                      explanationLang === opt.id
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-100 shadow-sm ring-1 ring-indigo-500/50'
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

          {/* STEP 4: Choose Current Proficiency Level */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-slate-100">
                    4. Nível de Proficiência Atual (CEFR)
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Calibra a complexidade vocabular, tempos verbais e extensão das leituras.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                {[
                  { id: 'A1' as const, label: 'A1 — Iniciante', desc: 'Frases simples, vocabulário essencial e saudações' },
                  { id: 'A2' as const, label: 'A2 — Básico', desc: 'Narrativas cotidianas, compras e rotina no passado' },
                  { id: 'B1' as const, label: 'B1 — Intermediário', desc: 'Expressão de opiniões, planos futuros e gramática mista' },
                  { id: 'B2' as const, label: 'B2 — Independente', desc: 'Discurso fluente, tópicos abstratos e nuances de registro' },
                  { id: 'C1' as const, label: 'C1 — Autônomo Avançado', desc: 'Textos autênticos complexos, precisão idiomática e nuances estilísticas' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setCefrLevel(opt.id)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition ${
                      cefrLevel === opt.id
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-100 shadow-sm ring-1 ring-indigo-500/50'
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

          {/* STEP 5: Select Learning Goal */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-bold text-slate-100">
                    5. Defina sua Meta Diária de Estudo
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Quantos minutos diários você deseja dedicar ao aprendizado contínuo.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                {[
                  { id: '5' as const, icon: <Zap className="w-5 h-5 text-amber-400" />, label: '5 min / dia — Micro-sessão', desc: 'Revisão rápida de vocabulário e falsos cognatos' },
                  { id: '10' as const, icon: <Target className="w-5 h-5 text-indigo-400" />, label: '10 min / dia — Padrão Recomendado', desc: 'Leitura comentada, ponto gramatical e exercícios de fixação' },
                  { id: '20' as const, icon: <Compass className="w-5 h-5 text-emerald-400" />, label: '20 min / dia — Imersão Profunda', desc: 'Trilha completa com áudio nativo, conversação e redação' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSessionDuration(opt.id)}
                    className={`p-4 rounded-2xl border text-left flex items-center gap-3.5 cursor-pointer transition ${
                      sessionDuration === opt.id
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-100 shadow-sm ring-1 ring-indigo-500/50'
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

          {/* STEP 6: Optional Placement Assessment */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-sky-400" />
                  <h3 className="text-lg font-bold text-slate-100">
                    6. Avaliação de Nivelamento (Opcional)
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Deseja responder a 2 perguntas rápidas para confirmar seu nível exato ou prefere manter a escolha manual?
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPlacementOption('skip')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border cursor-pointer transition ${
                    placementOption === 'skip'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Manter meu nível ({cefrLevel})
                </button>
                <button
                  onClick={() => setPlacementOption('test')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border cursor-pointer transition ${
                    placementOption === 'test'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Fazer mini-teste rápido
                </button>
              </div>

              {placementOption === 'test' && (
                <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 animate-fadeIn">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">Pergunta 1</span>
                    <p className="text-xs font-semibold text-slate-200">
                      Qual frase expressa uma ação habitual no presente?
                    </p>
                    <div className="space-y-1">
                      {['Eu estudo todos os dias.', 'Eu estudaria se pudesse.', 'Eu havia estudado.'].map((ans, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAnswerPlacement(1, idx)}
                          className={`w-full text-left p-2 rounded-lg text-xs transition cursor-pointer border ${
                            placementAnswer1 === idx
                              ? 'bg-indigo-950 border-indigo-500 text-indigo-200'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                          }`}
                        >
                          {ans}
                        </button>
                      ))}
                    </div>
                  </div>

                  {placementAnswer1 !== null && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-800 animate-fadeIn">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase">Pergunta 2</span>
                      <p className="text-xs font-semibold text-slate-200">
                        Identifique a estrutura com o modo subjuntivo / hipótese formal:
                      </p>
                      <div className="space-y-1">
                        {['Ele chegou ontem cedo.', 'Caso ele chegue a tempo, iniciaremos a reunião.', 'Ele está chegando agora.'].map((ans, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAnswerPlacement(2, idx)}
                            className={`w-full text-left p-2 rounded-lg text-xs transition cursor-pointer border ${
                              placementAnswer2 === idx
                                ? 'bg-indigo-950 border-indigo-500 text-indigo-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                            }`}
                          >
                            {ans}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {placementResult && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 flex items-center justify-between">
                      <span>Nível sugerido após diagnóstico: <strong>{placementResult}</strong></span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 7: Create Learning Track & Regional Variety */}
          {step === 7 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-bold text-slate-100">
                    7. Configurar Variedade Regional & Trilha
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Calibre o sotaque nativo, normas fonéticas e ortografia para {getLanguageName(targetLang, interfaceLanguage)}.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                {REGIONAL_VARIETIES_BY_LANGUAGE[targetLang]
                  ? REGIONAL_VARIETIES_BY_LANGUAGE[targetLang]
                      .filter(v => v !== 'all')
                      .map(varId => {
                        const meta = REGIONAL_VARIETY_METADATA[varId];
                        return (
                          <button
                            key={varId}
                            onClick={() => setRegionalVariant(varId)}
                            className={`p-3.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition ${
                              regionalVariant === varId
                                ? 'bg-indigo-950/60 border-indigo-500 text-indigo-100 shadow-sm ring-1 ring-indigo-500/50'
                                : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{meta.flag}</span>
                              <div>
                                <span className="font-bold text-xs block text-slate-100">
                                  {interfaceLanguage === 'pt'
                                    ? meta.labelPt
                                    : interfaceLanguage === 'es'
                                    ? meta.labelEs
                                    : meta.labelEn}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Síntese vocal & fonética ({meta.voiceLocale})
                                </span>
                              </div>
                            </div>
                            {regionalVariant === varId && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                          </button>
                        );
                      })
                  : (
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300">
                      Variedade padrão configurada para {getLanguageName(targetLang, interfaceLanguage)}.
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* STEP 8: Display Personalized Learning Path */}
          {step === 8 && (
            <div className="text-center py-2 space-y-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg">
                <GraduationCap className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-100">
                  8. Seu Plano de Aprendizado Personalizado
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Sua trilha adaptativa está pronta com 24 marcos curriculares e geração determinística de lições.
                </p>
              </div>

              {/* Learning Roadmap Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <span className="text-xs text-slate-400">Idioma-Alvo</span>
                  <span className="font-bold text-xs text-white">
                    {getLanguageName(targetLang, interfaceLanguage)} ({regionalVariant})
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <span className="text-xs text-slate-400">Nível Inicial</span>
                  <Badge variant="indigo" size="sm">{cefrLevel}</Badge>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <span className="text-xs text-slate-400">Meta Diária</span>
                  <span className="font-bold text-xs text-emerald-400">{sessionDuration} minutos / dia</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Idioma das Explicações</span>
                  <span className="font-bold text-xs text-slate-200">{explanationLang.toUpperCase()}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Você pode alterar essas configurações a qualquer momento no menu do perfil ou nas Configurações.
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
          {step > 1 ? (
            <Button
              variant="outline"
              size="md"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setStep(step - 1)}
            >
              {t('common:back', 'Voltar')}
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
              {t('common:continue', 'Continuar')}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              className="bg-emerald-600 hover:bg-emerald-700"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleFinish}
            >
              {t('common:start', 'Começar a Aprender')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
