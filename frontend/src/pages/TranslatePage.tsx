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
import { contentAccess } from '../services/contentAccess';
import { SavedTranslationBookmark } from '../types';
import type { EnglishLearningChallenge } from '../data/translationData';
import type { FalseFriendItem } from '../types';
import { useI18n } from '../i18n/i18nContext';
import { getLanguageName, LANGUAGE_METADATA } from '../lib/languages/languageMatrix';
import { toast } from 'sonner';

export const TranslatePage: React.FC = () => {
  const { t, interfaceLanguage } = useI18n();
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

  // Dynamic live search results, AI Content Engine challenges, and comparative false cognates
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [currentChallenges, setCurrentChallenges] = useState<EnglishLearningChallenge[]>([]);
  const [liveFalseFriends, setLiveFalseFriends] = useState<FalseFriendItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const lang = nativeLang === 'es' ? 'es' : 'pt';
    TranslationService.getLiveChallenges(lang)
      .then(list => {
        if (!cancelled) setCurrentChallenges(list);
      })
      .catch(() => {
        if (!cancelled) setCurrentChallenges([]);
      });
    return () => {
      cancelled = true;
    };
  }, [nativeLang]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      contentAccess.getPublishedVocabularyEntries('pt', 'en').catch(() => []),
      contentAccess.getPublishedVocabularyEntries('es', 'en').catch(() => []),
    ])
      .then(([ptVocab, esVocab]) => {
        if (cancelled) return;
        const items: FalseFriendItem[] = [];
        for (const v of [...ptVocab, ...esVocab]) {
          if (!v.grammar_notes) continue;
          items.push({
            id: `ff-${v.id}`,
            portuguese_term: v.target_language === 'pt' ? v.lemma : v.translations.pt || v.lemma,
            spanish_term: v.target_language === 'es' ? v.lemma : v.translations.es || v.lemma,
            pt_meaning_en: v.definitions.pt || v.definitions.en || '',
            es_meaning_en: v.definitions.es || v.definitions.en || '',
            interference_warning: v.grammar_notes,
            pt_example: v.example_sentence_target,
            es_example: v.example_sentence_translations.es || '',
            cefr_level: v.cefr_level,
            attribution: v.attribution,
          });
        }
        setLiveFalseFriends(items);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      TranslationService.searchLive(q, direction)
        .then(res => {
          if (!cancelled) setSearchResults(res);
        })
        .catch(() => {
          if (!cancelled) setSearchResults([]);
        });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, direction]);

  const activeChallenge: EnglishLearningChallenge | undefined =
    currentChallenges.length > 0
      ? currentChallenges[challengeIdx % currentChallenges.length]
      : undefined;

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
      setTranslationError(resp.error || t('errors:unknown_error', 'Failed to complete translation.'));
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
        toast.error(t('practice:dict_bookmark_limit_error', 'Maximum capacity of 500 bookmarks reached.'));
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Editorial Header */}
      <header className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                <Languages className="w-5 h-5" />
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                {t('practice:dict_title', 'Multidirectional Translation & Learning')}
              </h1>
            </div>
            <p className="text-stone-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {t(
                'practice:dict_subtitle',
                'Educational dictionary and C1 translation across Portuguese, Spanish, and English.'
              )}
            </p>
          </div>

          {/* Quiet Quota Pill */}
          <div className="bg-[#FAF9F6] border border-stone-200 rounded-xl px-4 py-3 text-xs shrink-0 space-y-0.5 self-start md:self-auto">
            <div className="text-stone-500 font-medium">
              {t('practice:dict_daily_queries', 'Free daily queries:')}
            </div>
            <div className="font-serif text-base font-bold text-stone-900">
              {t('practice:dict_remaining_count', '{{remaining}} remaining', { remaining: quota.remaining })}{' '}
              <span className="font-sans text-xs text-stone-500 font-normal">/ {quota.limit}</span>
            </div>
            <div className="text-[10px] text-stone-500">
              {t('practice:dict_quota_reset', 'Resets in 24h • Limit 1,000 characters')}
            </div>
          </div>
        </div>
      </header>

      {/* Calm Search & Translation Composer */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          {/* Unified Single Direction Control */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={nativeLang}
              onChange={(e) => handleLanguageDirectionChange(e.target.value as any, targetLang)}
              aria-label={t('practice:dict_my_lang', 'My language')}
              className="bg-[#FAF9F6] border border-stone-200 text-stone-900 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-stone-500 min-h-[40px] cursor-pointer"
            >
              <option value="pt">{LANGUAGE_METADATA.pt.flag} {getLanguageName('pt', interfaceLanguage as any)}</option>
              <option value="es">{LANGUAGE_METADATA.es.flag} {getLanguageName('es', interfaceLanguage as any)}</option>
              <option value="en">{LANGUAGE_METADATA.en.flag} {getLanguageName('en', interfaceLanguage as any)}</option>
            </select>

            <button
              type="button"
              onClick={handleSwapLanguages}
              title={t('practice:dict_swap_title', 'Swap languages')}
              aria-label={t('practice:dict_swap_title', 'Swap languages')}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 transition border border-stone-200 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <select
              value={targetLang}
              onChange={(e) => handleLanguageDirectionChange(nativeLang, e.target.value as any)}
              aria-label={t('practice:dict_practice_lang', 'Target language')}
              className="bg-[#FAF9F6] border border-stone-200 text-stone-900 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-stone-500 min-h-[40px] cursor-pointer"
            >
              <option value="en">{LANGUAGE_METADATA.en.flag} {getLanguageName('en', interfaceLanguage as any)}</option>
              <option value="pt">{LANGUAGE_METADATA.pt.flag} {getLanguageName('pt', interfaceLanguage as any)}</option>
              <option value="es">{LANGUAGE_METADATA.es.flag} {getLanguageName('es', interfaceLanguage as any)}</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setDirection(direction === 'all' ? (`${nativeLang}-${targetLang}` as TranslationDirection) : 'all');
                setOnlineResult(null);
                setTranslationError(null);
              }}
              aria-pressed={direction === 'all'}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition border min-h-[40px] cursor-pointer ${
                direction === 'all'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              🌐 {t('practice:dict_dir_trilingual', 'Trilingual')}
            </button>
          </div>

          {/* Search vs Bookmarks Switcher */}
          <div className="inline-flex items-center gap-1 bg-stone-100 border border-stone-200 p-1 rounded-xl self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'search' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t('practice:dict_tab_search', 'Search & Translate')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bookmarks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'bookmarks' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{t('practice:dict_tab_bookmarks', 'Bookmarks ({{count}}/500)', { count: bookmarks.length })}</span>
            </button>
          </div>
        </div>

        {/* Input Box */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
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
                  ? t(
                      'practice:dict_placeholder_pt_en',
                      'Type word or phrase in Portuguese (e.g., na verdade, não obstante)...'
                    )
                  : direction === 'es-en'
                  ? t(
                      'practice:dict_placeholder_es_en',
                      'Type word or phrase in Spanish (e.g., de hecho, no obstante)...'
                    )
                  : t(
                      'practice:dict_placeholder_default',
                      'Type or paste text to translate (max 1,000 characters)...'
                    )
              }
              className="w-full bg-[#FAF9F6] border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 focus:bg-white resize-none transition"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-stone-500">
              <span>{t('practice:dict_char_counter', '{{count}} / 1,000 characters', { count: searchQuery.length })}</span>
              {searchQuery.length >= 900 && (
                <span className="text-amber-700 font-semibold text-[11px]">• {t('practice:dict_near_limit', 'Near limit')}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleOnlineTranslate}
              disabled={!searchQuery.trim() || isTranslating || quota.remaining <= 0}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
            >
              {isTranslating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              <span>
                {isTranslating
                  ? t('practice:dict_translating', 'Translating...')
                  : t('practice:dict_translate_btn', 'Translate Text')}
              </span>
            </button>
          </div>
        </div>

        {translationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{translationError}</span>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-5">
          {onlineResult && (
            <div className="bg-white border border-amber-300 rounded-2xl p-5 shadow-xs space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    {t('practice:dict_result_heading', 'Translation Result')}
                  </span>
                  {onlineResult.isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" />
                      {t('practice:dict_verified_badge', 'Verified Dictionary')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <Info className="w-3 h-3" />
                      {t('practice:dict_mt_badge', 'Automated Approximate Translation')}
                    </span>
                  )}
                  {onlineResult.fromCache && (
                    <span className="text-[10px] text-stone-500 font-mono">
                      ⚡ {t('practice:dict_cache_badge', 'Cached')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSpeak(onlineResult.translatedText, onlineResult.targetLang, 'online-res')}
                    className="p-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 transition cursor-pointer"
                    title={t('practice:dict_listen_btn', 'Listen')}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(onlineResult.translatedText, 'online-res')}
                    className="p-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 transition cursor-pointer"
                    title={t('practice:dict_copy_btn', 'Copy')}
                  >
                    {copiedId === 'online-res' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleBookmark({
                      sourceText: searchQuery,
                      targetText: onlineResult.translatedText,
                      sourceLang: onlineResult.sourceLang,
                      targetLang: onlineResult.targetLang,
                      isVerified: onlineResult.isVerified,
                      notes: onlineResult.notes,
                    })}
                    className="p-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 transition cursor-pointer"
                    title={t('practice:dict_save_vocab', 'Save to Vocabulary')}
                  >
                    {bookmarks.some(b => b.source_text.toLowerCase() === searchQuery.toLowerCase()) ? (
                      <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="font-serif text-lg font-bold text-stone-900">
                {onlineResult.translatedText}
              </div>
              {onlineResult.notes && (
                <div className="text-xs text-stone-600 border-t border-stone-100 pt-2">
                  {onlineResult.notes}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookmarks' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                <span>
                  {t('practice:dict_bookmarks_personal', 'Personal Bookmarks: {{count}} / 500', {
                    count: bookmarks.length,
                  })}
                </span>
                <span>{t('practice:dict_ready_review', 'Ready for review')}</span>
              </div>
              {bookmarks.length === 0 ? (
                <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center text-stone-500">
                  <Bookmark className="w-8 h-8 mx-auto mb-2 text-stone-400" />
                  <p className="font-semibold text-stone-800">
                    {t('practice:dict_bookmarks_empty_title', 'No bookmarks saved yet')}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    {t(
                      'practice:dict_bookmarks_empty_desc',
                      'Click the bookmark icon on results to save terms and phrases for review.'
                    )}
                  </p>
                </div>
              ) : (
                bookmarks.map(bm => (
                  <div key={bm.id} className="bg-white border border-stone-200 rounded-xl p-4 flex items-start justify-between gap-4 shadow-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-bold text-stone-900 text-sm">{bm.source_text}</span>
                        <ArrowRight className="w-3 h-3 text-stone-400" />
                        <span className="font-semibold text-amber-800 text-sm">{bm.translated_text}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                          {bm.source_lang} → {bm.target_lang}
                        </span>
                      </div>
                      {bm.notes && <p className="text-xs text-stone-500">{bm.notes}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        StorageService.deleteTranslationBookmark(bm.id);
                        setBookmarks(StorageService.getSavedTranslations());
                      }}
                      className="p-1.5 rounded-lg bg-stone-50 hover:bg-rose-50 text-stone-500 hover:text-rose-700 border border-stone-200 transition cursor-pointer shrink-0"
                      title={t('practice:dict_delete_bookmark', 'Delete bookmark')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 font-medium px-1">
                <span>
                  {t('practice:dict_suggested_terms', 'Suggested educational terms ({{count}})', {
                    count: searchResults.length,
                  })}
                </span>
                <span>{t('practice:dict_verified_vocab', 'Verified Vocabulary')}</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center text-stone-500">
                  <Search className="w-8 h-8 mx-auto mb-2 text-stone-400" />
                  <p className="font-semibold text-stone-800">
                    {searchQuery.trim()
                      ? t('practice:dict_no_match', 'No exact term found for "{{query}}"', { query: searchQuery })
                      : t('practice:dict_no_match_hint', 'Type a phrase above or click "Translate Text" to query dictionary and translation memory.')}
                  </p>
                </div>
              ) : (
                searchResults.map((item) => {
                  const isBookmarked = bookmarks.some(b => b.source_text.toLowerCase() === item.sourceText.toLowerCase());
                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-stone-200 hover:border-stone-300 rounded-2xl p-5 transition-all shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-serif text-lg font-bold text-stone-900 tracking-tight">{item.sourceText}</span>
                            <ArrowRight className="w-4 h-4 text-stone-400" />
                            <span className="font-serif text-lg font-bold text-amber-800 tracking-tight">{item.targetText}</span>
                            {item.partOfSpeech && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700 uppercase tracking-wider border border-stone-200">
                                {item.partOfSpeech}
                              </span>
                            )}
                            {item.category && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                {item.category}
                              </span>
                            )}
                          </div>
                          {item.phoneticTarget && (
                            <div className="text-xs font-mono text-stone-500 mt-1">
                              {t('practice:dict_pronunciation', 'Pronunciation:')} {item.phoneticTarget}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSpeak(item.targetText, item.targetLang, item.id)}
                            disabled={playingAudioId === item.id}
                            title={t('practice:dict_listen_in', 'Listen to pronunciation in {{lang}}', {
                              lang: getLanguageName(item.targetLang, interfaceLanguage as any),
                            })}
                            className="p-2 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-600 transition-colors border border-stone-200 cursor-pointer"
                          >
                            <Volume2 className={`w-4 h-4 ${playingAudioId === item.id ? 'text-amber-700' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(`${item.sourceText} = ${item.targetText}`, item.id)}
                            title={t('practice:dict_copy_translation', 'Copy translation')}
                            className="p-2 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-600 transition-colors border border-stone-200 cursor-pointer"
                          >
                            {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleBookmark({
                              sourceText: item.sourceText,
                              targetText: item.targetText,
                              sourceLang: item.sourceLang,
                              targetLang: item.targetLang,
                              isVerified: true,
                              notes: item.notes,
                            })}
                            title={t('practice:dict_save_personal', 'Save to personal vocabulary')}
                            className="p-2 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-600 transition-colors border border-stone-200 cursor-pointer"
                          >
                            {isBookmarked ? (
                              <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {item.exampleSource && (
                        <div className="bg-[#FAF9F6] border border-stone-200 rounded-xl p-3 text-xs space-y-1">
                          <div className="text-stone-800 font-medium">"{item.exampleSource}"</div>
                          {item.exampleTarget && (
                            <div className="text-stone-500 italic">"{item.exampleTarget}"</div>
                          )}
                        </div>
                      )}

                      {item.falseFriendWarning && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900">
                          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <div>{item.falseFriendWarning}</div>
                        </div>
                      )}

                      {item.notes && (
                        <div className="text-xs text-stone-600 border-l-2 border-amber-300 pl-3 py-0.5">
                          <strong>{t('practice:dict_usage_tip', 'Usage Tip:')}</strong> {item.notes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right Column: Practice Challenge & False Cognates */}
        <div className="space-y-5">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-700" />
                <h2 className="font-serif font-bold text-stone-900 text-base">
                  {t('practice:dict_challenge_title', 'C1 Challenge')}
                </h2>
              </div>
              <span className="text-xs text-stone-500 font-mono">
                {t('practice:dict_challenge_counter', '{{current}} of {{total}}', {
                  current: currentChallenges.length > 0 ? (challengeIdx % currentChallenges.length) + 1 : 0,
                  total: currentChallenges.length,
                })}
              </span>
            </div>

            {activeChallenge ? (
              <div className="space-y-3.5">
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-stone-200 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    {t('practice:dict_challenge_prompt', 'Translate with formal C1 register:')}
                  </span>
                  <p className="font-serif text-sm font-semibold text-stone-900">"{activeChallenge.source_text}"</p>
                  <p className="text-xs text-stone-500 italic">
                    {t('practice:dict_challenge_topic', 'Topic: {{topic}}', { topic: activeChallenge.topic })}
                  </p>
                </div>

                <div className="space-y-2">
                  {(activeChallenge.options || []).map((opt: string, oIdx: number) => {
                    const isSelected = selectedOption === opt;
                    let optStyle = 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50';
                    if (isAnswerSubmitted) {
                      if (opt === activeChallenge.target_english) {
                        optStyle = 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold';
                      } else if (isSelected) {
                        optStyle = 'border-rose-300 bg-rose-50 text-rose-900';
                      }
                    } else if (isSelected) {
                      optStyle = 'border-stone-900 bg-stone-100 text-stone-900 font-semibold';
                    }

                    return (
                      <button
                        type="button"
                        key={oIdx}
                        onClick={() => handleSelectOption(opt)}
                        className={`w-full p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between text-left ${optStyle}`}
                      >
                        <span>{opt}</span>
                        {isAnswerSubmitted && opt === activeChallenge.target_english && (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {!isAnswerSubmitted ? (
                  <button
                    type="button"
                    onClick={handleSubmitChallenge}
                    disabled={!selectedOption}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
                  >
                    <span>{t('practice:dict_check_answer', 'Check Answer')}</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    {challengeFeedback && (
                      <div
                        className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                          challengeFeedback.isCorrect
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                        }`}
                      >
                        {challengeFeedback.feedback}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleNextChallenge}
                      className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-stone-50 text-stone-900 font-semibold text-xs transition-colors border border-stone-200 flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t('practice:dict_next_challenge', 'Next Challenge')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-dashed border-stone-200 text-xs text-stone-500 text-center">
                {t(
                  'practice:dict_challenge_empty',
                  'No challenges published yet. Generate & publish practice exercises via the AI Content Engine.'
                )}
              </div>
            )}
          </div>

          {/* False Friends Quick Reference Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-700" />
              <h3 className="font-serif font-bold text-stone-900 text-base">
                {t('practice:dict_ff_title', 'Critical False Cognates')}
              </h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              {t(
                'practice:dict_ff_subtitle',
                'Common cross-linguistic interference pitfalls from published AI Content Engine entries:'
              )}
            </p>
            <div className="space-y-2 text-xs">
              {liveFalseFriends.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-dashed border-stone-200 text-xs text-stone-500 text-center">
                  {t(
                    'practice:false_friends_empty_desc',
                    'Generate and publish comparative vocabulary or false-cognate entries via the AI Content Engine to unlock interactive drills.'
                  )}
                </div>
              ) : (
                liveFalseFriends.map(ff => (
                  <div key={ff.id} className="p-3 rounded-xl bg-[#FAF9F6] border border-stone-200 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-stone-900">
                        PT: {ff.portuguese_term} ≠ ES: {ff.spanish_term}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        {ff.cefr_level}
                      </span>
                    </div>
                    <div className="text-stone-600">{ff.interference_warning}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslatePage;
