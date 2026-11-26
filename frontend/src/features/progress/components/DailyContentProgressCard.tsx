import React from 'react';
import { Feather, MessageSquare, Info } from 'lucide-react';
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
        'Completed daily poetry readings and dialogues preserved by version'
      )}
    >
      <div className="space-y-4">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Poetry Completed */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="flex items-center justify-between gap-1.5 mb-1">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Feather className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                {t('progress:poems_completed', 'Poems Studied')}
              </span>
            </div>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 block mt-1">
              {poemsCompletedCount}
            </span>
            <span className="text-[11px] text-stone-600 block mt-1">
              {poemsListenedCount} {t('progress:verses_listened', 'audio playthroughs')}
            </span>
          </div>

          {/* Conversation Completed */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center justify-between gap-1.5 mb-1">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                {t('progress:convos_completed', 'Dialogues Studied')}
              </span>
            </div>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 block mt-1">
              {conversationsCompletedCount}
            </span>
            <span className="text-[11px] text-stone-600 block mt-1">
              {conversationsListenedCount} {t('progress:turns_listened', 'spoken runs')}
            </span>
          </div>

          {/* Today's Poem */}
          <div className="p-4 rounded-xl bg-[#FAF9F6] border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              {t('progress:todays_poem', "Today's Poetry")}
            </span>
            {activePoem ? (
              <div className="mt-1.5 space-y-0.5">
                <span className="text-xs font-bold text-stone-900 line-clamp-1">
                  "{activePoem.title}"
                </span>
                <span className="text-[11px] text-stone-500 block">
                  {activePoem.author} • {activePoem.cefr_level}
                </span>
              </div>
            ) : (
              <span className="text-xs text-stone-400 mt-2 block">
                {t('progress:no_active_poem', 'No poem active for today')}
              </span>
            )}
          </div>

          {/* Today's Dialogue */}
          <div className="p-4 rounded-xl bg-[#FAF9F6] border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              {t('progress:todays_convo', "Today's Conversation")}
            </span>
            {activeConversation ? (
              <div className="mt-1.5 space-y-0.5">
                <span className="text-xs font-bold text-stone-900 line-clamp-1">
                  {activeConversation.title}
                </span>
                <span className="text-[11px] text-stone-500 block">
                  {activeConversation.cefr_level} • {activeConversation.dialogue.length} {t('progress:turns', 'turns')}
                </span>
              </div>
            ) : (
              <span className="text-xs text-stone-400 mt-2 block">
                {t('progress:no_active_convo', 'No conversation active for today')}
              </span>
            )}
          </div>
        </div>

        {/* Recent History */}
        {recentDailyActivities.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              {t('progress:recent_daily_history', 'Recent Daily History')}
            </span>

            <div className="space-y-1.5">
              {recentDailyActivities.map(ev => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-[#FAF9F6] border border-stone-200 flex items-center justify-between text-xs gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {ev.activity_type.includes('poetry') ? (
                      <Feather className="w-4 h-4 text-amber-700 shrink-0" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className="font-semibold text-stone-900 block truncate">
                        {ev.title || ev.content_id}
                      </span>
                      <span className="text-[11px] text-stone-500 capitalize">
                        {ev.activity_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <Badge variant="slate" size="sm">
                    {new Date(ev.timestamp).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible Version Pinning Note */}
        <details className="text-xs text-stone-500 bg-[#FAF9F6] px-3.5 py-2.5 rounded-xl border border-stone-200">
          <summary className="cursor-pointer font-medium text-stone-700 flex items-center gap-1.5 select-none">
            <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>{t('progress:methodology_toggle', 'How this is calculated')}</span>
          </summary>
          <p className="mt-2 text-[11px] text-stone-500 leading-relaxed pl-5">
            {t(
              'progress:version_pinning_note',
              'Completed poetry and dialogue records remain pinned to their historical edition and are preserved across updates.'
            )}
          </p>
        </details>
      </div>
    </Card>
  );
};
