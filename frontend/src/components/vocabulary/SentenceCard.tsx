import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { EverydaySentenceEntry } from '../../types/vocabulary';
import { Language } from '../../types';
import { AudioButton } from '../common/AudioButton';

interface SentenceCardProps {
  sentence: EverydaySentenceEntry;
  explanationLanguage: Language;
}

export const SentenceCard: React.FC<SentenceCardProps> = ({
  sentence,
  explanationLanguage,
}) => {
  const [showTranslation, setShowTranslation] = useState(true);
  const translation = sentence.translations[explanationLanguage] || sentence.translations['en'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700/80 transition space-y-3">
      {/* Top Meta Badges & Audio */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-950/70 text-indigo-300 border border-indigo-800/50 uppercase">
            {sentence.target_language}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-950/70 text-amber-300 border border-amber-800/50">
            {sentence.cefr_level}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">
            {sentence.topic.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <AudioButton text={sentence.sentence_target} language={sentence.target_language} />
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="p-1.5 text-slate-400 hover:text-slate-200 cursor-pointer rounded-lg hover:bg-slate-800 transition"
            title={showTranslation ? 'Ocultar Tradução' : 'Exibir Tradução'}
            aria-label={showTranslation ? 'Ocultar Tradução' : 'Exibir Tradução'}
          >
            {showTranslation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Target Sentence */}
      <p className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
        "{sentence.sentence_target}"
      </p>

      {/* Translation */}
      {showTranslation && (
        <p className="text-xs sm:text-sm text-indigo-300/90 italic leading-relaxed pt-1 border-t border-slate-800/60">
          → {translation}
        </p>
      )}

      {/* Context note if present */}
      {sentence.context_notes && (
        <p className="text-[11px] text-slate-400">
          <strong className="text-slate-300">Contexto:</strong> {sentence.context_notes}
        </p>
      )}
    </div>
  );
};
