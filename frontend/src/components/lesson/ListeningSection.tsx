import React, { useState } from 'react';
import { Headphones, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { DailyLessonPayload, Language } from '../../types';
import { AudioButton } from '../common/AudioButton';
import { Button } from '../common/Button';
import { useI18n } from '../../i18n/i18nContext';

interface ListeningSectionProps {
  listening: DailyLessonPayload['section_8_listening'];
  language: Language;
  variety: string;
}

export const ListeningSection: React.FC<ListeningSectionProps> = ({
  listening,
  language,
  variety,
}) => {
  const { t } = useI18n();
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
          <div>
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
              {t('lesson_listening_title', 'Compreensão Auditiva e Entonação C1')}
            </span>
            <h2 className="text-base font-bold text-slate-100 mt-0.5">{listening.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <AudioButton
              text={listening.transcript_target}
              language={language}
              variety={variety}
              audioUrl={listening.audio_source_url}
            />
            <Button
              variant="outline"
              size="sm"
              icon={showTranscript ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              onClick={() => setShowTranscript(!showTranscript)}
            >
              {showTranscript ? t('lesson_listening_hide_transcript', 'Ocultar Transcrição') : t('lesson_listening_show_transcript', 'Revelar Transcrição')}
            </Button>
          </div>
        </div>

        {/* Audio Player Notes */}
        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60 text-xs text-slate-300 flex items-start gap-2">
          <Headphones className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <p>{listening.audio_player_notes}</p>
        </div>

        {/* Comprehension Tasks */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-300">{t('lesson_listening_active_tasks', 'Roteiro de Escuta Ativa:')}</h3>
          <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
            {listening.comprehension_tasks.map((task, idx) => (
              <li key={idx} className="leading-relaxed">{task}</li>
            ))}
          </ul>
        </div>

        {/* Transcript */}
        {showTranscript && (
          <div className="pt-3 border-t border-slate-800 space-y-2 animate-fadeIn">
            <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Transcrição Oficial:
            </span>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 leading-relaxed font-serif whitespace-pre-line">
              {listening.transcript_target}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
