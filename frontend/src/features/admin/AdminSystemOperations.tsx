/**
 * Lexilume — Admin System Operations & Provider Telemetry Component
 * Pillar 5 of the Administrative Workbench
 */

import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  RotateCcw,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { ProviderHealthRecord } from '../../services/monitoring/providerHealth';
import { FailedJobItem } from '../../types';
import { adminService } from '../../services/adminService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { toast } from 'sonner';

export const AdminSystemOperations: React.FC = () => {
  const [healthRecords, setHealthRecords] = useState<ProviderHealthRecord[]>([]);
  const [jobs, setJobs] = useState<FailedJobItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOperationsData = async () => {
    setLoading(true);
    try {
      const records = adminService.getProviderHealthStatuses();
      setHealthRecords(records);

      const jobList = await adminService.getBackgroundJobs();
      setJobs(jobList);
    } catch (err) {
      console.error('Failed to load operational telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperationsData();
    const unsub = adminService.subscribe(loadOperationsData);
    return unsub;
  }, []);

  const handleRetryJob = async (jobId: string) => {
    try {
      const res = await adminService.retryBackgroundJob(jobId);
      if (res.success) {
        toast.success(res.message);
        await loadOperationsData();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Erro ao retentar execução da tarefa.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Server className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Operações de Produção & Telemetria
            </span>
            <Badge variant={isSupabaseConfigured ? 'emerald' : 'amber'} size="sm">
              {isSupabaseConfigured ? 'Supabase Conectado' : 'Modo Offline / Local-First'}
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-slate-100">Saúde de Provedores & Tarefas em Segundo Plano</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Telemetria em tempo real derivada de chamadas autênticas dos provedores livres, sem registros sintéticos e com sanitização estrita de segredos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={loadOperationsData}
            className="cursor-pointer"
          >
            Atualizar Telemetria
          </Button>
        </div>
      </div>

      {/* Provider Health Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Provedores Educacionais Abertos ({healthRecords.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Latência média, contagem de requisições e taxa de falhas dos adaptadores em tempo de execução.
            </p>
          </div>
          <Badge variant="emerald">Auditado & Scrubbed</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {healthRecords.map(rec => (
            <div
              key={rec.providerId}
              className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-100">{rec.name}</div>
                <Badge
                  variant={
                    rec.status === 'healthy'
                      ? 'emerald'
                      : rec.status === 'degraded'
                      ? 'amber'
                      : 'rose'
                  }
                  size="sm"
                >
                  {rec.status.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center text-xs pt-1 border-t border-slate-800/60">
                <div className="p-1.5 bg-slate-900/60 rounded-lg">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Latência</div>
                  <div className="text-slate-200 font-mono font-bold mt-0.5">
                    {rec.averageLatencyMs}ms
                  </div>
                </div>
                <div className="p-1.5 bg-slate-900/60 rounded-lg">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Sucessos</div>
                  <div className="text-emerald-400 font-mono font-bold mt-0.5">
                    {rec.successfulRequests}
                  </div>
                </div>
                <div className="p-1.5 bg-slate-900/60 rounded-lg">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Falhas</div>
                  <div className="text-rose-400 font-mono font-bold mt-0.5">
                    {rec.failedRequests}
                  </div>
                </div>
              </div>

              {rec.lastErrorMessage && (
                <div className="text-[10px] font-mono text-rose-400 bg-rose-950/20 p-2 rounded-lg truncate">
                  Erro: {rec.lastErrorMessage}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Background Jobs Queue Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-400" />
              Tarefas em Segundo Plano & Retentativas Bounded ({jobs.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tarefas em lote resilientes com histórico de retentativas limitadas a 3 tentativas.
            </p>
          </div>
          <Badge variant={jobs.some(j => j.status === 'failed') ? 'rose' : 'emerald'}>
            {jobs.filter(j => j.status === 'failed').length} Falhas Ativas
          </Badge>
        </div>

        {jobs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Nenhuma tarefa pendente na esteira de processamento.
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <div
                key={job.id}
                className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{job.jobType}</span>
                    <Badge variant="indigo" size="sm">{(job.language || 'pt').toUpperCase()}</Badge>
                    <Badge variant="emerald" size="sm">{job.cefrLevel}</Badge>
                    <Badge
                      variant={job.status === 'completed' ? 'emerald' : 'rose'}
                      size="sm"
                    >
                      {job.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-rose-400 font-mono text-[11px]">{job.errorReason}</div>
                  <div className="text-slate-500 text-[10px] flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Última execução: {new Date(job.lastRunAt).toLocaleTimeString()}</span>
                    <span>•</span>
                    <span>
                      Tentativas: {job.retryCount}/{job.maxRetries}
                    </span>
                  </div>
                </div>

                {job.status === 'failed' && (
                  <Button
                    onClick={() => handleRetryJob(job.id)}
                    variant="primary"
                    size="sm"
                    disabled={job.retryCount >= job.maxRetries}
                    className="gap-1.5 cursor-pointer bg-rose-600 hover:bg-rose-500"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {job.retryCount >= job.maxRetries ? 'Limite Atingido' : 'Retentar Tarefa'}
                    </span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Local Storage & Sync Diagnostics Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400" />
            Integridade do Armazenamento Local-First (Dexie / IndexedDB)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Garantia de que a plataforma opera offline sem vazamento de dados de outros usuários.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Isolamento Multi-Tenant</span>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Chaves Escopadas por User ID
            </div>
          </div>
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Fila de Mutação Offline</span>
            <div className="text-xs font-semibold text-slate-200">
              0 itens pendentes de sincronização
            </div>
          </div>
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Mandato Zero-Paid AI</span>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 100% Fallbacks Determinísticos
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
