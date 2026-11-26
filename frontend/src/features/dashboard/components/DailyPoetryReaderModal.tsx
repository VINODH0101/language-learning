import React, { useState, useEffect } from 'react';
import { Feather, Volume2, X, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { DailyPoem } from '../../../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { SpeechService } from '../../../services/speech';
import { activityService } from '../../../services/activityService';
import { useI18n } from '../../../i18n/i18nContext';
import { getLanguageName } from '../../../lib/languages/languageMatrix';
import { toast } from 'sonner';

interface DailyPoetryReaderModalProps {
  poem: DailyPoem;
  isOpen: boolean;
  onClose: () => void;
}

export const DailyPoetryReaderModal: React.FC<DailyPoetryReaderModalProps> = ({
  poem,
  isOpen,
  onClose,
}) => {
  const { t, interfaceLanguage } = useI18n();
  const [showTranslation, setShowTranslation] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isOpen && poem) {
      activityService.recordPoetryInteraction(poem, 'opened');
    }
  }, [isOpen, poem]);

  if (!isOpen) return null;

  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    activityService.recordPoetryInteraction(poem, 'listened');
    SpeechService.speak(
      poem.full_text,
      poem.learning_language
    ).finally(() => setIsPlayingAudio(false));
  };

  const handleMarkComplete = () => {
    setIsCompleted(true);
    activityService.recordPoetryInteraction(poem, 'completed');
    toast.success(t('learning:poem_completed', 'Masterpiece poem study recorded!'));
  };

  const stanzas = poem.full_text.split('\n\n').map(s => s.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FDFBF7] border border-stone-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-200 flex items-start justify-between sticky top-0 bg-[#FDFBF7]/95 backdrop-blur-md z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <Feather className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                {t('dashboard:daily_poetry', 'Daily Masterpiece Poetry')}
              </span>
              <Badge variant="amber" size="sm">{poem.cefr_level}</Badge>
              <Badge variant="slate" size="sm">
                {getLanguageName(poem.learning_language, interfaceLanguage as any)}
              </Badge>
              {poem.country_name && (
                <span className="text-xs text-stone-500">({poem.country_name})</span>
              )}
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">{poem.title}</h2>
            <p className="text-xs text-stone-500">{poem.author}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Action Toolbar */}
          <div className="flex items-center justify-between gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200">
            <Button
              variant="outline"
              size="sm"
              icon={<Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'text-amber-700 animate-pulse' : ''}`} />}
              onClick={handlePlayAudio}
              className="text-xs text-stone-700 border-stone-300 hover:bg-stone-100 min-h-[38px] cursor-pointer"
            >
              {isPlayingAudio ? t('learning:playing', 'Playing Audio...') : t('learning:listen_poem', 'Listen to Verses')}
            </Button>

            {poem.translation && (
              <Button
                variant="ghost"
                size="sm"
                icon={showTranslation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                onClick={() => setShowTranslation(!showTranslation)}
                className="text-xs text-stone-600 hover:text-stone-900 min-h-[38px] cursor-pointer"
              >
                {showTranslation ? t('common:hide_translation', 'Hide Translation') : t('common:show_translation', 'Show Translation')}
              </Button>
            )}
          </div>

          {/* Poem Text Display */}
          <div className="space-y-6 px-2 sm:px-4 py-2">
            {stanzas.map((stanza, idx) => (
              <div key={idx} className="space-y-2">
                <div className="font-serif text-stone-900 text-base sm:text-lg leading-relaxed whitespace-pre-line tracking-wide">
                  {stanza}
                </div>
              </div>
            ))}

            {showTranslation && poem.translation && (
              <div className="text-xs sm:text-sm text-stone-600 italic pl-3 border-l-2 border-amber-500/60 leading-relaxed mt-4">
                <span className="block font-semibold not-italic text-stone-500 text-xs mb-1 uppercase tracking-wider">Translation:</span>
                {poem.translation}
              </div>
            )}
          </div>

          {/* Cultural & Pedagogical Context Note */}
          {poem.cultural_context && (
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>{t('dashboard:cultural_context', 'Cultural & Literary Insight')}</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">
                {poem.cultural_context}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 flex items-center justify-between sticky bottom-0 bg-[#FDFBF7]/95 backdrop-blur-md">
          <Button
            variant={isCompleted ? 'secondary' : 'primary'}
            size="sm"
            icon={<CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-amber-700' : ''}`} />}
            onClick={handleMarkComplete}
            disabled={isCompleted}
            className="min-h-[40px] text-xs cursor-pointer"
          >
            {isCompleted ? t('learning:study_completed', 'Study Completed') : t('learning:mark_study_complete', 'Mark Poem as Studied')}
          </Button>

          <Button variant="outline" size="sm" onClick={onClose} className="min-h-[40px] text-xs cursor-pointer">
            {t('common:close', 'Close Reader')}
          </Button>
        </div>
      </div>
    </div>
  );
};
