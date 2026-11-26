import React, { useState } from 'react';
import { BookmarkPlus, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { VocabularyEntry } from '../../types/vocabulary';
import { Language } from '../../types';
import { AudioButton } from '../common/AudioButton';
import { Badge } from '../common/Badge';
import { savePhrasebookWord } from '../../services/localDb';
import { StorageService } from '../../services/storage';
import { useI18n } from '../../i18n/i18nContext';
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
  userId = StorageService.getCurrentUser(),
  defaultExpanded = false,
}) => {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isTranslationVisible, setIsTranslationVisible] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const translation = entry.translations[explanationLanguage] || entry.translations['en'] || '';
  const definition = entry.definitions[explanationLanguage] || entry.definitions['en'] || '';
  const exampleTranslation = entry.example_sentence_translations[explanationLanguage] || entry.example_sentence_translations['en'] || '';

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
      toast.success(t('learning:lookup_saved_toast', 'Saved "{{term}}" to your personal vocabulary.', { term: entry.lemma }));
    } catch {
      toast.error(t('learning:lookup_save_error', 'Could not save word'));
    }
  };

  return (
    <article className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs hover:border-stone-300 transition flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-serif text-xl font-bold text-stone-900 tracking-tight">
                {entry.lemma}
              </span>

              {entry.phonetic_ipa && (
                <span className="text-xs font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                  {entry.phonetic_ipa}
                </span>
              )}

              <AudioButton text={entry.lemma} language={entry.target_language} />
            </div>

            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-stone-500 flex-wrap">
              <span className="capitalize font-medium text-stone-700">{entry.part_of_speech}</span>
              <span>•</span>
              <Badge variant="amber" size="sm">
                {entry.cefr_level}
              </Badge>
              {entry.frequency_rank && (
                <>
                  <span>•</span>
                  <span className="font-mono">Top #{entry.frequency_rank}</span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className={`p-2 rounded-xl border transition min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer shrink-0 ${
              isSaved
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-stone-50 text-stone-500 hover:text-stone-900 hover:bg-stone-100 border-stone-200'
            }`}
            title={t('learning:lookup_save_btn', 'Save to My Words')}
            aria-label={t('learning:lookup_save_btn', 'Save to My Words')}
          >
            <BookmarkPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Translation & Reveal Toggle */}
        <div className="pt-2.5 flex items-center justify-between border-t border-stone-100">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-stone-500 shrink-0">
              {t('learning:lookup_translation_heading', 'Translation')}:
            </span>
            {isTranslationVisible ? (
              <span className="text-sm font-bold text-stone-900 truncate">{translation}</span>
            ) : (
              <span className="text-xs italic text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                •••
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsTranslationVisible(!isTranslationVisible)}
            className="p-1.5 text-stone-400 hover:text-stone-800 cursor-pointer rounded-lg hover:bg-stone-100 transition shrink-0"
            title={isTranslationVisible ? t('learning:hide_translation', 'Hide Translation') : t('learning:show_translation', 'Show Translation')}
            aria-label={isTranslationVisible ? t('learning:hide_translation', 'Hide Translation') : t('learning:show_translation', 'Show Translation')}
          >
            {isTranslationVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Definition */}
        <p className="text-xs text-stone-600 leading-relaxed">
          {definition}
        </p>

        {/* Example Sentence */}
        <div className="p-3 bg-[#FAF9F6] rounded-xl border border-stone-200 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-serif text-xs sm:text-sm font-medium text-stone-900 italic leading-snug">
              "{entry.example_sentence_target}"
            </p>
            <AudioButton text={entry.example_sentence_target} language={entry.target_language} />
          </div>
          {isTranslationVisible && exampleTranslation && (
            <p className="text-xs text-stone-500">
              → {exampleTranslation}
            </p>
          )}
        </div>

        {/* Expandable Grammar & Collocations */}
        {(entry.grammar_notes || (entry.collocations && entry.collocations.length > 0)) && (
          <div>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-stone-900 cursor-pointer py-1"
            >
              <span>{isExpanded ? t('common:close', 'Hide details') : t('learning:lookup_context_heading', 'Context & notes')}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isExpanded && (
              <div className="space-y-2 pt-2 border-t border-stone-100 text-xs animate-fadeIn">
                {entry.grammar_notes && (
                  <p className="text-stone-600 leading-relaxed">
                    {entry.grammar_notes}
                  </p>
                )}

                {entry.collocations && entry.collocations.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {entry.collocations.map(c => (
                      <span key={c} className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200 text-[11px] font-mono">
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
    </article>
  );
};
