import React, { useState } from 'react';
import {
  Volume2,
  Bookmark,
  Check,
  X,
  BookOpen,
  Sparkles,
  Info,
  Layers,
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
        state: 'learning',
      });

      setIsSaved(true);
      toast.success(`Saved "${term}" to your vocabulary deck!`);
      if (onSavedWord) onSavedWord();
    } catch (err: any) {
      toast.error(err.message || 'Error saving vocabulary item');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header: Term, POS, Audio, Close */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
                {term}
              </h2>
              <button
                onClick={handlePlayAudio}
                disabled={isPlayingAudio}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 transition-colors"
                title="Listen to pronunciation"
                aria-label="Listen to pronunciation"
              >
                <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="indigo">{pos.toUpperCase()}</Badge>
              <Badge variant="slate">{cefr}</Badge>
              {annotation?.ipa && (
                <span className="text-xs font-mono text-slate-400">
                  {annotation.ipa}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Contextual Meaning in this Sentence (Primary) */}
        <div className="p-4 bg-indigo-950/30 border border-indigo-800/50 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Contextual Meaning in this Sentence
          </div>
          <p className="text-sm font-medium text-slate-100 leading-snug">
            {contextualMeaning}
          </p>
          <div className="pt-1.5 border-t border-indigo-900/40 flex items-center gap-2 text-xs text-indigo-200">
            <span className="text-indigo-400 font-semibold uppercase tracking-wider text-[10px]">
              {explanationLanguage.toUpperCase()}:
            </span>
            <span className="font-medium">{contextTranslation}</span>
          </div>
        </div>

        {/* 2. Context Sentence */}
        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Sentence in Passage
          </span>
          <p className="text-xs text-slate-300 italic leading-relaxed">
            "{sentence.text}"
          </p>
        </div>

        {/* 3. General Dictionary Definition (Decoupled & Separated) */}
        <div className="space-y-1 text-xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            General Dictionary Definition
          </span>
          <p className="text-slate-400 leading-relaxed text-xs">
            {generalDefinition}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Back to Reading
          </Button>

          <Button
            variant={isSaved ? 'outline' : 'primary'}
            size="md"
            disabled={isSaving || isSaved}
            icon={isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Bookmark className="w-4 h-4" />}
            onClick={handleSaveToMyWords}
          >
            {isSaved ? 'Saved to My Words' : isSaving ? 'Saving...' : 'Save to My Words'}
          </Button>
        </div>
      </div>
    </div>
  );
};
