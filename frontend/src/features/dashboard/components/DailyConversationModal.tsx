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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-400">
                <MessageSquare className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {t('dashboard:daily_conversation', 'Daily Immersive Dialogue')}
              </span>
              <Badge variant="emerald" size="sm">{conversation.cefr_level}</Badge>
              {conversation.country_name && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>{conversation.country_name}</span>
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">{conversation.title}</h2>
            <p className="text-xs text-slate-400">{conversation.scenario}</p>
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
          {/* Controls */}
          <div className="flex items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <Button
              variant="outline"
              size="sm"
              icon={<Volume2 className="w-4 h-4" />}
              onClick={handlePlayAll}
              className="text-xs text-emerald-300 border-emerald-700/60 hover:bg-emerald-950/50 min-h-[38px] cursor-pointer"
            >
              {t('learning:play_all', 'Play Full Dialogue')}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={showTranslations ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              onClick={() => setShowTranslations(!showTranslations)}
              className="text-xs text-slate-300 hover:text-white min-h-[38px] cursor-pointer"
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
                  className={`p-4 rounded-2xl border transition-all ${
                    isEven
                      ? 'bg-slate-950/70 border-slate-800 ml-0 mr-4'
                      : 'bg-indigo-950/20 border-indigo-900/40 ml-4 mr-0'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isEven ? 'bg-indigo-900 text-indigo-200' : 'bg-emerald-900 text-emerald-200'
                        }`}
                      >
                        {line.speaker.slice(0, 1)}
                      </div>
                      <span className="text-xs font-bold text-slate-300">{line.speaker}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePlayLine(line, idx)}
                      className={`p-1.5 rounded-lg transition ${
                        isSpeaking
                          ? 'bg-emerald-600 text-white animate-pulse'
                          : 'bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white'
                      }`}
                      title="Listen"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-sm sm:text-base font-medium text-slate-100 mt-2 pl-9 leading-relaxed">
                    {line.line}
                  </p>

                  {showTranslations && line.translation && (
                    <p className="text-xs text-emerald-300/80 italic mt-1.5 pl-9 leading-relaxed">
                      {line.translation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cultural & Situation Note */}
          {conversation.cultural_context && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{t('dashboard:real_world_context', 'Real-World Interaction Tips')}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {conversation.cultural_context}
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
