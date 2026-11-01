import React, { useState } from 'react';
import {
  BookOpen,
  Eye,
  EyeOff,
  Check,
  X,
  HelpCircle,
  ExternalLink,
  Globe,
  Columns,
  ListOrdered,
  FileText,
  BookmarkPlus,
  Volume2,
} from 'lucide-react';
import { DailyLessonPayload, ReadingViewMode, Language } from '../../types';
import { AudioButton } from '../common/AudioButton';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { savePhrasebookWord } from '../../services/localDb';
import { StorageService } from '../../services/storage';
import { useI18n } from '../../i18n/i18nContext';
import { toast } from 'sonner';

interface ReadingSectionProps {
  reading: DailyLessonPayload['section_4_reading'];
  language: Language;
  variety: string;
}

interface SelectedWordPopover {
  word: string;
  definition: string;
  x: number;
  y: number;
}

export const ReadingSection: React.FC<ReadingSectionProps> = ({
  reading,
  language,
  variety,
}) => {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<ReadingViewMode>('original');
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<number, boolean>>({});
  const [activeWordPopover, setActiveWordPopover] = useState<SelectedWordPopover | null>(null);
  const [revealedSentences, setRevealedSentences] = useState<Record<number, boolean>>({});

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (submittedQuestions[qIdx]) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleCheckQuestion = (qIdx: number) => {
    if (selectedAnswers[qIdx] !== undefined) {
      setSubmittedQuestions(prev => ({ ...prev, [qIdx]: true }));
    }
  };

  // Split passages into sentences for sentence-by-sentence view
  const targetSentences = reading.passage_target
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0);

  const enSentences = (reading.passage_en || '')
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0);

  const ptSentences = (reading.passage_pt || '')
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0);

  const esSentences = (reading.passage_es || '')
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0);

  const handleWordClick = (e: React.MouseEvent, rawWord: string) => {
    e.stopPropagation();
    const clean = rawWord.replace(/^[«"'(¿¡\s]+|[»"')!?,.;:\s]+$/g, '').trim();
    if (!clean || clean.length < 2) return;

    // Look up in glossary or fallback
    let definition = reading.glossary ? reading.glossary[clean.toLowerCase()] : null;
    if (!definition && reading.glossary) {
      const matchKey = Object.keys(reading.glossary).find(
        k => k.toLowerCase() === clean.toLowerCase() || clean.toLowerCase().startsWith(k.toLowerCase())
      );
      if (matchKey) definition = reading.glossary[matchKey];
    }

    if (!definition) {
      definition = t('lesson_reading_default_definition', 'Termo de vocabulário do texto');
    }

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setActiveWordPopover({
      word: clean,
      definition,
      x: rect.left,
      y: rect.bottom,
    });
  };

  const handleSaveToPhrasebook = async (word: string, definition: string) => {
    try {
      await savePhrasebookWord({
        user_id: StorageService.getCurrentUser(),
        source_text: word,
        translated_text: definition,
        source_lang: language,
        target_lang: 'en',
        is_verified: true,
      });
      toast.success(`"${word}" ${t('lesson_reading_word_saved', 'adicionado ao seu vocabulário pessoal!')}`);
      setActiveWordPopover(null);
    } catch {
      toast.error(t('lesson_reading_save_error', 'Erro ao salvar palavra localmente.'));
    }
  };

  const toggleSentenceReveal = (idx: number) => {
    setRevealedSentences(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Render clickable paragraph with word tap-to-translate
  const renderInteractiveText = (text: string) => {
    const tokens = text.split(/(\s+)/);
    return tokens.map((token, i) => {
      if (/^\s+$/.test(token)) {
        return <span key={i}>{token}</span>;
      }
      return (
        <span
          key={i}
          onClick={(e) => handleWordClick(e, token)}
          className="hover:bg-indigo-900/40 hover:text-indigo-200 hover:underline cursor-pointer rounded px-0.5 transition-colors"
        >
          {token}
        </span>
      );
    });
  };

  return (
    <div className="space-y-6" onClick={() => setActiveWordPopover(null)}>
      {/* Passage Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                {t('lesson_reading_title', 'Compreensão de Texto')}
              </span>
              {reading.topic_category && (
                <Badge variant="slate" size="sm">
                  {reading.topic_category}
                </Badge>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-0.5">{reading.title}</h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <AudioButton
              text={reading.passage_target}
              language={language}
              variety={variety}
              audioUrl={reading.attribution ? undefined : null}
            />
            {reading.passage_en && (
              <Button
                variant="outline"
                size="sm"
                icon={showTranslation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                onClick={() => setShowTranslation(!showTranslation)}
              >
                {showTranslation ? t('lesson_reading_hide_translation', 'Ocultar Tradução') : t('lesson_reading_show_translation', 'Ver Tradução')}
              </Button>
            )}
          </div>
        </div>

        {/* View Mode Selector: Original, Side-by-Side, Sentence-by-Sentence */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-slate-800/70 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('original')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                viewMode === 'original'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t('lesson_reading_mode_original', 'Original')}</span>
            </button>
            <button
              onClick={() => setViewMode('side_by_side')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                viewMode === 'side_by_side'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>{t('lesson_reading_mode_side_by_side', 'Lado a Lado')}</span>
            </button>
            <button
              onClick={() => setViewMode('sentence_by_sentence')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                viewMode === 'sentence_by_sentence'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>{t('lesson_reading_mode_sentence_by_sentence', 'Frase por Frase')}</span>
            </button>
          </div>

          <span className="text-[11px] text-indigo-300 italic">
            {t('lesson_reading_tap_hint', '💡 Toque em qualquer palavra para traduzir e salvar no vocabulário pessoal.')}
          </span>
        </div>

        {/* View Mode 1: Original View */}
        {viewMode === 'original' && (
          <div className="flex flex-col md:flex-row gap-4 items-start">
            {reading.thumbnail_url && (
              <div className="w-full md:w-48 shrink-0 rounded-xl overflow-hidden border border-slate-800 bg-slate-950/60 shadow-inner">
                <img
                  src={reading.thumbnail_url}
                  alt={reading.title}
                  className="w-full h-36 md:h-44 object-cover"
                  loading="lazy"
                />
                <div className="p-1.5 text-center bg-slate-900/90 text-[10px] text-slate-400">
                  Wikimedia Commons
                </div>
              </div>
            )}
            <div className="flex-1 w-full text-sm text-slate-200 leading-relaxed font-serif bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              <p className="whitespace-pre-line">{renderInteractiveText(reading.passage_target)}</p>
            </div>
          </div>
        )}

        {/* View Mode 2: Side-by-Side View */}
        {viewMode === 'side_by_side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-sm text-slate-200 leading-relaxed font-serif">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-2 font-sans">
                Texto Original ({language.toUpperCase()}):
              </span>
              <p className="whitespace-pre-line">{renderInteractiveText(reading.passage_target)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-800/60 text-sm text-slate-300 leading-relaxed font-serif space-y-4">
              {language === 'en' ? (
                <>
                  {reading.passage_pt && (
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1 font-sans">
                        Tradução em Português (PT):
                      </span>
                      <p className="whitespace-pre-line text-slate-300 text-xs sm:text-sm">{reading.passage_pt}</p>
                    </div>
                  )}
                  {reading.passage_es && (
                    <div className={reading.passage_pt ? 'pt-3 border-t border-slate-800' : ''}>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1 font-sans">
                        Traducción en Español (ES):
                      </span>
                      <p className="whitespace-pre-line text-slate-300 text-xs sm:text-sm">{reading.passage_es}</p>
                    </div>
                  )}
                  {!reading.passage_pt && !reading.passage_es && (
                    <p className="text-slate-500 italic text-xs">(Traduções em português e espanhol indisponíveis)</p>
                  )}
                </>
              ) : (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-sans">
                    Tradução Paralela (EN):
                  </span>
                  <p className="whitespace-pre-line">{reading.passage_en || '(Tradução em inglês indisponível)'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Mode 3: Sentence-by-Sentence View */}
        {viewMode === 'sentence_by_sentence' && (
          <div className="space-y-3">
            {targetSentences.map((sent, sIdx) => {
              const isRevealed = !!revealedSentences[sIdx];
              const enMatch = enSentences[sIdx] || '';
              const ptMatch = ptSentences[sIdx] || '';
              const esMatch = esSentences[sIdx] || '';
              const hasTranslation = language === 'en' ? (ptMatch || esMatch) : enMatch;

              return (
                <div
                  key={sIdx}
                  className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm text-slate-200 leading-relaxed font-serif">
                      <span className="text-xs font-mono text-indigo-400 font-bold mr-2">
                        {sIdx + 1}.
                      </span>
                      {renderInteractiveText(sent)}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <AudioButton text={sent} language={language} variety={variety} />
                      {hasTranslation && (
                        <button
                          onClick={() => toggleSentenceReveal(sIdx)}
                          className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer text-xs"
                          title="Revelar tradução da frase"
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {isRevealed && (
                    <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 font-serif animate-fadeIn space-y-1">
                      {language === 'en' ? (
                        <>
                          {ptMatch && (
                            <p>
                              <span className="font-bold text-indigo-400 font-sans mr-1">PT:</span>
                              {ptMatch}
                            </p>
                          )}
                          {esMatch && (
                            <p>
                              <span className="font-bold text-emerald-400 font-sans mr-1">ES:</span>
                              {esMatch}
                            </p>
                          )}
                        </>
                      ) : (
                        enMatch && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase font-sans block mb-0.5">
                              Tradução:
                            </span>
                            {enMatch}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Optional English / Multilingual Translation / Summary */}
        {showTranslation && viewMode === 'original' && (
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 leading-relaxed animate-fadeIn space-y-3">
            {language === 'en' ? (
              <>
                {reading.passage_pt && (
                  <div>
                    <span className="font-bold text-indigo-400 block mb-1">Tradução em Português (PT):</span>
                    <p className="whitespace-pre-line text-slate-300">{reading.passage_pt}</p>
                  </div>
                )}
                {reading.passage_es && (
                  <div className={reading.passage_pt ? 'pt-2 border-t border-slate-700/50' : ''}>
                    <span className="font-bold text-emerald-400 block mb-1">Traducción en Español (ES):</span>
                    <p className="whitespace-pre-line text-slate-300">{reading.passage_es}</p>
                  </div>
                )}
              </>
            ) : (
              reading.passage_en && (
                <div>
                  <span className="font-semibold text-slate-300 block mb-1">Tradução de Referência (EN):</span>
                  <p className="whitespace-pre-line text-slate-400">{reading.passage_en}</p>
                </div>
              )
            )}
          </div>
        )}

        {/* Vocabulary Glossary */}
        {reading.glossary && Object.keys(reading.glossary).length > 0 && (
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-300 block mb-2">Glossário Textual:</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(reading.glossary).map(([term, def]) => (
                <div
                  key={term}
                  className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs flex items-center gap-1.5"
                >
                  <span className="font-bold text-indigo-300">{term}:</span>
                  <span className="text-slate-300">{def}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attribution & Open License Footer */}
        {reading.attribution && (
          <div className="text-[11px] text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 border-t border-slate-800/60 pt-3">
            <span>{reading.attribution.attribution_text}</span>
            {reading.attribution.terms_url && (
              <a
                href={reading.attribution.terms_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                {reading.attribution.license_type}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Responsive Word Popover / Bottom Sheet */}
      {activeWordPopover && (
        <>
          {/* Mobile Bottom Sheet (< 768px) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-slate-900 border-t-2 border-indigo-500 p-4 shadow-2xl space-y-3 animate-slideUp"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-base">{activeWordPopover.word}</span>
                <AudioButton text={activeWordPopover.word} language={language} variety={variety} />
              </div>
              <button
                onClick={() => setActiveWordPopover(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">{activeWordPopover.definition}</p>
            <button
              onClick={() => handleSaveToPhrasebook(activeWordPopover.word, activeWordPopover.definition)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition min-h-[44px] cursor-pointer"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>Salvar no Meu Vocabulário</span>
            </button>
          </div>

          {/* Desktop Floating Tooltip (>= 768px) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="hidden md:block fixed z-50 bg-slate-900 border border-indigo-500/80 rounded-xl p-3 shadow-2xl max-w-xs text-xs space-y-2 animate-fadeIn"
            style={{
              left: Math.min(Math.max(16, activeWordPopover.x - 40), window.innerWidth - 300),
              top: Math.min(activeWordPopover.y + 8, window.innerHeight - 160),
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <span className="font-bold text-slate-100 text-sm">{activeWordPopover.word}</span>
              <div className="flex items-center gap-1">
                <AudioButton text={activeWordPopover.word} language={language} variety={variety} />
                <button
                  onClick={() => setActiveWordPopover(null)}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer p-0.5"
                  aria-label="Fechar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              {activeWordPopover.definition}
            </p>
            <button
              onClick={() => handleSaveToPhrasebook(activeWordPopover.word, activeWordPopover.definition)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition shadow-sm min-h-[36px]"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Salvar no Meu Vocabulário</span>
            </button>
          </div>
        </>
      )}

      {/* Comprehension Questions */}
      {reading.comprehension_questions && reading.comprehension_questions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-sky-400" />
            Questões de Interpretação e Inferência
          </h3>

          <div className="space-y-4">
            {reading.comprehension_questions.map((q, qIdx) => {
              const chosen = selectedAnswers[qIdx];
              const isSubmitted = submittedQuestions[qIdx];
              const isCorrect = chosen === q.correct_option_index;

              return (
                <div key={qIdx} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-3">
                  <p className="text-xs font-semibold text-slate-100">
                    {qIdx + 1}. {q.question}
                  </p>

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = chosen === optIdx;
                      let optClasses = 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700/60';

                      if (isSubmitted) {
                        if (optIdx === q.correct_option_index) {
                          optClasses = 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-semibold';
                        } else if (isSelected && !isCorrect) {
                          optClasses = 'border-rose-500 bg-rose-950/40 text-rose-200';
                        }
                      } else if (isSelected) {
                        optClasses = 'border-indigo-500 bg-indigo-950/50 text-indigo-200';
                      }

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${optClasses}`}
                        >
                          <span>{opt}</span>
                          {isSubmitted && optIdx === q.correct_option_index && (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                          {isSubmitted && isSelected && !isCorrect && (
                            <X className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!isSubmitted ? (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={chosen === undefined}
                      onClick={() => handleCheckQuestion(qIdx)}
                    >
                      {t('lesson_exercise_check', 'Verificar Resposta')}
                    </Button>
                  ) : (
                    <div className={`p-3 rounded-lg text-xs leading-relaxed ${isCorrect ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60' : 'bg-slate-900 text-slate-300 border border-slate-700'}`}>
                      <span className="font-bold block mb-0.5">{isCorrect ? t('explore_quiz_correct', 'Correto!') : 'Explicação:'}</span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
