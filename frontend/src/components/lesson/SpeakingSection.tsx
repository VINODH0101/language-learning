import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Clock, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { DailyLessonPayload, Language } from '../../types';
import { SpeechService } from '../../services/speech';
import { Button } from '../common/Button';
import { AudioButton } from '../common/AudioButton';
import { Badge } from '../common/Badge';
import { useI18n } from '../../i18n/i18nContext';

interface SpeakingSectionProps {
  speaking: DailyLessonPayload['section_6_speaking'];
  language: Language;
  variety: string;
}

export const SpeakingSection: React.FC<SpeakingSectionProps> = ({
  speaking,
  language,
  variety,
}) => {
  const { t } = useI18n();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechRecognizer, setSpeechRecognizer] = useState<{ stop: () => void } | null>(null);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [hasVoice, setHasVoice] = useState(true);

  useEffect(() => {
    setRecognitionSupported(SpeechService.isRecognitionSupported());
    const voiceCheck = SpeechService.hasVoiceForLanguage(language, variety);
    setHasVoice(voiceCheck);

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        setHasVoice(SpeechService.hasVoiceForLanguage(language, variety));
      };
    }
  }, [language, variety]);

  const toggleRecording = () => {
    if (isRecording) {
      speechRecognizer?.stop();
      setIsRecording(false);
      setSpeechRecognizer(null);
    } else {
      setTranscript('');
      setIsRecording(true);
      const rec = SpeechService.startRecognition(
        language,
        variety,
        (text) => {
          setTranscript(prev => (prev ? `${prev} ${text}` : text));
        },
        (err) => {
          console.warn('Speech recognition error', err);
          setIsRecording(false);
          setSpeechRecognizer(null);
        }
      );
      setSpeechRecognizer(rec);
    }
  };

  return (
    <div className="space-y-6">
      {/* Speaking Prompt Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              {t('lesson_speaking_title', 'Produção Oral Avançada C1')}
            </span>
            <h2 className="text-base font-bold text-slate-100 mt-0.5">{t('lesson_speaking_subtitle', 'Discurso e Argumentação')}</h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            <Clock className="w-3.5 h-3.5" />
            <span>{t('lesson_speaking_target', 'Meta:')} {speaking.target_duration_minutes} {t('lesson_speaking_minutes', 'minutos')}</span>
          </div>
        </div>

        {/* Prompt */}
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
          <p className="text-sm font-semibold text-slate-100 leading-relaxed">{speaking.prompt}</p>
        </div>

        {/* Guiding Questions */}
        {speaking.guiding_questions && speaking.guiding_questions.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-300">{t('lesson_speaking_guiding_questions', 'Questões Norteadoras para Estruturação:')}</h3>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
              {speaking.guiding_questions.map((q, idx) => (
                <li key={idx} className="leading-relaxed">{q}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested C1 Expressions */}
        {speaking.suggested_phrases && speaking.suggested_phrases.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {t('lesson_speaking_recommended_phrases', 'Expressões e Conectores C1 Recomendados:')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {speaking.suggested_phrases.map((phrase, idx) => {
                const tr = speaking.suggested_phrases_translations?.[phrase];
                return (
                  <div
                    key={idx}
                    className="flex flex-col justify-between p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs text-slate-200 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-100">{phrase}</span>
                      <AudioButton text={phrase} language={language} variety={variety} />
                    </div>
                    {tr && (
                      <div className="mt-2 pt-1.5 border-t border-slate-700/50 text-[11px] text-slate-400 space-y-0.5">
                        {language === 'en' ? (
                          <>
                            {tr.pt && (
                              <p>
                                <span className="font-bold text-indigo-400">PT:</span> {tr.pt}
                              </p>
                            )}
                            {tr.es && (
                              <p>
                                <span className="font-bold text-emerald-400">ES:</span> {tr.es}
                              </p>
                            )}
                          </>
                        ) : (
                          tr.en && (
                            <p>
                              <span className="font-bold text-slate-300">EN:</span> {tr.en}
                            </p>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pronunciation Guide */}
        {speaking.model_pronunciation_guide && (
          <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-900/50 text-xs text-indigo-300 flex items-start gap-2">
            <Volume2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">{t('lesson_speaking_phonetic_guide', 'Guia Fonético e Prosódico:')}</span>
              <p className="text-slate-300">{speaking.model_pronunciation_guide}</p>
            </div>
          </div>
        )}

        {/* TTS Voice Availability Status */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>
            {hasVoice ? t('lesson_speaking_tts_installed', 'Síntese de voz nativa: Voz instalada detectada no navegador.') : t('lesson_speaking_tts_fallback', 'Síntese de voz nativa: Utilizando sintetizador padrão do sistema.')}
          </span>
        </div>
      </div>

      {/* Interactive Speech Recording Studio */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">{t('lesson_speaking_studio_title', 'Estúdio de Prática Oral Interativa')}</h3>
            <p className="text-xs text-slate-400">
              {t('lesson_speaking_studio_desc', 'Grave sua fala pelo microfone do navegador para verificar clareza e fluência.')}
            </p>
          </div>
          {recognitionSupported ? (
            <Button
              variant={isRecording ? 'danger' : 'primary'}
              size="md"
              icon={isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              onClick={toggleRecording}
            >
              {isRecording ? t('lesson_speaking_btn_stop', 'Parar Gravação') : t('lesson_speaking_btn_record', 'Gravar Prática Oral')}
            </Button>
          ) : (
            <div className="text-xs text-amber-400 bg-amber-950/40 border border-amber-800/60 p-2 rounded-lg flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{t('lesson_speaking_rec_unsupported', 'Reconhecimento de fala indisponível neste navegador (Chrome/Edge recomendado).')}</span>
            </div>
          )}
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 p-3 bg-rose-950/30 border border-rose-800/60 rounded-lg text-rose-300 text-xs animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            {t('lesson_speaking_recording', 'Gravando áudio... Fale naturalmente.')}
          </div>
        )}

        {transcript && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {t('lesson_speaking_transcript_title', 'Transcrição Capturada:')}
            </span>
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono">
              {transcript}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
