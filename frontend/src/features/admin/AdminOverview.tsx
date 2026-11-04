/**
 * Lexilume — Admin Overview & Operational Health Component
 * Pillar 1 of the Administrative Workbench
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  BookOpen,
  Activity,
  Layers,
  Shield,
  RefreshCw,
  Sparkles,
  Server,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { AdminOverviewMetrics, AdminPillarTab } from '../../types';
import { adminService } from '../../services/adminService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useI18n } from '../../i18n/i18nContext';

interface AdminOverviewProps {
  onNavigateTab: (tab: AdminPillarTab) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigateTab }) => {
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<AdminOverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPlatformOverviewMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load admin metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const unsub = adminService.subscribe(loadMetrics);
    return unsub;
  }, []);

  return (
    <div className="space-y-6">
      {/* Overview Top Header Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-amber-500/10 border border-amber-400/20 text-amber-700">
              <Shield className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              {t('admin:overview_kicker', 'Operations & Governance Panel')}
            </span>
            <Badge variant="indigo" size="sm">
              RLS Server Enforced
            </Badge>
          </div>
          <h2 className="font-serif text-xl font-bold text-stone-900">
            {t('admin:overview_title', 'Lexilume Platform Overview')}
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            {t(
              'admin:overview_desc',
              'Real-time consolidated telemetry from local (Dexie/IndexedDB) and synchronized (Supabase) data, without inventing metrics or invoking paid models.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={loadMetrics}
            className="cursor-pointer"
          >
            {t('admin:overview_refresh', 'Refresh Metrics')}
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-stone-500 uppercase font-semibold block">
                {t('admin:kpi_total_users', 'Total Learners')}
              </span>
              <span className="text-2xl font-extrabold text-stone-900 mt-1 block">
                {metrics?.totalUsers ?? '—'}
              </span>
              <span className="text-[10px] text-stone-500 block mt-0.5">
                {t('admin:kpi_active_users', '{{count}} active in the system', {
                  count: metrics?.activeUsers ?? 0,
                })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-center text-amber-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-stone-500 uppercase font-semibold block">
                {t('admin:kpi_lessons', 'Lessons Completed')}
              </span>
              <span className="text-2xl font-extrabold text-sky-700 mt-1 block">
                {metrics?.totalCompletedLessons ?? '—'}
              </span>
              <span className="text-[10px] text-emerald-700 block mt-0.5">
                {t('admin:kpi_lessons_helper', 'Real pedagogical record')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50/60 border border-sky-200/60 flex items-center justify-center text-sky-700">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-stone-500 uppercase font-semibold block">
                {t('admin:kpi_daily_content', 'Active Daily Content')}
              </span>
              <span className="text-2xl font-extrabold text-rose-700 mt-1 block">
                {(metrics?.activePoemsCount ?? 0) + (metrics?.activeConversationsCount ?? 0)}
              </span>
              <span className="text-[10px] text-stone-500 block mt-0.5">
                {t('admin:kpi_daily_content_helper', '{{poems}} poems • {{dialogues}} dialogues', {
                  poems: metrics?.activePoemsCount ?? 0,
                  dialogues: metrics?.activeConversationsCount ?? 0,
                })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50/60 border border-rose-200/60 flex items-center justify-center text-rose-700">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-stone-500 uppercase font-semibold block">
                {t('admin:kpi_provider_health', 'Provider Health')}
              </span>
              <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
                {metrics ? `${metrics.healthyProvidersCount}/${metrics.totalProvidersCount}` : '—'}
              </span>
              <span className="text-[10px] text-stone-500 block mt-0.5">
                {t('admin:kpi_provider_health_helper', 'Open providers operational')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Operational Highlights & Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Review Queue Alert Box */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> {t('admin:overview_review_title', 'Review Queue')}
            </span>
            <Badge variant={metrics?.pendingReviewCount ? 'amber' : 'emerald'} size="sm">
              {t('admin:overview_pending', '{{count}} pending', {
                count: metrics?.pendingReviewCount ?? 0,
              })}
            </Badge>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            {t(
              'admin:overview_review_desc',
              'Lexical items, reading excerpts, and exercises awaiting pedagogical review from open sources.'
            )}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('review')}
            className="w-full justify-between cursor-pointer"
          >
            <span>{t('admin:overview_manage_review', 'Manage Review Queue')}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Daily Content Studio Alert Box */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> {t('admin:overview_daily_title', 'Daily Content')}
            </span>
            <Badge variant="rose" size="sm">
              {t('admin:overview_languages_badge', '3 Languages')}
            </Badge>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            {t(
              'admin:overview_daily_desc',
              'Publish or archive literary poems and dialogues with safe replacement across all supported languages.'
            )}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('daily_content')}
            className="w-full justify-between cursor-pointer"
          >
            <span>{t('admin:overview_open_studio', 'Open Daily Studio')}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Telemetry & Health Box */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-1.5">
              <Server className="w-4 h-4" /> {t('admin:overview_telemetry_title', 'System Telemetry')}
            </span>
            {metrics?.failedJobsCount && metrics.failedJobsCount > 0 ? (
              <Badge variant="rose" size="sm">
                {t('admin:overview_failures', '{{count}} failures', {
                  count: metrics.failedJobsCount,
                })}
              </Badge>
            ) : (
              <Badge variant="emerald" size="sm">
                {t('admin:overview_stable', 'Stable')}
              </Badge>
            )}
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            {t(
              'admin:overview_telemetry_desc',
              'Provider latency monitoring (Kaikki, Tatoeba, MyMemory) and the retry pipeline.'
            )}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('operations')}
            className="w-full justify-between cursor-pointer"
          >
            <span>{t('admin:overview_view_health', 'View Health & Jobs')}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
