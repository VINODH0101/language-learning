/**
 * Lexilume — Admin Page
 * 
 * Gatekeeper & Orchestrator for Administrative Operations & Workbench.
 * 
 * Security:
 * - Checks authService.getState().role === 'admin'.
 * - Displays unauthorized shield if non-admin.
 * - Enforces database-level RLS through public.is_admin() in Supabase.
 */

import React from 'react';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { authService } from '../services/auth';
import { Button } from '../components/common/Button';
import { AdminWorkbench } from '../features/admin/AdminWorkbench';

interface AdminPageProps {
  onNavigateTab: (tab: any) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigateTab }) => {
  const { t } = useI18n();
  const authState = authService.getState();

  // Unauthorized Access Screen
  if (authState.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">{t('admin_unauthorized_title')}</h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
          {t('admin_unauthorized_desc')}
        </p>
        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => onNavigateTab('dashboard')}
          >
            {t('admin_unauthorized_btn')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <AdminWorkbench initialTab="overview" onNavigateTab={onNavigateTab} />
    </div>
  );
};
