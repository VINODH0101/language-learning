import React from 'react';
import { Feather, MessageSquare, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { DailyPoem, DailyConversation } from '../../../types';
import { Badge } from '../../../components/common/Badge';
import { useI18n } from '../../../i18n/i18nContext';

interface DailyContentPreviewProps {
  dailyPoem: DailyPoem | null;
  dailyConversation: DailyConversation | null;
  onOpenPoem: () => void;
  onOpenConversation: () => void;
}

export const DailyContentPreview: React.FC<DailyContentPreviewProps> = ({
  dailyPoem,
  dailyConversation,
  onOpenPoem,
  onOpenConversation,
}) => {
  const { t } = useI18n();

  if (!dailyPoem && !dailyConversation) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
          {t('dashboard:daily_masterpiece_learning', 'Daily Immersion: Poetry & Dialogue')}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Poetry Card */}
        {dailyPoem && (
          <div
            onClick={onOpenPoem}
            className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-700/40 hover:border-indigo-500/80 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-sm group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  <Feather className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t('dashboard:daily_poetry', 'Daily Poetry')}</span>
                </span>
                <Badge variant="indigo" size="sm">{dailyPoem.cefr_level}</Badge>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-100 group-hover:text-indigo-200 transition">
                  {dailyPoem.title}
                </h4>
                <p className="text-xs text-slate-400">
                  {dailyPoem.author}
                </p>
              </div>

              {/* Excerpt */}
              <div className="font-serif text-xs text-slate-300 italic line-clamp-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                "{dailyPoem.excerpt || dailyPoem.full_text.slice(0, 120)}..."
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                {dailyPoem.learning_language.toUpperCase()} • {dailyPoem.country_name || 'Literature'}
              </span>
              <span className="font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                <span>{t('dashboard:read_poetry_btn', 'Read Poetry')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        )}

        {/* Daily Conversation Card */}
        {dailyConversation && (
          <div
            onClick={onOpenConversation}
            className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-700/40 hover:border-emerald-500/80 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-sm group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('dashboard:daily_conversation', 'Daily Dialogue')}</span>
                </span>
                <Badge variant="emerald" size="sm">{dailyConversation.cefr_level}</Badge>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-100 group-hover:text-emerald-200 transition">
                  {dailyConversation.title}
                </h4>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                  {dailyConversation.country_name && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>{dailyConversation.country_name} • </span>
                    </span>
                  )}
                  <span className="truncate">{dailyConversation.scenario}</span>
                </div>
              </div>

              {/* Dialogue Excerpt */}
              <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                {dailyConversation.dialogue.slice(0, 2).map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="font-bold text-slate-400">{l.speaker}:</span>
                    <span className="truncate italic">"{l.line}"</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                {dailyConversation.dialogue.length} exchanges • {dailyConversation.learning_language.toUpperCase()}
              </span>
              <span className="font-semibold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1">
                <span>{t('dashboard:practice_dialogue_btn', 'Practice Dialogue')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
