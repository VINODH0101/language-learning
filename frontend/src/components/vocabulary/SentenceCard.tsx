import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { EverydaySentenceEntry } from '../../types/vocabulary';
import { Language } from '../../types';
import { AudioButton } from '../common/AudioButton';
import { Badge } from '../common/Badge';
import { useI18n } from '../../i18n/i18nContext';

interface SentenceCardProps {
  sentence: EverydaySentenceEntry;
  explanationLanguage: Language;
}

export const SentenceCard: React.FC<SentenceCardProps> = ({
  sentence,
  explanationLanguage,
}) => {
  const { t } = useI18n();
  const [showTranslation, setShowTranslation] = useState(true);
  const translation = sentence.translations[explanationLanguage] || sentence.translations['en'];

  return (
    <article className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs hover:border-stone-300 transition space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="slate" size="sm">
            {sentence.target_language.toUpperCase()}
          </Badge>
          <Badge variant="amber" size="sm">
            {sentence.cefr_level}
          </Badge>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200 capitalize">
            {sentence.topic.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <AudioButton text={sentence.sentence_target} language={sentence.target_language} />
          <button
            type="button"
            onClick={() => setShowTranslation(!showTranslation)}
            className="p-1.5 text-stone-400 hover:text-stone-800 cursor-pointer rounded-lg hover:bg-stone-100 transition"
            title={showTranslation ? t('learning:hide_translation', 'Hide Translation') : t('learning:show_translation', 'Show Translation')}
            aria-label={showTranslation ? t('learning:hide_translation', 'Hide Translation') : t('learning:show_translation', 'Show Translation')}
          >
            {showTranslation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <p className="font-serif text-base font-semibold text-stone-900 leading-snug">
        "{sentence.sentence_target}"
      </p>

      {showTranslation && translation && (
        <p className="text-xs sm:text-sm text-stone-600 italic leading-relaxed pt-2 border-t border-stone-100">
          → {translation}
        </p>
      )}

      {sentence.context_notes && (
        <p className="text-xs text-stone-500">
          <strong className="text-stone-700">{t('learning:lookup_context_heading', 'Context')}:</strong> {sentence.context_notes}
        </p>
      )}
    </article>
  );
};
