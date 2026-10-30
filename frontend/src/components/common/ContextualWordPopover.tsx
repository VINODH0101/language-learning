import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  BookmarkPlus,
  Check,
  X,
  BookOpen,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { DictionaryService } from '../../services/dictionaryService';
import { TranslationManager } from '../../services/providers/translation/translationManager';
import { SpeechService } from '../../services/speech';
import { savePhrasebookWord, getPhrasebookWords } from '../../services/localDb';
import { authService } from '../../services/auth';
import { Language, RegionalVariety } from '../../types';
import { toast } from 'sonner';

export interface ContextualWordPopoverProps {
  selectedWord: string;
  language: Language | string;
  variety?: RegionalVariety | string;
  explanationLanguage?: string;
  contextSentence?: string;
  position?: { top: number; left: number };
  onClose: () => void;
  onSaved?: (word: string) => void;
}

export const ContextualWordPopover: React.FC<ContextualWordPopoverProps> = ({
  selectedWord,
  language,
  variety = 'all',
  explanationLanguage = 'en',
  contextSentence,
  position,
  onClose,
  onSaved,
}) => {
  const [loading, setLoading] = useState(true);
  const [definition, setDefinition] = useState<string>('');
  const [translation, setTranslation] = useState<string>('');
  const [partOfSpeech, setPartOfSpeech] = useState<string>('');
  const [phonetic, setPhonetic] = useState<string>('');
  const [examples, setExamples] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const cleanWord = (selectedWord || '').trim().replace(/[.,!?;:"'()]/g, '');

  useEffect(() => {
    let isCancelled = false;

    const fetchDetails = async () => {
      if (!cleanWord) return;
      setLoading(true);
      try {
        // 1. Check if already saved in phrasebook / localDb
        try {
          const words = await getPhrasebookWords();
          if (words.some(w => w.source_text.toLowerCase() === cleanWord.toLowerCase()) && !isCancelled) {
            setIsSaved(true);
          }
        } catch {
          // Graceful fallback
        }

        // 2. Fetch definition from DictionaryService
        try {
          const dictEntry = await DictionaryService.lookup(cleanWord, language);
          if (!isCancelled && dictEntry) {
            setPhonetic(dictEntry.phonetic || '');
            if (dictEntry.meanings && dictEntry.meanings.length > 0) {
              const firstMeaning = dictEntry.meanings[0];
              setPartOfSpeech(firstMeaning.partOfSpeech || '');
              if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
                setDefinition(firstMeaning.definitions[0]);
              }
              if (firstMeaning.examples && firstMeaning.examples.length > 0) {
                setExamples(firstMeaning.examples.slice(0, 2));
              }
            }
          }
        } catch {
          // Dictionary lookup fallback
        }

        // 3. Fetch translation to explanation language
        try {
          const translationMgr = TranslationManager.getInstance();
          const trRes = await translationMgr.translate(
            cleanWord,
            language,
            explanationLanguage || 'en'
          );
          if (!isCancelled && trRes?.translatedText) {
            setTranslation(trRes.translatedText);
          }
        } catch {
          // Translation fallback
        }
      } catch (err) {
        // Error handling
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchDetails();

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      isCancelled = true;
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [cleanWord, language, explanationLanguage]);

  const handleSpeak = async () => {
    if (!cleanWord || isPlayingAudio) return;
    setIsPlayingAudio(true);
    try {
      await SpeechService.speak(cleanWord, language, variety);
    } catch {
      // Speech fallback
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleSaveToVocabulary = async () => {
    if (isSaved) return;
    try {
      const userId = authService.getState().user?.id || 'guest';
      await savePhrasebookWord({
        user_id: userId,
        source_text: cleanWord,
        translated_text: translation || definition || cleanWord,
        source_lang: language,
        target_lang: explanationLanguage || 'en',
        part_of_speech: partOfSpeech || undefined,
        phonetic_ipa: phonetic || undefined,
        context_sentence: contextSentence || (examples.length > 0 ? examples[0] : undefined),
        is_verified: true,
      });

      setIsSaved(true);
      toast.success(`"${cleanWord}" salvo no seu vocabulário!`);
      if (onSaved) onSaved(cleanWord);
    } catch (err) {
      toast.error('Não foi possível salvar o vocabulário localmente.');
    }
  };

  // Calculate coordinates or fallback to centered/bottom sheet
  const style: React.CSSProperties = position
    ? {
        position: 'fixed',
        top: Math.min(position.top, window.innerHeight - 280),
        left: Math.max(16, Math.min(position.left, window.innerWidth - 340)),
        zIndex: 60,
      }
    : {};

  return (
    <div
      ref={popoverRef}
      style={position ? style : undefined}
      className={`${
        position
          ? 'w-80 shadow-2xl animate-fadeIn'
          : 'fixed bottom-4 inset-x-4 max-w-sm mx-auto z-50 shadow-2xl'
      } bg-slate-900 border border-slate-700/90 rounded-2xl p-4 text-slate-100 backdrop-blur-xl`}
      role="dialog"
      aria-label={`Detalhes lexicais para ${cleanWord}`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-base text-white tracking-wide">{cleanWord}</span>
          {partOfSpeech && (
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800">
              {partOfSpeech}
            </span>
          )}
          {phonetic && (
            <span className="text-xs text-slate-400 font-mono">/{phonetic}/</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSpeak}
            disabled={isPlayingAudio}
            className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition cursor-pointer"
            title="Ouvir Pronúncia"
            aria-label="Ouvir Pronúncia"
          >
            <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'text-indigo-400 animate-pulse' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            aria-label="Fechar painel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body: Translation & Definition */}
      <div className="space-y-2 text-xs">
        {loading ? (
          <div className="flex items-center justify-center py-4 gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Consultando dicionário...</span>
          </div>
        ) : (
          <>
            {translation && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Tradução ({explanationLanguage.toUpperCase()})
                </span>
                <p className="font-semibold text-slate-100 text-sm">{translation}</p>
              </div>
            )}

            {definition && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Definição
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px] line-clamp-3">
                  {definition}
                </p>
              </div>
            )}

            {examples.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Exemplo de Uso
                </span>
                <p className="text-slate-400 italic text-[11px] bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                  "{examples[0]}"
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={handleSaveToVocabulary}
          disabled={isSaved}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            isSaved
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80 cursor-default'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
          }`}
          aria-label={isSaved ? 'Vocabulário Salvo' : 'Salvar no Vocabulário'}
        >
          {isSaved ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Salvo</span>
            </>
          ) : (
            <>
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Salvar no Vocabulário</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

/**
 * Contextual Selection Wrapper Container
 * Wraps any learning content and displays popover on text selection.
 */
export const ContextualLookupWrapper: React.FC<{
  children: React.ReactNode;
  language: Language | string;
  variety?: RegionalVariety | string;
  explanationLanguage?: string;
}> = ({ children, language, variety = 'all', explanationLanguage = 'en' }) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    // Validate selection is a single word or compact idiom (2 to 40 chars)
    if (text.length >= 2 && text.length <= 40 && !text.includes('\n')) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedWord(text);
      setPopoverPos({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
      className="relative"
    >
      {children}
      {selectedWord && (
        <ContextualWordPopover
          selectedWord={selectedWord}
          language={language}
          variety={variety}
          explanationLanguage={explanationLanguage}
          position={popoverPos}
          onClose={() => {
            setSelectedWord(null);
            setPopoverPos(undefined);
          }}
        />
      )}
    </div>
  );
};
