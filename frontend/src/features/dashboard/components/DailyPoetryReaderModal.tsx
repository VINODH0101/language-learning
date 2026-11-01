import React, { useState, useEffect } from 'react';
import { Feather, Volume2, X, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { DailyPoem } from '../../../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { SpeechService } from '../../../services/speech';
import { activityService } from '../../../services/activityService';
import { useI18n } from '../../../i18n/i18nContext';
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
  const { t } = useI18n();
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

  const getLanguageName = (lang: string) => {
    const map: Record<string, string> = {
      pt: 'Portuguese',
      es: 'Spanish',
      en: 'English',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      ja: 'Japanese',
      zh: 'Chinese',
      ta: 'Tamil',
      ru: 'Russian',
      nl: 'Dutch',
      ko: 'Korean',
      tr: 'Turkish',
    };
    return map[lang] || lang.toUpperCase();
  };

  const stanzas = poem.full_text.split('\n\n').map(s => s.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-400">
                <Feather className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                {t('dashboard:daily_poetry', 'Daily Masterpiece Poetry')}
              </span>
              <Badge variant="indigo" size="sm">{poem.cefr_level}</Badge>
              <Badge variant="slate" size="sm">{getLanguageName(poem.learning_language)}</Badge>
              {poem.country_name && (
                <span className="text-xs text-slate-400">({poem.country_name})</span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">{poem.title}</h2>
            <p className="text-xs text-slate-400">{poem.author}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Action Toolbar */}
          <div className="flex items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <Button
              variant="outline"
              size="sm"
              icon={<Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'text-indigo-400 animate-pulse' : ''}`} />}
              onClick={handlePlayAudio}
              className="text-xs text-indigo-300 border-indigo-700/60 hover:bg-indigo-950/50 min-h-[38px] cursor-pointer"
            >
              {isPlayingAudio ? t('learning:playing', 'Playing Audio...') : t('learning:listen_poem', 'Listen to Verses')}
            </Button>

            {poem.translation && (
              <Button
                variant="ghost"
                size="sm"
                icon={showTranslation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                onClick={() => setShowTranslation(!showTranslation)}
                className="text-xs text-slate-300 hover:text-white min-h-[38px] cursor-pointer"
              >
                {showTranslation ? t('common:hide_translation', 'Hide Translation') : t('common:show_translation', 'Show Translation')}
              </Button>
            )}
          </div>

          {/* Poem Text Display */}
          <div className="space-y-6 px-2 sm:px-4 py-2">
            {stanzas.map((stanza, idx) => (
              <div key={idx} className="space-y-2">
                <div className="font-serif text-slate-100 text-base sm:text-lg leading-relaxed whitespace-pre-line tracking-wide">
                  {stanza}
                </div>
              </div>
            ))}

            {showTranslation && poem.translation && (
              <div className="text-xs sm:text-sm text-indigo-300/80 italic pl-3 border-l-2 border-indigo-500/50 leading-relaxed mt-4">
                <span className="block font-semibold not-italic text-slate-400 text-xs mb-1 uppercase tracking-wider">Translation:</span>
                {poem.translation}
              </div>
            )}
          </div>

          {/* Cultural & Pedagogical Context Note */}
          {poem.cultural_context && (
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>{t('dashboard:cultural_context', 'Cultural & Literary Insight')}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {poem.cultural_context}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between sticky bottom-0 bg-slate-900/95 backdrop-blur-md">
          <Button
            variant={isCompleted ? 'secondary' : 'primary'}
            size="sm"
            icon={<CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-emerald-400' : ''}`} />}
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
