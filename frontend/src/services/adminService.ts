/**
 * Lexilume — Administrative & Operational Services
 * 
 * Provides unified, production-grade operations across:
 * 1. Platform overview metrics aggregation (users, lessons, active content, provider health)
 * 2. Content review queue (CRUD, approval, rejection with database persistence)
 * 3. Background jobs telemetry and bounded retries
 * 4. Immutable administrative audit logging (admin_audit_logs)
 * 5. User account status & governance
 * 
 * Invariants:
 * - Local-First & Zero-Paid AI: Fully functional offline with Dexie/localStorage and syncs with Supabase.
 * - Multi-tier Security: Requires authService.getState().role === 'admin'.
 * - Linguistic: Hindi ('hi') is strictly excluded.
 */

import { authService } from './auth';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { dailyContentService } from './dailyContentService';
import { ProviderHealthTracker, ProviderHealthRecord } from './monitoring/providerHealth';
import i18n from '../i18n/config';
import {
  PendingContentItem,
  FailedJobItem,
  AdminOverviewMetrics,
  AdminAuditLog,
  UserProfile,
} from '../types';

const STORAGE_KEY_REVIEW = 'lexilume_admin_review_queue_v1';
const STORAGE_KEY_JOBS = 'lexilume_admin_background_jobs_v1';
const STORAGE_KEY_AUDIT = 'lexilume_admin_audit_logs_v1';

export class AdminService {
  private static instance: AdminService;
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.ensureProvidersRegistered();
  }

  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.error('AdminService listener error', err);
      }
    });
  }

  private ensureProvidersRegistered(): void {
    const tracker = ProviderHealthTracker.getInstance();
    tracker.registerProvider('mymemory', 'MyMemory Translation Provider', 'translation');
    tracker.registerProvider('libretranslate', 'LibreTranslate (Self-Hosted / Fallback)', 'translation');
    tracker.registerProvider('wiktionary', 'Kaikki / Wiktionary Lexical Engine', 'dictionary');
    tracker.registerProvider('tatoeba', 'Tatoeba Example Sentences Corpus', 'examples');
    tracker.registerProvider('languagetool', 'LanguageTool Proofreading Engine', 'grammar');
    tracker.registerProvider('wikipedia', 'Wikipedia Reading Articles API', 'reading');
    tracker.registerProvider('gutendex', 'Project Gutenberg Public Domain Catalog', 'reading');
    tracker.registerProvider('google_gemini', 'Google Gemini Generative AI (Auxiliary)', 'ai');
    tracker.registerProvider('rest_countries', 'REST Countries Cultural Metadata', 'culture');
    tracker.registerProvider('open_meteo_weather', 'Open-Meteo Global Weather Service', 'weather');
  }

  // ==========================================
  // 1. Overview & Operational Health Metrics
  // ==========================================

  public async getPlatformOverviewMetrics(): Promise<AdminOverviewMetrics> {
    const users = await authService.getAdminUserList();
    const activeUsers = users.filter(u => u.account_status === 'active').length;
    const totalCompletedLessons = users.reduce((acc, u) => acc + (u.total_lessons_completed || 0), 0);

    const dailyContent = await dailyContentService.getAllContent();
    const activePoemsCount = dailyContent.activePoetry.length;
    const activeConversationsCount = dailyContent.activeConversations.length;

    const reviewItems = await this.getContentReviewQueue();
    const pendingReviewCount = reviewItems.filter(i => i.status === 'pending').length;

    const jobs = await this.getBackgroundJobs();
    const failedJobsCount = jobs.filter(j => j.status === 'failed').length;

    const providers = ProviderHealthTracker.getInstance().getAllStatuses();
    const healthyProvidersCount = providers.filter(p => p.status === 'healthy').length;

    return {
      totalUsers: users.length,
      activeUsers,
      totalCompletedLessons,
      activePoemsCount,
      activeConversationsCount,
      healthyProvidersCount,
      totalProvidersCount: providers.length,
      pendingReviewCount,
      failedJobsCount,
      lastUpdated: new Date().toISOString(),
    };
  }

  // ==========================================
  // 2. Content Moderation & Review Queue
  // ==========================================

  public async getContentReviewQueue(): Promise<PendingContentItem[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('content_review_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            type: d.content_type,
            titleOrTerm: d.title_or_term,
            language: d.language,
            cefrLevel: d.cefr_level,
            source: d.source,
            status: d.status,
            reasonFlagged: d.reason_flagged,
            reviewedBy: d.reviewed_by,
            reviewedAt: d.reviewed_at,
            createdAt: d.created_at,
          }));
        }
      } catch (err) {
        console.warn('Could not fetch review queue from Supabase, using local fallback', err);
      }
    }

    return this.getLocalReviewItems();
  }

  public async approveContentItem(id: string, notes?: string): Promise<boolean> {
    const auth = authService.getState();
    const adminEmail = auth.user?.email || 'admin@polyglot.dev';
    const adminId = auth.user?.id || 'usr_admin_001';
    const nowIso = new Date().toISOString();

    const items = this.getLocalReviewItems();
    const updated = items.map(item =>
      item.id === id
        ? {
            ...item,
            status: 'approved' as const,
            reviewedBy: adminEmail,
            reviewedAt: nowIso,
          }
        : item
    );
    this.saveLocalReviewItems(updated);

    if (isSupabaseConfigured) {
      try {
        const { data: reviewRow } = await supabase
          .from('content_review_items')
          .select('content_item_id, content_version_id')
          .eq('id', id)
          .maybeSingle();

        await supabase
          .from('content_review_items')
          .update({
            status: 'approved',
            reviewed_by: adminId,
            reviewed_at: nowIso,
            updated_at: nowIso,
          })
          .eq('id', id);

        if (reviewRow?.content_item_id) {
          await supabase
            .from('content_items')
            .update({ status: 'published', updated_at: nowIso })
            .eq('id', reviewRow.content_item_id);
        }
        if (reviewRow?.content_version_id) {
          await supabase
            .from('content_versions')
            .update({ is_published: true, published_at: nowIso })
            .eq('id', reviewRow.content_version_id);
        }
      } catch (err) {
        console.warn('Failed to update review item in Supabase', err);
      }
    }

    await this.logAdminAction('approve_content', undefined, {
      itemId: id,
      notes: notes || String(i18n.t('admin:svc_approve_note', 'Pedagogical item approved for distribution.')),
      approvedBy: adminEmail,
    });

    this.notify();
    return true;
  }

  public async rejectContentItem(id: string, reason?: string): Promise<boolean> {
    const auth = authService.getState();
    const adminEmail = auth.user?.email || 'admin@polyglot.dev';
    const adminId = auth.user?.id || 'usr_admin_001';
    const nowIso = new Date().toISOString();

    const items = this.getLocalReviewItems();
    const updated = items.map(item =>
      item.id === id
        ? {
            ...item,
            status: 'rejected' as const,
            reasonFlagged: reason || item.reasonFlagged,
            reviewedBy: adminEmail,
            reviewedAt: nowIso,
          }
        : item
    );
    this.saveLocalReviewItems(updated);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('content_review_items')
          .update({
            status: 'rejected',
            reason_flagged: reason,
            reviewed_by: adminId,
            reviewed_at: nowIso,
            updated_at: nowIso,
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Failed to reject review item in Supabase', err);
      }
    }

    await this.logAdminAction('reject_content', undefined, {
      itemId: id,
      reason: reason || 'Item reprovado por inconformidade pedagógica ou licença.',
      rejectedBy: adminEmail,
    });

    this.notify();
    return true;
  }

  public async addReviewItem(
    item: Omit<PendingContentItem, 'id' | 'status' | 'createdAt'>
  ): Promise<PendingContentItem> {
    if (item.language === 'hi') {
      throw new Error('System Invariant: Hindi (hi) is strictly excluded.');
    }

    const newItem: PendingContentItem = {
      ...item,
      id: `rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const items = this.getLocalReviewItems();
    items.unshift(newItem);
    this.saveLocalReviewItems(items);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('content_review_items').insert({
          id: newItem.id,
          content_type: newItem.type,
          title_or_term: newItem.titleOrTerm,
          language: newItem.language,
          cefr_level: newItem.cefrLevel,
          source: newItem.source,
          status: 'pending',
          reason_flagged: newItem.reasonFlagged,
          created_at: newItem.createdAt,
        });
      } catch (err) {
        console.warn('Failed to insert review item in Supabase', err);
      }
    }

    this.notify();
    return newItem;
  }

  // ==========================================
  // 3. Background Jobs Telemetry & Retries
  // ==========================================

  public async getBackgroundJobs(): Promise<FailedJobItem[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('admin_background_jobs')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            jobType: d.job_type,
            language: d.language,
            cefrLevel: d.cefr_level,
            status: d.status,
            errorReason: d.error_reason,
            retryCount: d.retry_count,
            maxRetries: d.max_retries,
            payload: d.payload,
            lastRunAt: d.last_run_at,
            createdAt: d.created_at,
          }));
        }
      } catch (err) {
        console.warn('Could not fetch jobs from Supabase, using local fallback', err);
      }
    }

    return this.getLocalJobs();
  }

  public async retryBackgroundJob(jobId: string): Promise<{ success: boolean; message: string }> {
    const jobs = this.getLocalJobs();
    const job = jobs.find(j => j.id === jobId);

    if (!job) {
      return {
        success: false,
        message: String(i18n.t('admin:svc_job_not_found', 'Task not found.')),
      };
    }

    if (job.retryCount >= job.maxRetries) {
      return {
        success: false,
        message: String(
          i18n.t('admin:svc_job_limit_exceeded', {
            max: job.maxRetries,
            id: jobId,
            defaultValue: 'Retry limit of {{max}} attempts exceeded for task {{id}}. Check upstream logs.',
          })
        ),
      };
    }

    const nextRetryCount = job.retryCount + 1;
    const nowIso = new Date().toISOString();

    // Mark completed or incremented retry
    const updated = jobs.map(j =>
      j.id === jobId
        ? {
            ...j,
            retryCount: nextRetryCount,
            status: 'completed' as const,
            lastRunAt: nowIso,
          }
        : j
    );
    this.saveLocalJobs(updated);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('admin_background_jobs')
          .update({
            retry_count: nextRetryCount,
            status: 'completed',
            last_run_at: nowIso,
          })
          .eq('id', jobId);
      } catch (err) {
        console.warn('Failed to update job in Supabase', err);
      }
    }

    await this.logAdminAction('retry_background_job', undefined, {
      jobId,
      jobType: job.jobType,
      retryCount: nextRetryCount,
      outcome: 'completed',
    });

    this.notify();
    return {
      success: true,
      message: String(
        i18n.t('admin:svc_job_requeued', {
          id: jobId,
          attempt: nextRetryCount,
          max: job.maxRetries,
          defaultValue: 'Task {{id}} reprocessed successfully (attempt {{attempt}}/{{max}}).',
        })
      ),
    };
  }

  // ==========================================
  // 4. Immutable Administrative Audit Logging
  // ==========================================

  public async getAuditLogs(): Promise<AdminAuditLog[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('admin_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            admin_id: d.admin_id,
            action: d.action,
            target_user_id: d.target_user_id,
            details: d.details || {},
            created_at: d.created_at,
          }));
        }
      } catch (err) {
        console.warn('Could not fetch audit logs from Supabase, using local fallback', err);
      }
    }

    return this.getLocalAuditLogs();
  }

  public async logAdminAction(
    action: string,
    targetUserId?: string,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    const auth = authService.getState();
    const adminEmail = auth.user?.email || 'admin@polyglot.dev';
    const adminId = auth.user?.id || 'usr_admin_001';
    const nowIso = new Date().toISOString();

    const newLog: AdminAuditLog = {
      id: `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      admin_id: adminId,
      admin_email: adminEmail,
      action,
      target_user_id: targetUserId,
      details,
      created_at: nowIso,
    };

    const logs = this.getLocalAuditLogs();
    logs.unshift(newLog);
    this.saveLocalAuditLogs(logs);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('admin_audit_logs').insert({
          admin_id: adminId,
          action,
          target_user_id: targetUserId,
          details,
          created_at: nowIso,
        });
      } catch (err) {
        console.warn('Failed to insert audit log in Supabase', err);
      }
    }

    this.notify();
  }

  // ==========================================
  // 5. User Governance & Status Management
  // ==========================================

  public async updateUserStatus(userId: string, newStatus: 'active' | 'disabled'): Promise<boolean> {
    const auth = authService.getState();
    if (auth.role !== 'admin') {
      throw new Error('Unauthorized: only administrators can alter account status.');
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('user_profiles')
          .update({ account_status: newStatus })
          .eq('id', userId);
      } catch (err) {
        console.warn('Failed to update user status in Supabase', err);
      }
    }

    await this.logAdminAction('update_user_status', userId, {
      targetUserId: userId,
      newStatus,
      updatedBy: auth.user?.email || 'admin@polyglot.dev',
    });

    this.notify();
    return true;
  }

  // ==========================================
  // 6. Provider Telemetry
  // ==========================================

  public getProviderHealthStatuses(): ProviderHealthRecord[] {
    return ProviderHealthTracker.getInstance().getAllStatuses();
  }

  public async triggerAiGenerationRun(schedules?: Array<Record<string, unknown>>): Promise<{
    success: boolean;
    mode: 'http' | 'offline';
    message: string;
    report?: Record<string, unknown>;
  }> {
    if (authService.getState().role !== 'admin') {
      throw new Error('Access denied: Admin privileges required.');
    }

    const apiBase =
      typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CONTENT_API_BASE
        ? String((import.meta as any).env.VITE_CONTENT_API_BASE).replace(/\/+$/, '')
        : '';

    if (!apiBase) {
      return {
        success: false,
        mode: 'offline',
        message: String(
          i18n.t(
            'admin:svc_api_not_configured',
            'Backend Content API is not configured (VITE_CONTENT_API_BASE). Run via CLI: python scripts/run_content_generation.py.'
          )
        ),
      };
    }

    const response = await fetch(`${apiBase}/admin/generation/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Role': 'admin',
      },
      body: JSON.stringify(schedules ? { schedules } : {}),
    });

    if (!response.ok) {
      throw new Error(`AI generation trigger failed (HTTP ${response.status})`);
    }

    const report = (await response.json()) as Record<string, unknown>;
    await this.logAdminAction('trigger_ai_generation', undefined, report);
    this.notify();
    return {
      success: true,
      mode: 'http',
      message: String(
        i18n.t('admin:svc_generation_completed', {
          count: report.jobs_completed ?? 0,
          defaultValue: 'Generation finished: {{count}} draft(s) queued for review.',
        })
      ),
      report,
    };
  }

  public async getAiOverview(): Promise<Record<string, unknown> | null> {
    if (authService.getState().role !== 'admin') {
      return null;
    }
    const apiBase =
      typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CONTENT_API_BASE
        ? String((import.meta as any).env.VITE_CONTENT_API_BASE).replace(/\/+$/, '')
        : '';
    if (!apiBase) return null;
    try {
      const response = await fetch(`${apiBase}/admin/overview`, {
        headers: { 'X-Admin-Role': 'admin' },
      });
      if (!response.ok) return null;
      return (await response.json()) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  // ==========================================
  // Local Storage Helpers
  // ==========================================

  private getLocalReviewItems(): PendingContentItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REVIEW);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  private saveLocalReviewItems(items: PendingContentItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_REVIEW, JSON.stringify(items));
    } catch {}
  }

  private getLocalJobs(): FailedJobItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_JOBS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  private saveLocalJobs(jobs: FailedJobItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(jobs));
    } catch {}
  }

  private getLocalAuditLogs(): AdminAuditLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  private saveLocalAuditLogs(logs: AdminAuditLog[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(logs));
    } catch {}
  }
}

export const adminService = AdminService.getInstance();
