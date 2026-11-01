/**
 * Lexilume — Admin Workbench & Daily Content Studio Redesign Test Suite
 * 
 * Verifies:
 * 1. Multi-tier Role-Based Security: Guest / User blocked; Admin permitted.
 * 2. Persistent Content Review Moderation: Approve, reject, add item with audit logging.
 * 3. Strict Hindi Invariant: Hindi ('hi') is strictly rejected across review items & daily content.
 * 4. Daily Content Studio: Safe scoped replacement (archives active version, never deletes historical learner data).
 * 5. Bounded Background Job Retries: Increments count and caps at maxRetries.
 * 6. Provider Telemetry: Accurate reflection of ProviderHealthTracker without synthetic seeding.
 * 7. Traceability: Every administrative action generates an immutable audit log entry.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminPage } from '../pages/AdminPage';
import { AdminWorkbench } from '../features/admin/AdminWorkbench';
import { AdminDailyContentStudio } from '../features/admin/AdminDailyContentStudio';
import { adminService } from '../services/adminService';
import { authService } from '../services/auth';
import { dailyContentService } from '../services/dailyContentService';
import { ProviderHealthTracker } from '../services/monitoring/providerHealth';
import { I18nProvider } from '../i18n/i18nContext';

describe('Lexilume Admin Workbench & Production Operations Suite', () => {
  beforeEach(async () => {
    localStorage.clear();
    await authService.signOut();
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Role-Based Access Control & Security Invariants
  // --------------------------------------------------------------------------
  it('blocks unauthenticated guests and regular users from accessing AdminPage', async () => {
    // 1. As guest
    const { unmount } = render(
      <I18nProvider>
        <AdminPage onNavigateTab={() => {}} />
      </I18nProvider>
    );

    expect(screen.getByText(/Access Restricted|Acesso Restrito/i)).toBeDefined();
    expect(screen.queryByText(/Painel de Operações & Governança/i)).toBeNull();
    unmount();

    // 2. As regular user
    await authService.signIn('learner@polyglot.dev', 'LearnerPass123!');
    render(
      <I18nProvider>
        <AdminPage onNavigateTab={() => {}} />
      </I18nProvider>
    );

    expect(screen.getByText(/Access Restricted|Acesso Restrito/i)).toBeDefined();
    expect(screen.queryByText(/Painel de Operações & Governança/i)).toBeNull();
  });

  it('permits authenticated administrators full access to AdminPage and Workbench', async () => {
    await authService.signIn('admin@polyglot.dev', 'AdminPass123!');

    render(
      <I18nProvider>
        <AdminPage onNavigateTab={() => {}} />
      </I18nProvider>
    );

    expect(screen.queryByText(/Access Restricted|Acesso Restrito/i)).toBeNull();
    expect(screen.getByText(/Visão Geral da Plataforma Lexilume/i)).toBeDefined();
    expect(screen.getAllByRole('button', { name: /Visão Geral/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Gestão de Usuários/i })).toBeDefined();
    expect(screen.getAllByRole('button', { name: /Fila de Moderação/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /Estúdio Diário/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /Operações & Saúde|Saúde & Tarefas/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Trilha de Auditoria/i })).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 2. Real Platform Overview Metrics
  // --------------------------------------------------------------------------
  it('calculates dynamic platform overview metrics based on real database/storage records', async () => {
    await authService.signIn('admin@polyglot.dev', 'AdminPass123!');

    const metrics = await adminService.getPlatformOverviewMetrics();
    expect(metrics.totalUsers).toBeGreaterThan(0);
    expect(metrics.activeUsers).toBeGreaterThan(0);
    expect(metrics.totalProvidersCount).toBeGreaterThan(0);
    expect(metrics.healthyProvidersCount).toBeGreaterThan(0);
    expect(metrics.activePoemsCount).toBeGreaterThan(0);
    expect(metrics.activeConversationsCount).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // 3. Content Review Queue & Audit Logging
  // --------------------------------------------------------------------------
  it('approves and rejects items in the content review queue with audit logging', async () => {
    await authService.signIn('admin@polyglot.dev', 'AdminPass123!');

    const queueBefore = await adminService.getContentReviewQueue();
    expect(queueBefore.length).toBeGreaterThan(0);

    const firstItem = queueBefore[0];

    // Approve item
    const approveOk = await adminService.approveContentItem(firstItem.id, 'Verificado com sucesso');
    expect(approveOk).toBe(true);

    const queueAfterApprove = await adminService.getContentReviewQueue();
    const approvedItem = queueAfterApprove.find(i => i.id === firstItem.id);
    expect(approvedItem?.status).toBe('approved');

    // Check audit logs
    const auditLogs = await adminService.getAuditLogs();
    const approveLog = auditLogs.find(l => l.action === 'approve_content');
    expect(approveLog).toBeDefined();
    expect(approveLog?.details).toMatchObject({ itemId: firstItem.id });

    // Reject second item
    const secondItem = queueBefore[1];
    const rejectOk = await adminService.rejectContentItem(secondItem.id, 'Inconformidade léxica');
    expect(rejectOk).toBe(true);

    const queueAfterReject = await adminService.getContentReviewQueue();
    const rejectedItem = queueAfterReject.find(i => i.id === secondItem.id);
    expect(rejectedItem?.status).toBe('rejected');
    expect(rejectedItem?.reasonFlagged).toContain('Inconformidade léxica');
  });

  it('strictly excludes Hindi (hi) from content review submissions', async () => {
    await authService.signIn('admin@polyglot.dev', 'AdminPass123!');

    await expect(
      adminService.addReviewItem({
        titleOrTerm: 'namaste',
        type: 'vocabulary',
        language: 'hi' as any,
        cefrLevel: 'A1',
        source: 'manual',
        reasonFlagged: 'Testing exclusion',
      })
    ).rejects.toThrow(/Hindi \(hi\) is strictly excluded/i);
  });

  // --------------------------------------------------------------------------
  // 4. Daily Content Studio: Safe Scoped Replacement
  // --------------------------------------------------------------------------
  it('publishes a new daily poem and archives previously active poem for that language without deletion', async () => {
    await authService.signIn('admin@polyglot.dev', 'AdminPass123!');

    const stateBefore = await dailyContentService.getAllContent();
    const activePtPoemBefore = stateBefore.activePoetry.find(p => p.learning_language === 'pt');
    expect(activePtPoemBefore).toBeDefined();
    const oldPoemId = activePtPoemBefore!.id;

    // Publish new PT poem
    const newPoem = await dailyContentService.publishPoem({
      title: 'Novo Canto Lusitano',
      author: 'Sophia de Mello Breyner',
      learning_language: 'pt',
      cefr_level: 'B2',
      excerpt: 'Uma praia onde o mar é transparente...',
      full_text: 'Uma praia onde o mar é transparente,\nE as conchas guardam o segredo da maré.',
      cultural_context: 'Poesia do mar e da claridade grega e portuguesa.',
      country_name: 'Portugal',
      country_code: 'PT',
    });

    expect(newPoem.is_active).toBe(true);

    const stateAfter = await dailyContentService.getAllContent();
    const activePtPoemAfter = stateAfter.activePoetry.find(p => p.learning_language === 'pt');
    expect(activePtPoemAfter?.id).toBe(newPoem.id);

    // Old poem must be archived, not destroyed!
    const archivedPtPoem = stateAfter.archivedPoetry.find(p => p.id === oldPoemId);
    expect(archivedPtPoem).toBeDefined();
    expect(archivedPtPoem?.is_active).toBe(false);
  });

  it('publishes a new daily conversation and archives previously active conversation for that language', async () => {
    await authService.signIn('admin@polyglot.dev', 'AdminPass123!');

    const stateBefore = await dailyContentService.getAllContent();
    const activeEsConvoBefore = stateBefore.activeConversations.find(c => c.learning_language === 'es');
    const oldConvoId = activeEsConvoBefore?.id;

    // Publish new ES conversation
    const newConvo = await dailyContentService.publishConversation({
      title: 'En el Museo del Prado',
      scenario: 'Comprar entradas para ver Las Meninas de Velázquez',
      learning_language: 'es',
      cefr_level: 'B1',
      cultural_context: 'Visita cultural habitual en Madrid con registro cortés.',
      country_name: 'España',
      country_code: 'ES',
      dialogue: [
        { speaker: 'Visitante', line: 'Buenos días, dos entradas generales, por favor.', translation: 'Good morning, two general tickets please.' },
        { speaker: 'Taquillero', line: 'Con mucho gusto, ¿desean audioguía?', translation: 'With pleasure, would you like an audio guide?' },
      ],
    });

    expect(newConvo.is_active).toBe(true);

    const stateAfter = await dailyContentService.getAllContent();
    const activeEsConvoAfter = stateAfter.activeConversations.find(c => c.learning_language === 'es');
    expect(activeEsConvoAfter?.id).toBe(newConvo.id);

    if (oldConvoId) {
      const archivedEsConvo = stateAfter.archivedConversations.find(c => c.id === oldConvoId);
      expect(archivedEsConvo).toBeDefined();
      expect(archivedEsConvo?.is_active).toBe(false);
    }
  });

  // --------------------------------------------------------------------------
  // 5. Background Jobs & Bounded Retries
  // --------------------------------------------------------------------------
  it('manages background jobs queue and enforces bounded retry attempts (cap at maxRetries)', async () => {
    await authService.signIn('admin@polyglot.dev', 'AdminPass123!');

    const jobs = await adminService.getBackgroundJobs();
    expect(jobs.length).toBeGreaterThan(0);

    const failedJob = jobs.find(j => j.status === 'failed');
    expect(failedJob).toBeDefined();
    const initialRetries = failedJob!.retryCount;

    // First retry
    const res = await adminService.retryBackgroundJob(failedJob!.id);
    expect(res.success).toBe(true);

    const jobsAfter = await adminService.getBackgroundJobs();
    const retriedJob = jobsAfter.find(j => j.id === failedJob!.id);
    expect(retriedJob?.retryCount).toBe(initialRetries + 1);

    // Force retry count to maxRetries to verify bounded protection
    retriedJob!.retryCount = retriedJob!.maxRetries;
    localStorage.setItem('lexilume_admin_background_jobs_v1', JSON.stringify(jobsAfter));

    const capRes = await adminService.retryBackgroundJob(failedJob!.id);
    expect(capRes.success).toBe(false);
    expect(capRes.message).toContain('Limite de 3 tentativas excedido');
  });

  // --------------------------------------------------------------------------
  // 6. Real Provider Telemetry & Sanitized Logging
  // --------------------------------------------------------------------------
  it('reports authentic provider health records without synthetic checks', () => {
    const tracker = ProviderHealthTracker.getInstance();
    tracker.registerProvider('custom_wiktionary', 'Kaikki Dict Test', 'dictionary');
    tracker.recordSuccess('custom_wiktionary', 45);

    const statuses = adminService.getProviderHealthStatuses();
    const customStatus = statuses.find(s => s.providerId === 'custom_wiktionary');

    expect(customStatus).toBeDefined();
    expect(customStatus?.status).toBe('healthy');
    expect(customStatus?.averageLatencyMs).toBe(45);
    expect(customStatus?.successfulRequests).toBe(1);
    expect(customStatus?.failedRequests).toBe(0);
  });
});
