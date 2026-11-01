/**
 * Live Truthful Synchronization Status Indicator
 * 
 * Invariants:
 * - Never report a cloud save as successful before the server confirms it.
 * - Distinguishes clearly between:
 *   1. Saved locally (Guest Mode)
 *   2. Waiting to synchronize (Offline or queued pending operations)
 *   3. Synchronizing (In-flight network requests)
 *   4. Synchronized with the cloud (Server confirmed, 0 pending)
 *   5. Synchronization failed (Error with manual retry trigger)
 */

import React, { useEffect, useState } from 'react';
import { Cloud, CloudCheck, CloudOff, RefreshCw, AlertCircle, HardDrive } from 'lucide-react';
import { syncEngine, SyncEngineState } from '../../services/syncEngine';
import { authService, AuthState } from '../../services/auth';
import { useI18n } from '../../i18n/i18nContext';

export const SyncStatusBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useI18n();
  const [syncState, setSyncState] = useState<SyncEngineState>(syncEngine.getState());
  const [authState, setAuthState] = useState<AuthState>(authService.getState());

  useEffect(() => {
    const unsubSync = syncEngine.subscribe(st => setSyncState(st));
    const unsubAuth = authService.subscribe(at => setAuthState(at));
    return () => {
      unsubSync();
      unsubAuth();
    };
  }, []);

  const handleManualRetry = () => {
    syncEngine.syncNow();
  };

  // 1. Guest Mode: Explicitly report saved locally
  if (authState.isGuest) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/70 text-[11px] font-medium text-slate-300 select-none ${className}`}
        title={t('common:saved_locally_desc', 'Modo Visitante: Dados persistidos exclusivamente no navegador (IndexedDB)')}
      >
        <HardDrive className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden sm:inline">{t('common:saved_locally', 'Salvo localmente')}</span>
      </div>
    );
  }

  // 2. Synchronizing (in-flight mutations)
  if (syncState.status === 'syncing') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-700/60 text-[11px] font-semibold text-indigo-300 animate-pulse select-none ${className}`}
        title={t('common:syncing_desc', 'Sincronizando alterações locais com o banco de dados em nuvem')}
      >
        <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
        <span className="hidden sm:inline">{t('common:syncing', 'A sincronizar...')}</span>
      </div>
    );
  }

  // 3. Synchronization Error (failed item or network timeout)
  if (syncState.status === 'error') {
    return (
      <button
        onClick={handleManualRetry}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900/80 border border-rose-700/70 text-[11px] font-semibold text-rose-300 cursor-pointer transition select-none ${className}`}
        title={t('common:sync_error_desc', 'Falha ao sincronizar com o Supabase. Clique para tentar novamente.')}
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span className="hidden sm:inline">
          {t('common:sync_failed', 'Falha na sincronização')}
          {syncState.pendingCount > 0 ? ` (${syncState.pendingCount})` : ''}
        </span>
      </button>
    );
  }

  // 4. Waiting to synchronize (Offline or pending items queue)
  if (syncState.status === 'offline' || syncState.pendingCount > 0) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-700/70 text-[11px] font-semibold text-amber-300 select-none ${className}`}
        title={t('common:sync_pending_desc', 'Modo offline ou alterações aguardando sincronização com a nuvem')}
      >
        <CloudOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="hidden sm:inline">
          {t('common:sync_waiting', 'Aguardando sincronizar')}
          {syncState.pendingCount > 0 ? ` (${syncState.pendingCount})` : ''}
        </span>
      </div>
    );
  }

  // 5. Synchronized with the cloud (Server confirmed, 0 pending actions)
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-[11px] font-medium text-emerald-300 select-none ${className}`}
      title={t('common:synced_desc', 'Todos os dados de aprendizado estão sincronizados com a nuvem (Supabase)')}
    >
      <CloudCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      <span className="hidden md:inline">{t('common:synced', 'Sincronizado')}</span>
    </div>
  );
};
