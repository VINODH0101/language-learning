import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Bookmark,
  Check,
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import {
  ContentSentence,
  ContentParagraph,
  LexicalAnnotation,
} from '../../types/contentCentred';
import { Language, ExplanationLanguage } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { SpeechService } from '../../services/speech';
import { contentCentredService } from '../../services/contentCentredService';
import { authService } from '../../services/auth';
import { toast } from 'sonner';

export interface ContextualLookupData {
  selectedText: string;
  sentence: ContentSentence;
  paragraph: ContentParagraph;
  targetLanguage: Language;
  explanationLanguage: ExplanationLanguage;
  contentId: string;
  versionId: string;
  annotation?: LexicalAnnotation;
}

interface ContextualLookupModalProps {
  data: ContextualLookupData | null;
  onClose: () => void;
  onSavedWord?: () => void;
}

export const ContextualLookupModal: React.FC<ContextualLookupModalProps> = ({
  data,
  onClose,
  onSavedWord,
}) => {
  if (!data) return null;

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const {
    selectedText,
    sentence,
    targetLanguage,
    explanationLanguage,
    contentId,
    versionId,
    annotation,
  } = data;

  const term = annotation?.term || selectedText;
  const lemma = annotation?.lemma || selectedText.toLowerCase();
  const pos = annotation?.pos || 'noun';
  const cefr = annotation?.cefr || 'B1';
  const contextualMeaning =
    annotation?.contextual_meaning ||
    `Used here to convey: "${sentence.text.substring(0, 70)}..."`;
  const generalDefinition =
    annotation?.general_definition ||
    `Standard lexical dictionary definition for "${lemma}".`;
  const contextTranslation =
    annotation?.context_translation?.[explanationLanguage] ||
    sentence.translations?.[explanationLanguage] ||
    `Tradução de "${term}"`;

  // Keyboard accessibility: Escape key dismisses popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePlayAudio = async () => {
    setIsPlayingAudio(true);
    try {
      await SpeechService.speak(term, targetLanguage);
    } catch (e) {
      console.warn('Speech error:', e);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleSaveToMyWords = async () => {
    setIsSaving(true);
    try {
      const auth = authService.getState();
      const userId = auth.user?.id || 'guest_user';

      await contentCentredService.saveUserWord({
        user_id: userId,
        target_language: targetLanguage,
        explanation_language: explanationLanguage,
        term,
        lemma,
        pos,
        cefr_level: cefr,
        definition: contextualMeaning,
        context_sentence: sentence.text,
        context_translation: contextTranslation,
        source_content_id: contentId,
        source_version_id: versionId,
      });

      setIsSaved(true);
      toast.success(`Saved "${term}" to your personal vocabulary.`);
      if (onSavedWord) onSavedWord();
    } catch (err: any) {
      toast.error(err.message || 'Could not save word');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="lookup-term-heading"
      className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[85vh] bg-white border border-stone-300/90 rounded-2xl shadow-2xl p-5 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="space-y-4">
        {/* Header: Term, POS, Audio, Close */}
        <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2
                id="lookup-term-heading"
                className="text-2xl font-serif font-bold text-stone-900 tracking-tight leading-none"
              >
                {term}
              </h2>
              <button
                onClick={handlePlayAudio}
                disabled={isPlayingAudio}
                className="p-1 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                title="Listen to pronunciation"
                aria-label="Listen to pronunciation"
              >
                <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse text-stone-900' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 pt-0.5">
              <Badge variant="indigo">{pos.toUpperCase()}</Badge>
              <Badge variant="slate">{cefr}</Badge>
              {annotation?.ipa && (
                <span className="text-xs font-mono text-stone-500">
                  {annotation.ipa}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Contextual Meaning in this Sentence (Primary) */}
        <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-800" />
            <span>Contextual Meaning in this Sentence</span>
          </div>
          <p className="text-sm font-medium text-stone-900 leading-snug">
            {contextualMeaning}
          </p>
        </div>

        {/* 2. Translation & General Definition */}
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">Translation</span>
            <p className="text-sm font-serif font-semibold text-stone-800 mt-0.5">
              {contextTranslation}
            </p>
          </div>

          {generalDefinition && (
            <div>
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">Dictionary Definition</span>
              <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                {generalDefinition}
              </p>
            </div>
          )}

          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">Context</span>
            <p className="text-xs italic font-serif text-stone-600 mt-0.5 border-l-2 border-stone-300 pl-2 py-0.5">
              "{sentence.text}"
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-2">
          <Button
            variant={isSaved ? 'secondary' : 'primary'}
            size="sm"
            icon={isSaved ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Bookmark className="w-3.5 h-3.5" />}
            onClick={handleSaveToMyWords}
            disabled={isSaving || isSaved}
            className="w-full justify-center"
          >
            {isSaved ? 'Saved to My Words' : isSaving ? 'Saving...' : 'Save to My Words'}
          </Button>
        </div>
      </div>
    </aside>
  );
};
