import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Volume2,
  BookOpen,
  Sparkles,
  Languages,
  Clock,
} from 'lucide-react';
import {
  ContentItem,
  ContentVersion,
  LearningActivity,
  ContentSentence,
  ContentParagraph,
  ContentToken,
} from '../../types/contentCentred';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { SpeechService } from '../../services/speech';
import { contentCentredService } from '../../services/contentCentredService';
import { authService } from '../../services/auth';
import { ContextualLookupModal, ContextualLookupData } from './ContextualLookupModal';
import { ContentActivities } from './ContentActivities';
import { toast } from 'sonner';

interface ReaderViewProps {
  item: ContentItem;
  version: ContentVersion;
  activities: LearningActivity[];
  onBack: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  item,
  version,
  activities,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'read' | 'activities'>('read');
  const [selectedSentenceId, setSelectedSentenceId] = useState<string | null>(null);
  const [lookupData, setLookupData] = useState<ContextualLookupData | null>(null);
  const [playingSentenceId, setPlayingSentenceId] = useState<string | null>(null);
  const [showAllTranslations, setShowAllTranslations] = useState(false);

  const payload = version.structured_payload;
  const allSentences = (payload.paragraphs || []).flatMap(p => p.sentences || []);
  const totalSentences = allSentences.length;

  // Restore reading position and track session initiation
  useEffect(() => {
    let isCancelled = false;
    const auth = authService.getState();
    const userId = auth.user?.id || 'guest_user';

    const restorePosition = async () => {
      try {
        const existing = await contentCentredService.getLearnerProgress(userId, item.id);
        if (isCancelled) return;

        const storedPosId = localStorage.getItem(`lexilume_reading_pos_${item.id}_${version.id}`);
        let sentenceToRestore: string | null = null;

        if (storedPosId && allSentences.some(s => s.id === storedPosId)) {
          sentenceToRestore = storedPosId;
        } else if (existing && existing.percent_complete > 0 && totalSentences > 0) {
          const targetIdx = Math.min(
            totalSentences - 1,
            Math.max(0, Math.floor((existing.percent_complete / 100) * totalSentences) - 1)
          );
          if (allSentences[targetIdx]) {
            sentenceToRestore = allSentences[targetIdx].id;
          }
        }

        if (sentenceToRestore) {
          setSelectedSentenceId(sentenceToRestore);
          setTimeout(() => {
            const el = document.querySelector(`[data-testid="sentence-${sentenceToRestore}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }

        // Maintain existing reading progress percentage or initialize to 10%
        const initialPct = existing?.percent_complete ?? 10;
        await contentCentredService.updateLearnerProgress({
          user_id: userId,
          content_item_id: item.id,
          content_version_id: version.id,
          status: 'in_progress',
          percent_complete: initialPct,
          time_spent_seconds: (existing?.time_spent_seconds || 0) + 10,
        });
      } catch (err) {
        console.warn('Error restoring reading position:', err);
      }
    };

    restorePosition();

    return () => {
      isCancelled = true;
    };
  }, [item.id, version.id, totalSentences]);

  const handleSentenceClick = (sentenceId: string) => {
    setSelectedSentenceId(prev => (prev === sentenceId ? null : sentenceId));

    const sentenceIdx = allSentences.findIndex(s => s.id === sentenceId);
    if (sentenceIdx !== -1) {
      try {
        localStorage.setItem(`lexilume_reading_pos_${item.id}_${version.id}`, sentenceId);
      } catch {}

      const pct = totalSentences > 0 ? Math.round(((sentenceIdx + 1) / totalSentences) * 100) : 100;
      const auth = authService.getState();
      const userId = auth.user?.id || 'guest_user';

      contentCentredService.updateLearnerProgress({
        user_id: userId,
        content_item_id: item.id,
        content_version_id: version.id,
        status: pct >= 100 ? 'completed' : 'in_progress',
        percent_complete: pct,
        time_spent_seconds: Math.max(10, Math.round((sentenceIdx + 1) * 15)),
      }).catch(console.warn);
    }
  };

  const handleTokenClick = (
    e: React.MouseEvent,
    token: ContentToken,
    sentence: ContentSentence,
    paragraph: ContentParagraph
  ) => {
    e.stopPropagation();
    if (token.pos === 'PUNCT') return;

    const glossId = token.gloss_id || `g_${token.lemma.toLowerCase()}`;
    const annotation = payload.annotations[glossId];

    setLookupData({
      selectedText: token.text,
      sentence,
      paragraph,
      targetLanguage: item.target_language,
      explanationLanguage: item.explanation_language,
      contentId: item.id,
      versionId: version.id,
      annotation,
    });
  };

  const handleTokenKeyDown = (
    e: React.KeyboardEvent,
    token: ContentToken,
    sentence: ContentSentence,
    paragraph: ContentParagraph
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTokenClick(e as any, token, sentence, paragraph);
    }
  };

  const handlePlaySentenceAudio = async (e: React.MouseEvent, sentence: ContentSentence) => {
    e.stopPropagation();
    setPlayingSentenceId(sentence.id);
    try {
      await SpeechService.speak(sentence.text, item.target_language);
    } catch (err) {
      console.warn('Audio playback error:', err);
    } finally {
      setPlayingSentenceId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24">
      {/* Top Editorial Toolbar */}
      <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={onBack}>
          Library
        </Button>

        <div className="flex items-center gap-2">
          <div className="bg-stone-100 border border-stone-200 rounded-lg p-0.5 flex items-center">
            <button
              onClick={() => setActiveTab('read')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'read' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read</span>
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'activities' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-800" />
              <span>Activities ({activities.reduce((s, a) => s + (a.configuration?.questions?.length || 0), 0)})</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<Languages className="w-3.5 h-3.5" />}
            onClick={() => setShowAllTranslations(prev => !prev)}
            title="Toggle translations for all sentences"
          >
            {showAllTranslations ? 'Hide Translations' : 'Translations'}
          </Button>
        </div>
      </div>

      {/* Reader Surface */}
      {activeTab === 'read' ? (
        <article className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-12 shadow-xs space-y-8">
          {/* Header Metadata */}
          <header className="space-y-4 border-b border-stone-200 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-bold text-amber-900">
                {item.genre.replace('_', ' ')}
              </span>
              <span className="text-stone-300">•</span>
              <Badge variant="indigo">{item.target_language.toUpperCase()}</Badge>
              <Badge variant="slate">{version.cefr_level}</Badge>
              <span className="text-xs text-stone-500 flex items-center gap-1 ml-auto">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                ~{item.estimated_read_minutes} min read
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
              {item.title}
            </h1>

            {item.author && (
              <p className="text-xs font-sans text-stone-500">
                By <span className="text-stone-800 font-medium">{item.author}</span>
                {item.attribution_notice && ` • ${item.attribution_notice}`}
              </p>
            )}
          </header>

          {/* Reading Paragraphs */}
          <div className="space-y-6 text-lg sm:text-xl leading-[1.85] text-stone-900 font-serif">
            {payload.paragraphs.map(paragraph => (
              <p key={paragraph.id} className="space-x-1">
                {paragraph.sentences.map(sentence => {
                  const isSelected = selectedSentenceId === sentence.id;
                  const isPlaying = playingSentenceId === sentence.id;
                  const showTrans = showAllTranslations || isSelected;

                  return (
                    <span
                      key={sentence.id}
                      data-testid={`sentence-${sentence.id}`}
                      onClick={() => handleSentenceClick(sentence.id)}
                      className={`inline rounded px-1 py-0.5 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-100/80 text-stone-950 ring-1 ring-amber-300'
                          : 'hover:bg-amber-50/70'
                      }`}
                    >
                      {/* Word Tokens */}
                      {sentence.tokens.map((token, tokIdx) => {
                        const hasGloss = Boolean(token.gloss_id || payload.annotations[`g_${token.lemma.toLowerCase()}`]);
                        const isPunct = token.pos === 'PUNCT';

                        return (
                          <span
                            key={tokIdx}
                            tabIndex={isPunct ? -1 : 0}
                            role={isPunct ? undefined : 'button'}
                            aria-label={isPunct ? undefined : `Lookup ${token.text}`}
                            onClick={e => handleTokenClick(e, token, sentence, paragraph)}
                            onKeyDown={e => handleTokenKeyDown(e, token, sentence, paragraph)}
                            className={`transition-colors select-text ${
                              isPunct
                                ? 'text-stone-400 font-serif'
                                : hasGloss
                                ? 'text-stone-900 font-serif font-medium underline decoration-stone-300 decoration-dotted underline-offset-4 hover:text-amber-900 hover:decoration-amber-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400 rounded-sm'
                                : 'hover:text-stone-700 focus:outline-none focus:underline'
                            }`}
                          >
                            {token.text}{' '}
                          </span>
                        );
                      })}

                      {/* Sentence Audio Trigger */}
                      <button
                        onClick={e => handlePlaySentenceAudio(e, sentence)}
                        className={`inline-flex items-center align-middle ml-1 p-0.5 rounded text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer ${
                          isPlaying ? 'text-stone-900 animate-pulse' : ''
                        }`}
                        title="Listen to sentence"
                        aria-label="Listen to sentence"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Inline Sentence Translation */}
                      {showTrans && sentence.translations?.[item.explanation_language] && (
                        <span className="block mt-1.5 mb-2 px-3 py-1.5 rounded-lg bg-[#FDFBF7] border border-stone-200 font-sans text-xs sm:text-sm text-stone-700 font-normal leading-normal shadow-2xs">
                          {sentence.translations[item.explanation_language]}
                        </span>
                      )}
                    </span>
                  );
                })}
              </p>
            ))}
          </div>

          {/* Bottom Reader Actions */}
          <footer className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-stone-500 font-sans">
              Click any sentence for translation, or click underlined words for contextual vocabulary definitions.
            </span>

            {activities.length > 0 && (
              <Button
                variant="primary"
                size="md"
                icon={<Sparkles className="w-4 h-4" />}
                onClick={() => setActiveTab('activities')}
              >
                Comprehension Activities
              </Button>
            )}
          </footer>
        </article>
      ) : (
        /* Activities View */
        <ContentActivities
          item={item}
          version={version}
          activities={activities}
          onComplete={score => {
            toast.success(`Completed reading session with ${score}%!`);
          }}
        />
      )}

      {/* Contextual Word Lookup Modal */}
      <ContextualLookupModal
        data={lookupData}
        onClose={() => setLookupData(null)}
        onSavedWord={() => {
          // Callback after word saved
        }}
      />
    </div>
  );
};
