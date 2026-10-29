import React from 'react';
import { MessageSquare, Users, Info } from 'lucide-react';
import { DailyLessonPayload, Language } from '../../types';
import { AudioButton } from '../common/AudioButton';
import { useI18n } from '../../i18n/i18nContext';

interface ConversationSectionProps {
  conversation: DailyLessonPayload['section_5_conversation'];
  language: Language;
  variety: string;
}

export const ConversationSection: React.FC<ConversationSectionProps> = ({
  conversation,
  language,
  variety,
}) => {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Dialogue Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" />
            <span>{t('lesson_conversation_title', 'Interação Dialógica Autêntica')}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1">{conversation.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{conversation.context}</p>
        </div>

        {/* Turns */}
        <div className="space-y-3 pt-2">
          {conversation.dialogue.map((turn, idx) => {
            const isFirstSpeaker = idx % 2 === 0;

            return (
              <div
                key={idx}
                className={`flex gap-3 p-3.5 rounded-xl border transition-all ${
                  isFirstSpeaker
                    ? 'bg-slate-800/80 border-slate-700/80 ml-0 mr-4 sm:mr-12'
                    : 'bg-indigo-950/30 border-indigo-900/50 mr-0 ml-4 sm:ml-12'
                }`}
              >
                <div className="shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isFirstSpeaker ? 'bg-slate-700 text-slate-200' : 'bg-indigo-800 text-indigo-200'
                  }`}>
                    {turn.speaker.charAt(0)}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-indigo-300">{turn.speaker}</span>
                    <AudioButton
                      text={turn.line}
                      language={language}
                      variety={variety}
                    />
                  </div>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">{turn.line}</p>
                  {language === 'en' ? (
                    <div className="space-y-0.5 mt-1.5 text-[11px] text-slate-300 pt-1 border-t border-slate-700/50">
                      {turn.translation_pt && (
                        <p>
                          <span className="font-bold text-indigo-400">PT:</span> {turn.translation_pt}
                        </p>
                      )}
                      {turn.translation_es && (
                        <p>
                          <span className="font-bold text-emerald-400">ES:</span> {turn.translation_es}
                        </p>
                      )}
                    </div>
                  ) : (
                    turn.translation && (
                      <p className="text-[11px] text-slate-400 mt-1 italic">
                        <span className="font-bold text-slate-300 not-italic">EN:</span> {turn.translation}
                      </p>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pragmatic & Sociolinguistic Notes */}
      {conversation.pragmatic_notes && conversation.pragmatic_notes.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-400" />
            {t('lesson_conversation_pragmatic_notes', 'Observações Pragmáticas e Registro')}
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside leading-relaxed">
            {conversation.pragmatic_notes.map((note, idx) => (
              <li key={idx} className="text-slate-300">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
