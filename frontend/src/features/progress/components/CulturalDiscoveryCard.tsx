import React from 'react';
import { Globe, Compass, BookOpen, Bookmark, Info } from 'lucide-react';
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
      title={t('progress:cultural_discovery_title', 'World Discovery & Geography')}
      subtitle={t(
        'progress:cultural_discovery_subtitle',
        'Explore countries and cultural articles independently from your CEFR grade'
      )}
      action={
        onNavigateExplore ? (
          <Button
            variant="outline"
            size="sm"
            icon={<Compass className="w-4 h-4 text-emerald-700" />}
            onClick={onNavigateExplore}
            className="text-xs font-semibold cursor-pointer"
          >
            {t('progress:open_country_explorer', 'Open Country Explorer')}
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-[#FAF9F6] border border-stone-200">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-700" />
                {t('progress:countries_explored', 'Countries Explored')}
              </span>
              <Badge variant="emerald" size="sm">Global</Badge>
            </div>
            <span className="font-serif text-2xl font-bold text-stone-900 block mt-1">
              {exploredCountriesCount}
              <span className="text-xs font-sans font-normal text-stone-500 ml-1">
                / ~{totalAvailableCountries}
              </span>
            </span>
            <p className="text-[11px] text-stone-500 mt-1">
              {t('progress:rest_countries_data', 'REST Countries & Open-Meteo Data')}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF9F6] border border-stone-200">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-sky-700" />
                {t('progress:articles_read', 'Cultural Notes Read')}
              </span>
              <Badge variant="sky" size="sm">Culture</Badge>
            </div>
            <span className="font-serif text-2xl font-bold text-stone-900 block mt-1">
              {readArticlesCount}
            </span>
            <p className="text-[11px] text-stone-500 mt-1">
              {t('progress:in_depth_articles', 'Curated cultural deep dives')}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF9F6] border border-stone-200">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-700" />
                {t('progress:saved_bookmarks', 'Saved Places')}
              </span>
              <Badge variant="amber" size="sm">Offline</Badge>
            </div>
            <span className="font-serif text-2xl font-bold text-stone-900 block mt-1">
              {bookmarkedArticlesCount}
            </span>
            <p className="text-[11px] text-stone-500 mt-1">
              {t('progress:saved_offline_reading', 'Saved in browser storage')}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-stone-500 flex items-start gap-1.5 px-1">
          <Info className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
          <span>
            {t(
              'progress:decoupling_advisory_desc',
              'Country exploration stays independent of your CEFR grade and exercise accuracy.'
            )}
          </span>
        </p>
      </div>
    </Card>
  );
};
