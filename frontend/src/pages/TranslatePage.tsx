import React, { useState, useMemo, useEffect } from 'react';
import {
  Languages,
  Search,
  Volume2,
  Copy,
  Check,
  ArrowRight,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Bookmark,
  BookmarkCheck,
  Trash2,
  ShieldCheck,
  Info,
} from 'lucide-react';
import {
  TranslationService,
  TranslationDirection,
  SearchResultItem,
  TranslateOnlineResult,
} from '../services/translate';
import { SpeechService } from '../services/speech';
import { StorageService } from '../services/storage';
import { SavedTranslationBookmark } from '../types';
import { englishChallenges, EnglishLearningChallenge } from '../data/translationData';

export const TranslatePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [direction, setDirection] = useState<TranslationDirection>('pt-en');
  const [nativeLang, setNativeLang] = useState<'pt' | 'es' | 'en'>('pt');
  const [targetLang, setTargetLang] = useState<'en' | 'pt' | 'es'>('en');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'bookmarks'>('search');

  // Custom Sentence Online Translation State
  const [isTranslating, setIsTranslating] = useState(false);
  const [onlineResult, setOnlineResult] = useState<TranslateOnlineResult | null>(null);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Quota & Bookmarks state
  const [quota, setQuota] = useState(StorageService.getTranslationQuotaStatus(false));
  const [bookmarks, setBookmarks] = useState<SavedTranslationBookmark[]>([]);

  // Challenge State
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [challengeFeedback, setChallengeFeedback] = useState<{ isCorrect: boolean; feedback: string } | null>(null);

  useEffect(() => {
    setBookmarks(StorageService.getSavedTranslations());
    setQuota(StorageService.getTranslationQuotaStatus(false));
  }, []);

  // Update direction when native or target changes
  const handleLanguageDirectionChange = (native: 'pt' | 'es' | 'en', target: 'en' | 'pt' | 'es') => {
    setNativeLang(native);
    setTargetLang(target);
    const newDir = `${native}-${target}` as TranslationDirection;
    setDirection(newDir);
    setOnlineResult(null);
    setTranslationError(null);
  };

  const handleSwapLanguages = () => {
    const tempNative = nativeLang;
    const tempTarget = targetLang;
    handleLanguageDirectionChange(tempTarget, tempNative);
  };

  // Filtered search results from local verified educational dictionaries
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return TranslationService.search('a', direction).slice(0, 8);
    }
    return TranslationService.search(searchQuery, direction);
  }, [searchQuery, direction]);

  const currentChallenges = useMemo(() => {
    const lang = nativeLang === 'es' ? 'es' : 'pt';
    return englishChallenges.filter(c => c.source_lang === lang);
  }, [nativeLang]);

  const activeChallenge: EnglishLearningChallenge | undefined = currentChallenges[challengeIdx % currentChallenges.length];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = async (text: string, lang: 'pt' | 'es' | 'en', id: string) => {
    setPlayingAudioId(id);
    try {
      await SpeechService.speak(text, lang, 'all');
    } catch (e) {
      console.warn('Audio synthesis error', e);
    } finally {
      setPlayingAudioId(null);
    }
  };

  const handleOnlineTranslate = async () => {
    if (!searchQuery.trim()) return;
    setIsTranslating(true);
    setTranslationError(null);

    const src = (direction.split('-')[0] || nativeLang) as 'pt' | 'es' | 'en';
    const tgt = (direction.split('-')[1] || targetLang) as 'pt' | 'es' | 'en';

    const resp = await TranslationService.translateOnline(searchQuery, src, tgt, false);
    setIsTranslating(false);

    if (resp.success && resp.result) {
      setOnlineResult(resp.result);
      setQuota(StorageService.getTranslationQuotaStatus(false));
    } else {
      setTranslationError(resp.error || 'Não foi possível concluir a tradução.');
    }
  };

  const handleToggleBookmark = (item: { sourceText: string; targetText: string; sourceLang: 'pt' | 'es' | 'en'; targetLang: 'pt' | 'es' | 'en'; isVerified?: boolean; notes?: string }) => {
    const isBookmarked = bookmarks.some(b => b.source_text.toLowerCase() === item.sourceText.toLowerCase() && b.target_lang === item.targetLang);
    if (isBookmarked) {
      const match = bookmarks.find(b => b.source_text.toLowerCase() === item.sourceText.toLowerCase());
      if (match) {
        StorageService.deleteTranslationBookmark(match.id);
        setBookmarks(StorageService.getSavedTranslations());
      }
    } else {
      const newBookmark: SavedTranslationBookmark = {
        id: `bm-${Date.now()}`,
        source_text: item.sourceText,
        translated_text: item.targetText,
        source_lang: item.sourceLang,
        target_lang: item.targetLang,
        provider_used: item.isVerified ? 'dictionary' : 'mymemory',
        is_verified: item.isVerified !== false,
        notes: item.notes,
        created_at: new Date().toISOString(),
      };
      const ok = StorageService.saveTranslationBookmark(newBookmark);
      if (ok) {
        setBookmarks(StorageService.getSavedTranslations());
      } else {
        alert('Capacidade máxima de 500 marcadores atingida.');
      }
    }
  };

  const handleSelectOption = (opt: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(opt);
  };

  const handleSubmitChallenge = () => {
    if (!activeChallenge || !selectedOption) return;
    const res = TranslationService.checkChallenge(activeChallenge, selectedOption);
    setChallengeFeedback(res);
    setIsAnswerSubmitted(true);
  };

  const handleNextChallenge = () => {
    setChallengeIdx(prev => prev + 1);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setChallengeFeedback(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Languages className="w-6 h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Tradução & Aprendizado Multidirecional
              </h1>
            </div>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Dicionário educativo e tradução C1 entre <strong>Português</strong>, <strong>Espanhol</strong> e <strong>Inglês</strong>.
              Zero dependência de IA paga, limites diários transparentes e salvamento sob demanda.
            </p>
          </div>

          {/* Quota Badge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs shrink-0 space-y-1">
            <div className="text-slate-400 font-medium">Consultas diárias gratuitas:</div>
            <div className="text-sm font-bold text-indigo-300">
              {quota.remaining} restantes <span className="text-slate-500 font-normal">/ {quota.limit}</span>
            </div>
            <div className="text-[10px] text-slate-500">Reseta em 24h • Limite 1.000 caracteres</div>
          </div>
        </div>
      </div>

      {/* Language Direction Controls & Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configuração de Direção</span>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-300">Meu idioma:</span>
              <select
                value={nativeLang}
                onChange={(e) => handleLanguageDirectionChange(e.target.value as any, targetLang)}
                className="bg-slate-950 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                <option value="pt">🇧🇷 Português</option>
                <option value="es">🇪🇸 Español</option>
                <option value="en">🇬🇧 English</option>
              </select>

              <button
                type="button"
                onClick={handleSwapLanguages}
                title="Inverter idiomas"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <span className="text-slate-300">Quero praticar:</span>
              <select
                value={targetLang}
                onChange={(e) => handleLanguageDirectionChange(nativeLang, e.target.value as any)}
                className="bg-slate-950 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                <option value="en">🇬🇧 Inglês (C1)</option>
                <option value="pt">🇧🇷 Português (C1)</option>
                <option value="es">🇪🇸 Espanhol (C1)</option>
              </select>
            </div>
          </div>

          {/* Tab Switcher: Search vs Bookmarks */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'search' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Pesquisa & Tradução
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'bookmarks' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Marcadores ({bookmarks.length}/500)</span>
            </button>
          </div>
        </div>

        {/* Direction Quick Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { id: 'pt-en', label: '🇧🇷 PT → 🇬🇧 EN' },
            { id: 'es-en', label: '🇪🇸 ES → 🇬🇧 EN' },
            { id: 'en-pt', label: '🇬🇧 EN → 🇧🇷 PT' },
            { id: 'en-es', label: '🇬🇧 EN → 🇪🇸 ES' },
            { id: 'pt-es', label: '🇧🇷 PT → 🇪🇸 ES' },
            { id: 'es-pt', label: '🇪🇸 ES → 🇧🇷 PT' },
            { id: 'all', label: '🌐 Trilingual' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => {
                setDirection(btn.id as TranslationDirection);
                setOnlineResult(null);
                setTranslationError(null);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                direction === btn.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Input Box with Character Counter & Instant Translate Button */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <textarea
              rows={2}
              value={searchQuery}
              maxLength={1000}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOnlineResult(null);
                setTranslationError(null);
              }}
              placeholder={
                direction === 'pt-en'
                  ? 'Digite palavra ou frase em português (ex: na verdade, não obstante, a transição energética)...'
                  : direction === 'es-en'
                  ? 'Escriba palabra o frase en español (ej: de hecho, no obstante, el desarrollo sostenible)...'
                  : 'Digite ou cole o texto a ser traduzido (máx 1.000 caracteres)...'
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span>{searchQuery.length} / 1.000 caracteres</span>
              {searchQuery.length >= 900 && (
                <span className="text-amber-400 text-[11px]">• Próximo ao limite</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOnlineTranslate}
                disabled={!searchQuery.trim() || isTranslating || quota.remaining <= 0}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center gap-1.5"
              >
                {isTranslating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isTranslating ? 'Traduzindo...' : 'Traduzir Texto'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Translation Error Alert */}
        {translationError && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{translationError}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Left Column (Results/Bookmarks) + Right Column (Challenges & Cognates) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Online Custom Translation Result (if triggered) */}
          {onlineResult && (
            <div className="bg-indigo-950/40 border border-indigo-700/60 rounded-2xl p-5 shadow-sm space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Resultado da Tradução</span>
                  {onlineResult.isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      <ShieldCheck className="w-3 h-3" />
                      Dicionário Verificado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      <Info className="w-3 h-3" />
                      Tradução Automática Aproximada
                    </span>
                  )}
                  {onlineResult.fromCache && (
                    <span className="text-[10px] text-slate-400 font-mono">⚡ Cache</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSpeak(onlineResult.translatedText, onlineResult.targetLang, 'online-res')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Ouvir"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCopy(onlineResult.translatedText, 'online-res')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Copiar"
                  >
                    {copiedId === 'online-res' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleToggleBookmark({
                      sourceText: searchQuery,
                      targetText: onlineResult.translatedText,
                      sourceLang: onlineResult.sourceLang,
                      targetLang: onlineResult.targetLang,
                      isVerified: onlineResult.isVerified,
                      notes: onlineResult.notes,
                    })}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 transition"
                    title="Salvar no Vocabulário"
                  >
                    {bookmarks.some(b => b.source_text.toLowerCase() === searchQuery.toLowerCase()) ? (
                      <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="text-base font-semibold text-white">
                {onlineResult.translatedText}
              </div>
              {onlineResult.notes && (
                <div className="text-xs text-slate-400 border-t border-indigo-900/50 pt-2">
                  {onlineResult.notes}
                </div>
              )}
            </div>
          )}

          {/* Bookmarks Tab View */}
          {activeTab === 'bookmarks' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Marcadores Pessoais: {bookmarks.length} / 500</span>
                <span>Pronto para revisão</span>
              </div>
              {bookmarks.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
                  <Bookmark className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-60" />
                  <p className="font-semibold text-slate-300">Nenhum marcador salvo ainda</p>
                  <p className="text-xs text-slate-500 mt-1">Clique no ícone de marcador nos resultados para salvar termos e frases para revisão.</p>
                </div>
              ) : (
                bookmarks.map(bm => (
                  <div key={bm.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{bm.source_text}</span>
                        <ArrowRight className="w-3 h-3 text-indigo-400" />
                        <span className="font-bold text-indigo-300 text-sm">{bm.translated_text}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {bm.source_lang} → {bm.target_lang}
                        </span>
                      </div>
                      {bm.notes && <p className="text-xs text-slate-400">{bm.notes}</p>}
                    </div>
                    <button
                      onClick={() => {
                        StorageService.deleteTranslationBookmark(bm.id);
                        setBookmarks(StorageService.getSavedTranslations());
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition"
                      title="Excluir marcador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Search Results List */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                <span>Termos educacionais sugeridos ({searchResults.length})</span>
                <span>Vocabulário Verificado</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
                  <Search className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-60" />
                  <p className="font-semibold text-slate-300">Nenhum termo exato encontrado para "{searchQuery}"</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Clique em <strong>"Traduzir Texto"</strong> acima para consultar a memória de tradução automática.
                  </p>
                </div>
              ) : (
                searchResults.map((item) => {
                  const isBookmarked = bookmarks.some(b => b.source_text.toLowerCase() === item.sourceText.toLowerCase());
                  return (
                    <div
                      key={item.id}
                      className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg font-bold text-white tracking-tight">{item.sourceText}</span>
                            <ArrowRight className="w-4 h-4 text-indigo-400" />
                            <span className="text-lg font-bold text-indigo-300 tracking-tight">{item.targetText}</span>
                            {item.partOfSpeech && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 uppercase tracking-wider border border-slate-700">
                                {item.partOfSpeech}
                              </span>
                            )}
                            {item.category && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-800/50">
                                {item.category}
                              </span>
                            )}
                          </div>
                          {item.phoneticTarget && (
                            <div className="text-xs font-mono text-slate-400 mt-1">
                              Pronúncia: {item.phoneticTarget}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleSpeak(item.targetText, item.targetLang, item.id)}
                            disabled={playingAudioId === item.id}
                            title={`Ouvir pronúncia em ${item.targetLang}`}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                          >
                            <Volume2 className={`w-4 h-4 ${playingAudioId === item.id ? 'text-indigo-400 animate-pulse' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleCopy(`${item.sourceText} = ${item.targetText}`, item.id)}
                            title="Copiar tradução"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                          >
                            {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleToggleBookmark({
                              sourceText: item.sourceText,
                              targetText: item.targetText,
                              sourceLang: item.sourceLang,
                              targetLang: item.targetLang,
                              isVerified: true,
                              notes: item.notes,
                            })}
                            title="Salvar no vocabulário pessoal"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                          >
                            {isBookmarked ? (
                              <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Contextual Examples */}
                      {item.exampleSource && (
                        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 text-xs space-y-1">
                          <div className="text-slate-300 font-medium">"{item.exampleSource}"</div>
                          {item.exampleTarget && (
                            <div className="text-indigo-300/90 italic">"{item.exampleTarget}"</div>
                          )}
                        </div>
                      )}

                      {/* False Cognate Alert */}
                      {item.falseFriendWarning && (
                        <div className="flex items-start gap-2 bg-amber-950/40 border border-amber-800/50 rounded-lg p-2.5 text-xs text-amber-200">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>{item.falseFriendWarning}</div>
                        </div>
                      )}

                      {/* Pedagogical Learner Note */}
                      {item.notes && (
                        <div className="text-xs text-slate-400 border-l-2 border-indigo-500/60 pl-3 py-0.5">
                          💡 <strong>Dica de Uso:</strong> {item.notes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right Column: English Learning Challenges & False Friends */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <h2 className="font-bold text-white text-base">Desafio de Inglês C1</h2>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {challengeIdx + 1} de {currentChallenges.length}
              </span>
            </div>

            {activeChallenge && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    Traduza com registro formal C1:
                  </span>
                  <p className="text-sm font-semibold text-white">"{activeChallenge.source_text}"</p>
                  <p className="text-xs text-slate-400 italic">Tópico: {activeChallenge.topic}</p>
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-2">
                  {(activeChallenge.options || []).map((opt: string, oIdx: number) => {
                    const isSelected = selectedOption === opt;
                    let optStyle = 'border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800';
                    if (isAnswerSubmitted) {
                      if (opt === activeChallenge.target_english) {
                        optStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-semibold';
                      } else if (isSelected) {
                        optStyle = 'border-rose-500 bg-rose-950/40 text-rose-200';
                      }
                    } else if (isSelected) {
                      optStyle = 'border-indigo-500 bg-indigo-950/50 text-indigo-200';
                    }

                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleSelectOption(opt)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${optStyle}`}
                      >
                        <span>{opt}</span>
                        {isAnswerSubmitted && opt === activeChallenge.target_english && (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {!isAnswerSubmitted ? (
                  <button
                    onClick={handleSubmitChallenge}
                    disabled={!selectedOption}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Verificar Resposta</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    {challengeFeedback && (
                      <div
                        className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                          challengeFeedback.isCorrect
                            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                            : 'bg-rose-950/60 border-rose-800 text-rose-200'
                        }`}
                      >
                        {challengeFeedback.feedback}
                      </div>
                    )}
                    <button
                      onClick={handleNextChallenge}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors border border-slate-700 flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Próximo Desafio</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* False Friends Quick Reference Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-sm">Falsos Cognatos Críticos (EN vs PT/ES)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Erros mais comuns de transferência linguística entre falantes de português/espanhol ao aprender inglês:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-bold text-indigo-400">Actually</span> ≠ Atualmente<br />
                <span className="text-slate-300">Significa "na verdade / de fato". Para "atualmente", use <em>currently</em>.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-bold text-indigo-400">Sensible</span> ≠ Sensível<br />
                <span className="text-slate-300">Significa "sensato / prudente". Para "sensível", use <em>sensitive</em>.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-bold text-indigo-400">Pretend</span> ≠ Pretender<br />
                <span className="text-slate-300">Significa "fingir". Para "pretender ter intenção", use <em>intend</em>.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslatePage;
