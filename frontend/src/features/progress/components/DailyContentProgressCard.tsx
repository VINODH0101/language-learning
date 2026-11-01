import React from 'react';
import { Feather, MessageSquare, CheckCircle2, Volume2, BookOpen, Clock, ShieldCheck } from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Language, DailyPoem, DailyConversation, UnifiedActivityEvent } from '../../../types';
import { useI18n } from '../../../i18n/i18nContext';

interface DailyContentProgressCardProps {
  selectedLanguage: Language;
  activePoem: DailyPoem | null;
  activeConversation: DailyConversation | null;
  poemsCompletedCount: number;
  poemsListenedCount: number;
  conversationsCompletedCount: number;
  conversationsListenedCount: number;
  recentDailyActivities: UnifiedActivityEvent[];
}

export const DailyContentProgressCard: React.FC<DailyContentProgressCardProps> = ({
  selectedLanguage,
  activePoem,
  activeConversation,
  poemsCompletedCount,
  poemsListenedCount,
  conversationsCompletedCount,
  conversationsListenedCount,
  recentDailyActivities,
}) => {
  const { t } = useI18n();

  return (
    <Card
      title={`${t('progress:daily_content_title', 'Daily Literature & Conversation Progress')} (${selectedLanguage.toUpperCase()})`}
      subtitle={t(
        'progress:daily_content_subtitle',
        'Verified completions of administrator-published poetry and communicative dialogues, version-pinned across updates'
      )}
    >
      <div className="space-y-5">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Poetry Completed */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Feather className="w-3.5 h-3.5" />
                {t('progress:poems_completed', 'Poems Studied')}
              </span>
              <Badge variant="indigo" size="sm">Literary</Badge>
            </div>
            <span className="text-2xl font-black text-indigo-400 block mt-1">{poemsCompletedCount}</span>
            <span className="text-[11px] text-slate-400 block mt-1">
              {poemsListenedCount} {t('progress:verses_listened', 'audio playthroughs')}
            </span>
          </div>

          {/* Conversation Completed */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                {t('progress:convos_completed', 'Dialogues Completed')}
              </span>
              <Badge variant="emerald" size="sm">Dialogue</Badge>
            </div>
            <span className="text-2xl font-black text-emerald-400 block mt-1">{conversationsCompletedCount}</span>
            <span className="text-[11px] text-slate-400 block mt-1">
              {conversationsListenedCount} {t('progress:turns_listened', 'spoken dialogue audio runs')}
            </span>
          </div>

          {/* Active Poem Status */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {t('progress:todays_poem', 'Today’s Active Poem')}
            </span>
            {activePoem ? (
              <div className="mt-1.5">
                <span className="text-xs font-bold text-slate-200 line-clamp-1">
                  "{activePoem.title}"
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {activePoem.author} • {activePoem.cefr_level}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 mt-2 block italic">
                {t('progress:no_active_poem', 'None active today')}
              </span>
            )}
          </div>

          {/* Active Conversation Status */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {t('progress:todays_convo', 'Today’s Active Dialogue')}
            </span>
            {activeConversation ? (
              <div className="mt-1.5">
                <span className="text-xs font-bold text-slate-200 line-clamp-1">
                  {activeConversation.title}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {activeConversation.cefr_level} • {activeConversation.dialogue.length} {t('progress:turns', 'turns')}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 mt-2 block italic">
                {t('progress:no_active_convo', 'None active today')}
              </span>
            )}
          </div>
        </div>

        {/* Historical Integrity Guarantee Banner */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {t(
              'progress:version_pinning_note',
              'Content Version Invariant: When an administrator replaces daily poetry or dialogue content, previous completion records remain pinned to their historical version and timestamp. Completed content is never retroactively erased or transferred to replacements.'
            )}
          </p>
        </div>

        {/* Recent Daily Content History List */}
        {recentDailyActivities.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              {t('progress:recent_daily_history', 'Recent Verified Literary & Dialogue Activity')}
            </span>

            <div className="space-y-1.5">
              {recentDailyActivities.map(ev => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-xs gap-3"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {ev.activity_type.includes('poetry') ? (
                      <Feather className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <div className="truncate">
                      <span className="font-semibold text-slate-200 block truncate">
                        {ev.title || ev.content_id}
                      </span>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {ev.activity_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(ev.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
