import React, { useState } from 'react';
import { BookmarkPlus, Volume2, Eye, EyeOff, Sparkles, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { VocabularyEntry } from '../../types/vocabulary';
import { Language } from '../../types';
import { AudioButton } from '../common/AudioButton';
import { savePhrasebookWord } from '../../services/localDb';
import { toast } from 'sonner';

interface VocabularyCardProps {
  entry: VocabularyEntry;
  explanationLanguage: Language;
  userId?: string;
  defaultExpanded?: boolean;
}

export const VocabularyCard: React.FC<VocabularyCardProps> = ({
  entry,
  explanationLanguage,
  userId = 'learner_guest',
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isTranslationVisible, setIsTranslationVisible] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const translation = entry.translations[explanationLanguage] || entry.translations['en'];
  const definition = entry.definitions[explanationLanguage] || entry.definitions['en'];
  const exampleTranslation = entry.example_sentence_translations[explanationLanguage] || entry.example_sentence_translations['en'];

  const handleSave = async () => {
    try {
      await savePhrasebookWord({
        user_id: userId,
        source_text: entry.lemma,
        translated_text: translation,
        source_lang: entry.target_language,
        target_lang: explanationLanguage,
        part_of_speech: entry.part_of_speech,
        phonetic_ipa: entry.phonetic_ipa,
        context_sentence: entry.example_sentence_target,
        is_verified: true,
      });
      setIsSaved(true);
      toast.success(`"${entry.lemma}" adicionado ao seu vocabulário pessoal!`);
    } catch {
      toast.error('Erro ao salvar vocabulário localmente.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700/80 transition flex flex-col justify-between space-y-4">
      {/* Top Header: Lemma, POS, IPA, Badges & Audio */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">
                {entry.lemma}
              </span>

              {entry.phonetic_ipa && (
                <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/50">
                  {entry.phonetic_ipa}
                </span>
              )}

              <AudioButton text={entry.lemma} language={entry.target_language} />
            </div>

            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
              <span className="capitalize font-medium text-slate-300">{entry.part_of_speech}</span>
              <span>•</span>
              <span className="px-1.5 py-0.2 rounded font-bold bg-amber-950/70 text-amber-300 border border-amber-800/60">
                {entry.cefr_level}
              </span>
              {entry.frequency_rank && (
                <>
                  <span>•</span>
                  <span className="text-slate-400">Top #{entry.frequency_rank}</span>
                </>
              )}
            </div>
          </div>

          {/* Action: Save to phrasebook */}
          <button
            onClick={handleSave}
            className={`p-2 rounded-xl border transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
              isSaved
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
            }`}
            title="Salvar no Vocabulário"
            aria-label="Salvar no Vocabulário"
          >
            <BookmarkPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Translation & Reveal Toggle */}
        <div className="pt-1 flex items-center justify-between border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Significado:</span>
            {isTranslationVisible ? (
              <span className="text-sm font-bold text-indigo-300">{translation}</span>
            ) : (
              <span className="text-xs italic text-slate-500 bg-slate-800 px-2 py-0.5 rounded">Oculto</span>
            )}
          </div>

          <button
            onClick={() => setIsTranslationVisible(!isTranslationVisible)}
            className="p-1.5 text-slate-400 hover:text-slate-200 cursor-pointer rounded-lg hover:bg-slate-800 transition"
            title={isTranslationVisible ? 'Ocultar Tradução' : 'Exibir Tradução'}
            aria-label={isTranslationVisible ? 'Ocultar Tradução' : 'Exibir Tradução'}
          >
            {isTranslationVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Definition in Explanation Language */}
        <p className="text-xs text-slate-300 leading-relaxed pt-1">
          {definition}
        </p>

        {/* Example Sentence with Audio */}
        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-1.5 mt-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs sm:text-sm font-medium text-slate-100 italic">
              "{entry.example_sentence_target}"
            </p>
            <AudioButton text={entry.example_sentence_target} language={entry.target_language} />
          </div>
          {isTranslationVisible && (
            <p className="text-xs text-slate-400">
              → {exampleTranslation}
            </p>
          )}
        </div>

        {/* Expandable Grammar & Collocations */}
        {(entry.grammar_notes || (entry.collocations && entry.collocations.length > 0)) && (
          <div className="pt-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer py-1"
            >
              <span>{isExpanded ? 'Menos detalhes' : 'Mais detalhes e colocações'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isExpanded && (
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs animate-fadeIn">
                {entry.grammar_notes && (
                  <p className="text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Nota:</strong> {entry.grammar_notes}
                  </p>
                )}

                {entry.collocations && entry.collocations.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-400 font-semibold text-[11px]">Colocações:</span>
                    {entry.collocations.map(c => (
                      <span key={c} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
