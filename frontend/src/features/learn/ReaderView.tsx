import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Volume2,
  BookOpen,
  Sparkles,
  Languages,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
  Bookmark,
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

  // Track content opening
  useEffect(() => {
    const auth = authService.getState();
    const userId = auth.user?.id || 'guest_user';
    contentCentredService.updateLearnerProgress({
      user_id: userId,
      content_item_id: item.id,
      content_version_id: version.id,
      status: 'in_progress',
      percent_complete: 25,
      time_spent_seconds: 10,
    }).catch(console.warn);
  }, [item.id, version.id]);

  const handleSentenceClick = (sentenceId: string) => {
    setSelectedSentenceId(prev => (prev === sentenceId ? null : sentenceId));
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
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Navigation & Controls */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={onBack}>
          Catalog
        </Button>

        <div className="flex items-center gap-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center">
            <button
              onClick={() => setActiveTab('read')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'read' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read</span>
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'activities' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Activities ({activities.reduce((s, a) => s + a.configuration.questions.length, 0)})</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<Languages className="w-4 h-4" />}
            onClick={() => setShowAllTranslations(prev => !prev)}
            title="Toggle translations for all sentences"
          >
            {showAllTranslations ? 'Hide Translations' : 'Show Translations'}
          </Button>
        </div>
      </div>

      {/* Reader Surface */}
      {activeTab === 'read' ? (
        <article className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-12 shadow-xl space-y-8">
          {/* Header Metadata */}
          <header className="space-y-4 border-b border-slate-800 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo">{item.target_language.toUpperCase()}</Badge>
              <Badge variant="slate">{version.cefr_level}</Badge>
              <Badge variant="slate">{item.genre.replace('_', ' ').toUpperCase()}</Badge>
              <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                <Clock className="w-3.5 h-3.5" />
                ~{item.estimated_read_minutes} min read
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
              {item.title}
            </h1>

            {item.author && (
              <p className="text-xs font-medium text-slate-400">
                By <span className="text-slate-200">{item.author}</span>
              </p>
            )}
          </header>

          {/* Reading Paragraphs */}
          <div className="space-y-6 text-base sm:text-lg leading-relaxed text-slate-200 font-serif">
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
                      className={`inline rounded px-1.5 py-0.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/80 ring-1 ring-indigo-500/80 text-white'
                          : 'hover:bg-slate-800/70'
                      }`}
                    >
                      {/* Tokens */}
                      {sentence.tokens.map((token, tokIdx) => {
                        const hasGloss = Boolean(token.gloss_id || payload.annotations[`g_${token.lemma.toLowerCase()}`]);
                        const isPunct = token.pos === 'PUNCT';

                        return (
                          <span
                            key={tokIdx}
                            onClick={e => handleTokenClick(e, token, sentence, paragraph)}
                            className={`transition-colors ${
                              isPunct
                                ? 'text-slate-400'
                                : hasGloss
                                ? 'text-indigo-200 hover:text-indigo-400 font-medium underline decoration-indigo-500/50 decoration-dotted underline-offset-4 cursor-pointer'
                                : 'hover:text-slate-100'
                            }`}
                          >
                            {token.text}{' '}
                          </span>
                        );
                      })}

                      {/* Sentence Audio Icon */}
                      <button
                        onClick={e => handlePlaySentenceAudio(e, sentence)}
                        className={`inline-flex items-center align-middle ml-1 p-1 rounded-full text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors ${
                          isPlaying ? 'text-indigo-400 animate-pulse' : ''
                        }`}
                        title="Listen to sentence"
                        aria-label="Listen to sentence"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Aligned Translation Dropdown */}
                      {showTrans && sentence.translations?.[item.explanation_language] && (
                        <span className="block mt-1 mb-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 font-sans text-xs text-indigo-300 font-normal">
                          {sentence.translations[item.explanation_language]}
                        </span>
                      )}
                    </span>
                  );
                })}
              </p>
            ))}
          </div>

          {/* Bottom Actions */}
          <footer className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              Click any sentence for translation, or click any word for contextual vocabulary definitions.
            </span>

            {activities.length > 0 && (
              <Button
                variant="primary"
                size="md"
                icon={<Sparkles className="w-4 h-4" />}
                onClick={() => setActiveTab('activities')}
              >
                Start Comprehension Activities
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
