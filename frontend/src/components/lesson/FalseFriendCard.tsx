import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { FalseFriendItem } from '../../types';
import { AudioButton } from '../common/AudioButton';
import { Badge } from '../common/Badge';
import { useI18n } from '../../i18n/i18nContext';

interface FalseFriendCardProps {
  item: FalseFriendItem;
}

export const FalseFriendCard: React.FC<FalseFriendCardProps> = ({ item }) => {
  const { t } = useI18n();

  return (
    <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-800/40 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            {t('lesson_false_friend_badge', 'Alerta de Falso Amigo (PT ↔ ES)')}
          </span>
        </div>
        <Badge variant="amber" size="sm">
          {item.cefr_level}
        </Badge>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Portuguese side */}
        <div className="bg-slate-800/80 p-3 rounded-lg border-l-2 border-emerald-500 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400 text-sm">PT: {item.portuguese_term}</span>
            <AudioButton text={item.pt_example} language="pt" />
          </div>
          <p className="text-slate-300 font-medium">{t('lesson_false_friend_meaning', 'Significado')}: {item.pt_meaning_en}</p>
          <p className="text-slate-400 italic text-[11px]">"{item.pt_example}"</p>
        </div>

        {/* Spanish side */}
        <div className="bg-slate-800/80 p-3 rounded-lg border-l-2 border-amber-500 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 text-sm">ES: {item.spanish_term}</span>
            <AudioButton text={item.es_example} language="es" />
          </div>
          <p className="text-slate-300 font-medium">{t('lesson_false_friend_meaning', 'Significado')}: {item.es_meaning_en}</p>
          <p className="text-slate-400 italic text-[11px]">"{item.es_example}"</p>
        </div>
      </div>

      {/* Interference Warning */}
      <div className="text-xs text-amber-200/90 bg-amber-950/50 p-2.5 rounded-lg border border-amber-800/50 leading-relaxed">
        {item.interference_warning}
      </div>
    </div>
  );
};
