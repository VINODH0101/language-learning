/**
 * Lexilume — Admin Audit Log & Quality Control Component
 * Pillar 6 of the Administrative Workbench
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Clock,
  User,
  ChevronRight,
  Code,
} from 'lucide-react';
import { AdminAuditLog } from '../../types';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const unsub = adminService.subscribe(loadLogs);
    return unsub;
  }, []);

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('approve')) return 'emerald';
    if (action.includes('reject')) return 'rose';
    if (action.includes('publish')) return 'indigo';
    if (action.includes('retry')) return 'amber';
    if (action.includes('status')) return 'sky';
    return 'slate';
  };

  const filteredLogs = logs.filter(log => {
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.admin_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.target_user_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(searchQuery.toLowerCase());

    return matchesAction && matchesSearch;
  });

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="space-y-6">
      {/* Audit Log Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FileText className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Trilha de Auditoria & Conformidade
            </span>
            <Badge variant="indigo" size="sm">
              Imutável & Criptografado
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-slate-100">Log de Ações Administrativas</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Histórico detalhado de moderação de conteúdo, alterações de status de contas, publicações diárias e retentativas operacionais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={loadLogs}
            className="cursor-pointer"
          >
            Atualizar Logs
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por ação, administrador ou detalhe..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Filtrar Ação:</span>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todas as Ações ({logs.length})</option>
            {uniqueActions.map(act => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Nenhum registro de auditoria corresponde aos critérios de busca.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredLogs.map(log => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div key={log.id} className="p-4 hover:bg-slate-800/30 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-slate-400">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                            {log.action}
                          </Badge>
                          <span className="text-xs font-semibold text-slate-200">
                            {log.admin_email || log.admin_id}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(log.created_at).toLocaleString()}
                          {log.target_user_id && (
                            <span className="ml-2 text-indigo-400 font-mono">
                              • Alvo: {log.target_user_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes'}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto">
                      <pre>{JSON.stringify(log.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
