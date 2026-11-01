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

interface AdminOverviewProps {
  onNavigateTab: (tab: AdminPillarTab) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigateTab }) => {
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Shield className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Painel de Operações & Governança
            </span>
            <Badge variant="indigo" size="sm">
              RLS Server Enforced
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-slate-100">Visão Geral da Plataforma Lexilume</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Telemetria consolidada em tempo real com dados locais (Dexie/IndexedDB) e sincronizados (Supabase), sem inventar métricas ou invocar modelos pagos.
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
            Atualizar Métricas
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                Total de Alunos
              </span>
              <span className="text-2xl font-extrabold text-slate-100 mt-1 block">
                {metrics?.totalUsers ?? '—'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {metrics?.activeUsers ?? 0} ativos no sistema
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                Lições Concluídas
              </span>
              <span className="text-2xl font-extrabold text-sky-400 mt-1 block">
                {metrics?.totalCompletedLessons ?? '—'}
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">
                Registro pedagógico real
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-800/60 flex items-center justify-center text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                Conteúdo Diário Ativo
              </span>
              <span className="text-2xl font-extrabold text-rose-400 mt-1 block">
                {(metrics?.activePoemsCount ?? 0) + (metrics?.activeConversationsCount ?? 0)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {metrics?.activePoemsCount ?? 0} poemas • {metrics?.activeConversationsCount ?? 0} diálogos
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                Saúde de Provedores
              </span>
              <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
                {metrics ? `${metrics.healthyProvidersCount}/${metrics.totalProvidersCount}` : '—'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Provedores abertos operacionais
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Operational Highlights & Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Review Queue Alert Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Fila de Moderação
            </span>
            <Badge variant={metrics?.pendingReviewCount ? 'amber' : 'emerald'} size="sm">
              {metrics?.pendingReviewCount ?? 0} pendentes
            </Badge>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Itens lexicais, excertos de leitura e exercícios aguardando conferência pedagógica de fontes abertas.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('review')}
            className="w-full justify-between cursor-pointer"
          >
            <span>Gerenciar Fila de Revisão</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Daily Content Studio Alert Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Conteúdo Diário
            </span>
            <Badge variant="rose" size="sm">13 Idiomas</Badge>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Publique ou arquive poemas literários e diálogos com substituição segura em todos os idiomas suportados.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('daily_content')}
            className="w-full justify-between cursor-pointer"
          >
            <span>Abrir Estúdio Diário</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Telemetry & Health Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
              <Server className="w-4 h-4" /> Telemetria de Sistema
            </span>
            {metrics?.failedJobsCount && metrics.failedJobsCount > 0 ? (
              <Badge variant="rose" size="sm">{metrics.failedJobsCount} falhas</Badge>
            ) : (
              <Badge variant="emerald" size="sm">Estável</Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Monitoramento de latência dos provedores (Kaikki, Tatoeba, MyMemory) e esteira de retentativas.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('operations')}
            className="w-full justify-between cursor-pointer"
          >
            <span>Ver Saúde & Tarefas</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
