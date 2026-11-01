import React from 'react';
import { Globe, Compass, BookOpen, Bookmark, ShieldAlert, ArrowRight } from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { useI18n } from '../../../i18n/i18nContext';

interface CulturalDiscoveryCardProps {
  exploredCountriesCount: number;
  totalAvailableCountries: number;
  bookmarkedArticlesCount: number;
  readArticlesCount: number;
  onNavigateExplore?: () => void;
}

export const CulturalDiscoveryCard: React.FC<CulturalDiscoveryCardProps> = ({
  exploredCountriesCount,
  totalAvailableCountries = 250,
  bookmarkedArticlesCount,
  readArticlesCount,
  onNavigateExplore,
}) => {
  const { t } = useI18n();

  return (
    <Card
      title={t('progress:cultural_discovery_title', 'Global & Cultural Discovery Hub')}
      subtitle={t(
        'progress:cultural_discovery_subtitle',
        'Independent global exploration across nations, territories, cultural articles, and real-world contexts'
      )}
    >
      <div className="space-y-4">
        {/* Strict Decoupling Advisory Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-800/40 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-300/90 leading-relaxed">
            <span className="font-bold text-amber-200 block mb-0.5">
              {t('progress:decoupling_advisory_title', 'Core Invariant: Independent Global Exploration')}
            </span>
            {t(
              'progress:decoupling_advisory_desc',
              'Country exploration and cultural knowledge are tracked in this independent hub. Exploring world territories never artificially inflates your target language CEFR level, curriculum completion, or exercise accuracy.'
            )}
          </div>
        </div>

        {/* Discovery Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                {t('progress:countries_explored', 'Nations Explored')}
              </span>
              <Badge variant="emerald" size="sm">Global</Badge>
            </div>
            <span className="text-2xl font-black text-slate-100 block mt-1">
              {exploredCountriesCount}
              <span className="text-xs font-normal text-slate-500 ml-1.5">
                / ~{totalAvailableCountries} {t('progress:global_territories', 'territories')}
              </span>
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              {t('progress:rest_countries_data', 'REST Countries v3.1 authentic registry')}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                {t('progress:articles_read', 'Cultural Articles Read')}
              </span>
              <Badge variant="sky" size="sm">Culture</Badge>
            </div>
            <span className="text-2xl font-black text-slate-100 block mt-1">
              {readArticlesCount}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              {t('progress:in_depth_articles', 'Curated cultural deep dives and literature')}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                {t('progress:saved_bookmarks', 'Saved Bookmarks')}
              </span>
              <Badge variant="indigo" size="sm">Offline</Badge>
            </div>
            <span className="text-2xl font-black text-slate-100 block mt-1">
              {bookmarkedArticlesCount}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              {t('progress:saved_offline_reading', 'Cached offline in browser storage')}
            </p>
          </div>
        </div>

        {onNavigateExplore && (
          <div className="flex justify-end pt-1">
            <Button
              variant="outline"
              size="sm"
              icon={<Compass className="w-4 h-4 text-emerald-400" />}
              onClick={onNavigateExplore}
              className="text-xs font-semibold cursor-pointer border-slate-700 hover:border-emerald-500/50"
            >
              {t('progress:open_country_explorer', 'Open Country Explorer & Culture Hub')}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
