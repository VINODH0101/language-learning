import React, { useState, useEffect } from 'react';
import { MessageSquare, Volume2, X, Eye, EyeOff, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import { DailyConversation, DialogueLine } from '../../../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { SpeechService } from '../../../services/speech';
import { activityService } from '../../../services/activityService';
import { useI18n } from '../../../i18n/i18nContext';
import { toast } from 'sonner';

interface DailyConversationModalProps {
  conversation: DailyConversation;
  isOpen: boolean;
  onClose: () => void;
}

export const DailyConversationModal: React.FC<DailyConversationModalProps> = ({
  conversation,
  isOpen,
  onClose,
}) => {
  const { t } = useI18n();
  const [showTranslations, setShowTranslations] = useState(false);
  const [activeSpeakingIdx, setActiveSpeakingIdx] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isOpen && conversation) {
      activityService.recordConversationInteraction(conversation, 'started');
    }
  }, [isOpen, conversation]);

  if (!isOpen) return null;

  const handlePlayLine = (line: DialogueLine, idx: number) => {
    setActiveSpeakingIdx(idx);
    activityService.recordConversationInteraction(conversation, 'listened');
    SpeechService.speak(
      line.line,
      conversation.learning_language
    ).finally(() => setActiveSpeakingIdx(null));
  };

  const handlePlayAll = () => {
    activityService.recordConversationInteraction(conversation, 'listened');
    const fullScript = conversation.dialogue.map(l => `${l.speaker}: ${l.line}`).join('. ');
    SpeechService.speak(fullScript, conversation.learning_language);
  };

  const handleMarkComplete = () => {
    setIsCompleted(true);
    activityService.recordConversationInteraction(conversation, 'completed');
    toast.success(t('learning:convo_completed', 'Daily conversation practice recorded!'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FDFBF7] border border-stone-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-200 flex items-start justify-between sticky top-0 bg-[#FDFBF7]/95 backdrop-blur-md z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <MessageSquare className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                {t('dashboard:daily_conversation', 'Daily Immersive Dialogue')}
              </span>
              <Badge variant="amber" size="sm">{conversation.cefr_level}</Badge>
              {conversation.country_name && (
                <span className="flex items-center gap-1 text-[11px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                  <MapPin className="w-3 h-3 text-amber-700" />
                  <span>{conversation.country_name}</span>
                </span>
              )}
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">{conversation.title}</h2>
            <p className="text-xs text-stone-500">{conversation.scenario}</p>
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
          {/* Controls */}
          <div className="flex items-center justify-between gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200">
            <Button
              variant="outline"
              size="sm"
              icon={<Volume2 className="w-4 h-4 text-amber-700" />}
              onClick={handlePlayAll}
              className="text-xs text-stone-700 border-stone-300 hover:bg-stone-100 min-h-[38px] cursor-pointer"
            >
              {t('learning:play_all', 'Play Full Dialogue')}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={showTranslations ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              onClick={() => setShowTranslations(!showTranslations)}
              className="text-xs text-stone-600 hover:text-stone-900 min-h-[38px] cursor-pointer"
            >
              {showTranslations ? t('common:hide_translation', 'Hide Translation') : t('common:show_translation', 'Show Translation')}
            </Button>
          </div>

          {/* Dialogue Lines */}
          <div className="space-y-4">
            {conversation.dialogue.map((line, idx) => {
              const isEven = idx % 2 === 0;
              const isSpeaking = activeSpeakingIdx === idx;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isEven
                      ? 'bg-white border-stone-200 ml-0 mr-4'
                      : 'bg-amber-50/60 border-amber-200/80 ml-4 mr-0'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isEven ? 'bg-stone-900 text-white' : 'bg-amber-600 text-white'
                        }`}
                      >
                        {line.speaker.slice(0, 1)}
                      </div>
                      <span className="text-xs font-bold text-stone-700">{line.speaker}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePlayLine(line, idx)}
                      className={`p-1.5 rounded-lg transition ${
                        isSpeaking
                          ? 'bg-amber-600 text-white animate-pulse'
                          : 'bg-stone-100 hover:bg-stone-900 text-stone-600 hover:text-white'
                      }`}
                      title="Listen"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-sm sm:text-base font-medium text-stone-900 mt-2 pl-9 leading-relaxed">
                    {line.line}
                  </p>

                  {showTranslations && line.translation && (
                    <p className="text-xs text-stone-600 italic mt-1.5 pl-9 leading-relaxed">
                      {line.translation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cultural & Situation Note */}
          {conversation.cultural_context && (
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>{t('dashboard:real_world_context', 'Real-World Interaction Tips')}</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">
                {conversation.cultural_context}
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
            {isCompleted ? t('learning:study_completed', 'Study Completed') : t('learning:mark_convo_complete', 'Complete Dialogue Session')}
          </Button>

          <Button variant="outline" size="sm" onClick={onClose} className="min-h-[40px] text-xs cursor-pointer">
            {t('common:close', 'Close Dialogue')}
          </Button>
        </div>
      </div>
    </div>
  );
};
