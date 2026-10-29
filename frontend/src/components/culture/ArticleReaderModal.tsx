import React, { useState, useEffect } from 'react';
import {
  X,
  Bookmark,
  BookmarkCheck,
  Globe,
  Clock,
  Sparkles,
  HelpCircle,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  XCircle,
  BookmarkPlus,
  Volume2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { CulturalArticle } from '../../types/culture';
import { CultureService } from '../../services/cultureService';
import { AudioButton } from '../common/AudioButton';
import { useI18n } from '../../i18n/i18nContext';
import { savePhrasebookWord } from '../../services/localDb';
import { toast } from 'sonner';

interface ArticleReaderModalProps {
  article: CulturalArticle;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onBookmarkChanged?: () => void;
}

interface WordInspection {
  word: string;
  definition: string;
  x: number;
  y: number;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  article,
  userId,
  isOpen,
  onClose,
  onBookmarkChanged,
}) => {
  const { t } = useI18n();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [inspectedWord, setInspectedWord] = useState<WordInspection | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    CultureService.isBookmarked(userId, article.id).then(saved => {
      if (mounted) setIsBookmarked(saved);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (inspectedWord) {
          setInspectedWord(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      mounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, article.id, userId, inspectedWord, onClose]);

  if (!isOpen) return null;

  const handleToggleBookmark = async () => {
    const newState = await CultureService.toggleBookmark(userId, article);
    setIsBookmarked(newState);
    if (newState) {
      toast.success(t('explore_bookmark_save'));
    } else {
      toast.info(t('explore_bookmark_remove'));
    }
    if (onBookmarkChanged) {
      onBookmarkChanged();
    }
  };

  const handleWordClick = (e: React.MouseEvent, rawWord: string) => {
    e.stopPropagation();
    const clean = rawWord.replace(/^[«"'(¿¡\s]+|[»"')!?,.;:\s]+$/g, '').trim();
    if (!clean || clean.length < 2) return;

    let definition = article.glossary ? article.glossary[clean.toLowerCase()] : null;
    if (!definition && article.glossary) {
      const matchKey = Object.keys(article.glossary).find(
        k => k.toLowerCase() === clean.toLowerCase() || clean.toLowerCase().startsWith(k.toLowerCase())
      );
      if (matchKey) definition = article.glossary[matchKey];
    }

    if (!definition) {
      definition =
        article.content_language === 'pt'
          ? 'Termo autêntico do texto'
          : article.content_language === 'es'
          ? 'Término auténtico del texto'
          : 'Authentic text vocabulary term';
    }

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setInspectedWord({
      word: clean,
      definition,
      x: rect.left,
      y: rect.bottom,
    });
  };

  const handleSaveToPhrasebook = async (word: string, definition: string) => {
    try {
      await savePhrasebookWord({
        user_id: userId,
        source_text: word,
        translated_text: definition,
        source_lang: article.content_language,
        target_lang: 'en',
        is_verified: true,
      });
      toast.success(`"${word}" adicionado ao seu vocabulário pessoal!`);
      setInspectedWord(null);
    } catch {
      toast.error('Não foi possível salvar o vocabulário localmente.');
    }
  };

  const handleOptionSelect = (qIdx: number, optIdx: number) => {
    if (submittedAnswers[qIdx]) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmitQuestion = (qIdx: number) => {
    if (selectedAnswers[qIdx] !== undefined) {
      setSubmittedAnswers(prev => ({ ...prev, [qIdx]: true }));
    }
  };

  const getLanguageLabel = (lang: string) => {
    if (lang === 'pt') return 'Português';
    if (lang === 'es') return 'Español';
    return 'English';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={() => {
        if (inspectedWord) setInspectedWord(null);
      }}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
              <Globe className="w-3.5 h-3.5" />
              <span>{article.origin_country}</span>
              <span className="text-slate-400 font-normal">({article.origin_region})</span>
            </span>

            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 uppercase">
              {getLanguageLabel(article.content_language)}
            </span>

            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-700/50">
              CEFR {article.cefr_level}
            </span>

            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{article.read_time_minutes} min</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleBookmark}
              className={`p-2 rounded-xl transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-700'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
              title={isBookmarked ? t('explore_bookmark_remove') : t('explore_bookmark_save')}
              aria-label={isBookmarked ? t('explore_bookmark_remove') : t('explore_bookmark_save')}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-5 h-5 text-amber-400" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title="Fechar (Esc)"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
          {/* Article Title & Summary */}
          <div className="space-y-3 border-b border-slate-800/80 pb-5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 leading-tight">
              {article.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {article.summary}
            </p>

            <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200">
                  <AudioButton
                    text={article.content_paragraphs.join(' ')}
                    language={article.content_language}
                  />
                  <span>Ouvir Artigo</span>
                </div>

                {article.content_translation && (
                  <button
                    onClick={() => setShowTranslation(!showTranslation)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer transition min-h-[44px]"
                  >
                    {showTranslation ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-indigo-400" />}
                    <span>{showTranslation ? 'Ocultar Tradução' : 'Exibir Tradução'}</span>
                  </button>
                )}
              </div>

              <span className="text-xs text-indigo-400/90 italic">
                {t('explore_tap_word_hint')}
              </span>
            </div>
          </div>

          {/* Article Content Paragraphs with Interactive Word Inspection */}
          <div className="space-y-5 text-sm sm:text-base leading-relaxed text-slate-200">
            {article.content_paragraphs.map((para, pIdx) => {
              const words = para.split(/\s+/);
              return (
                <div key={pIdx} className="space-y-2">
                  <p className="font-serif sm:font-sans">
                    {words.map((word, wIdx) => {
                      const clean = word.replace(/^[«"'(¿¡\s]+|[»"')!?,.;:\s]+$/g, '').toLowerCase();
                      const hasGlossary = article.glossary && Object.keys(article.glossary).some(k => k.toLowerCase() === clean);

                      return (
                        <span
                          key={wIdx}
                          onClick={e => handleWordClick(e, word)}
                          className={`cursor-pointer transition-colors duration-150 inline-block px-0.5 rounded ${
                            hasGlossary
                              ? 'border-b-2 border-indigo-400/80 font-medium text-indigo-200 hover:bg-indigo-900/40'
                              : 'hover:text-sky-300 hover:bg-slate-800/80'
                          }`}
                        >
                          {word}{' '}
                        </span>
                      );
                    })}
                  </p>

                  {/* Optional Bilingual Sentence / Paragraph Translation */}
                  {showTranslation && article.content_translation && article.content_translation[pIdx] && (
                    <div className="p-3 rounded-xl bg-slate-800/60 border-l-4 border-indigo-500 text-xs sm:text-sm text-slate-300 italic animate-fadeIn">
                      {article.content_translation[pIdx]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Glossary Section */}
          {article.glossary && Object.keys(article.glossary).length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{t('explore_glossary_title')}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(article.glossary).map(([term, def]) => (
                  <div
                    key={term}
                    className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-indigo-300 capitalize">{term}</span>
                        <AudioButton text={term} language={article.content_language} />
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{def}</p>
                    </div>

                    <button
                      onClick={() => handleSaveToPhrasebook(term, def)}
                      className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-slate-700 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shrink-0"
                      title="Salvar no Vocabulário"
                      aria-label="Salvar no Vocabulário"
                    >
                      <BookmarkPlus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comprehension Quiz */}
          {article.comprehension_questions && article.comprehension_questions.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span>{t('explore_quiz_title')}</span>
              </h2>

              <div className="space-y-4">
                {article.comprehension_questions.map((q, qIdx) => {
                  const chosen = selectedAnswers[qIdx];
                  const isSubmitted = submittedAnswers[qIdx];
                  const isCorrect = chosen === q.correct_index;

                  return (
                    <div
                      key={qIdx}
                      className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-3"
                    >
                      <p className="text-xs sm:text-sm font-semibold text-slate-100">
                        {qIdx + 1}. {q.question}
                      </p>

                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = chosen === optIdx;
                          let classes = 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700/60';

                          if (isSubmitted) {
                            if (optIdx === q.correct_index) {
                              classes = 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-semibold';
                            } else if (isSelected && !isCorrect) {
                              classes = 'border-rose-500 bg-rose-950/40 text-rose-200';
                            }
                          } else if (isSelected) {
                            classes = 'border-indigo-500 bg-indigo-950/50 text-indigo-200';
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleOptionSelect(qIdx, optIdx)}
                              className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition flex items-center justify-between min-h-[44px] cursor-pointer ${classes}`}
                            >
                              <span>{opt}</span>
                              {isSubmitted && optIdx === q.correct_index && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                              )}
                              {isSubmitted && isSelected && !isCorrect && (
                                <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {!isSubmitted ? (
                        <button
                          onClick={() => handleSubmitQuestion(qIdx)}
                          disabled={chosen === undefined}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition min-h-[44px] cursor-pointer ${
                            chosen !== undefined
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          }`}
                        >
                          {t('explore_quiz_check')}
                        </button>
                      ) : (
                        <div
                          className={`p-3 rounded-xl text-xs leading-relaxed border animate-fadeIn ${
                            isCorrect
                              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                              : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                          }`}
                        >
                          <p className="font-bold">
                            {isCorrect ? t('explore_quiz_correct') : t('explore_quiz_incorrect')}
                          </p>
                          <p className="mt-1 text-slate-300">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Open Attribution & License */}
          <div className="border-t border-slate-800/80 pt-4 text-xs text-slate-500 space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-semibold text-slate-400">
                {t('explore_source_attribution')}: {article.publisher}
              </span>
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline"
              >
                <span>Fonte Original</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[11px] text-slate-500">{article.attribution_text}</p>
          </div>
        </div>

        {/* Responsive Word Popover / Bottom Sheet */}
        {inspectedWord && (
          <>
            {/* Mobile Bottom Sheet (< 768px) */}
            <div
              className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-slate-900 border-t-2 border-indigo-500 p-4 shadow-2xl space-y-3 animate-slideUp"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-base">{inspectedWord.word}</span>
                  <AudioButton text={inspectedWord.word} language={article.content_language} />
                </div>
                <button
                  onClick={() => setInspectedWord(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed">{inspectedWord.definition}</p>

              <button
                onClick={() => handleSaveToPhrasebook(inspectedWord.word, inspectedWord.definition)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition min-h-[44px] cursor-pointer"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>Salvar no Meu Vocabulário</span>
              </button>
            </div>

            {/* Desktop Viewport-Clamped Floating Tooltip (>= 768px) */}
            <div
              className="hidden md:block fixed z-50 bg-slate-900 border border-indigo-500/80 rounded-xl p-3 shadow-2xl max-w-xs text-xs space-y-2 animate-fadeIn"
              style={{
                left: Math.min(Math.max(16, inspectedWord.x - 40), window.innerWidth - 300),
                top: Math.min(inspectedWord.y + 8, window.innerHeight - 150),
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                <span className="font-bold text-slate-100 text-sm">{inspectedWord.word}</span>
                <div className="flex items-center gap-1">
                  <AudioButton text={inspectedWord.word} language={article.content_language} />
                  <button
                    onClick={() => setInspectedWord(null)}
                    className="text-slate-400 hover:text-slate-200 cursor-pointer p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">{inspectedWord.definition}</p>
              <button
                onClick={() => handleSaveToPhrasebook(inspectedWord.word, inspectedWord.definition)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition shadow-sm"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Salvar no Vocabulário</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
