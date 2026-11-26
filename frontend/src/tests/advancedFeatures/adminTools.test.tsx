import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminWorkbench } from '../../features/admin/AdminWorkbench';
import { ProviderHealthTracker } from '../../services/monitoring/providerHealth';
import { ApiRegistry } from '../../integrations/external-apis/core/ApiRegistry';
import { WikipediaAdapter } from '../../integrations/external-apis/adapters/wikipedia/WikipediaAdapter';
import { adminService } from '../../services/adminService';
import { contentCentredService } from '../../services/contentCentredService';
import { I18nProvider } from '../../i18n/i18nContext';
import { LanguageDetector } from '../../i18n/languageDetector';
import i18n from '../../i18n/config';

describe('Step 8: Advanced Learning Features — Admin Tools & Observability', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    LanguageDetector.persistSelection('en');
    await i18n.changeLanguage('en');

    // Register real API adapter metadata (providers are auto-registered by adminService)
    ApiRegistry.getInstance().register(new WikipediaAdapter() as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('10. Admin Workbench', () => {
    it('moderates content review items, allowing approve and reject actions', async () => {
      await adminService.addReviewItem({
        titleOrTerm: 'perspicácia',
        type: 'vocabulary',
        language: 'pt',
        cefrLevel: 'C1',
        source: 'Kaikki / Wiktionary',
      });
      await adminService.addReviewItem({
        titleOrTerm: 'Barroco Joanino no Norte de Portugal',
        type: 'story',
        language: 'pt',
        cefrLevel: 'C1',
        source: 'Wikipedia REST API',
      });

      render(
        <I18nProvider>
          <AdminWorkbench />
        </I18nProvider>
      );

      expect(
        await screen.findByText(/Painel de Administração e Qualidade|Administration & Quality Workbench/i)
      ).toBeDefined();
      expect(
        screen.getByText(/Fila de Moderação e Validação de Conteúdo|Pedagogical Content Review Queue/i)
      ).toBeDefined();

      expect(await screen.findByText('perspicácia')).toBeDefined();
      expect(screen.getByText('Barroco Joanino no Norte de Portugal')).toBeDefined();

      const approveBtns = screen.getAllByRole('button', { name: /Aprovar|Approve/i });
      expect(approveBtns.length).toBeGreaterThan(0);
      fireEvent.click(approveBtns[0]);

      const approvedMatches = await screen.findAllByText(/✓ Aprovado|✓ Approved/i);
      expect(approvedMatches.length).toBeGreaterThan(0);

      const rejectBtns = screen.getAllByRole('button', { name: /Rejeitar|Reject/i });
      expect(rejectBtns.length).toBeGreaterThan(0);
      fireEvent.click(rejectBtns[0]);

      const rejectedMatches = await screen.findAllByText(/✗ Rejeitado|✗ Rejected/i);
      expect(rejectedMatches.length).toBeGreaterThan(0);
    });

    it('enforces language enablement matrix and strictly excludes Hindi', async () => {
      render(
        <I18nProvider>
          <AdminWorkbench />
        </I18nProvider>
      );

      const langTabBtn = screen.getAllByRole('button', {
        name: /Matriz de Idiomas \(3\)|Language Enablement/i,
      })[0];
      fireEvent.click(langTabBtn);

      expect(screen.getByText(/Português \(BR \/ PT\)/i)).toBeDefined();
      expect(screen.getByText(/Español \(ES \/ MX\)/i)).toBeDefined();
      expect(screen.getByText(/English \(US \/ GB\)/i)).toBeDefined();
      expect(screen.queryByText(/Français/i)).toBeNull();
      expect(screen.queryByText(/Deutsch/i)).toBeNull();

      expect(screen.getByText(/HI \(Hindi\)/i)).toBeDefined();
      expect(screen.getByText(/Excluído pelo Escopo do Sistema|Excluded by system scope/i)).toBeDefined();

      const blockedBtn = screen.getAllByRole('button', { name: /Bloqueado|Blocked/i })[0];
      expect(blockedBtn).toBeDefined();
      fireEvent.click(blockedBtn);
    });

    it('audits CEFR distribution, provider health, failed job retries, and live dataset inventory', async () => {
      const mockPublished = Array.from({ length: 6 }, (_, i) => ({
        id: `pub-c1-item-${i}`,
        title: `Live C1 Unit ${i}`,
        slug: `live-c1-unit-${i}`,
        target_language: 'pt' as const,
        explanation_language: 'en' as const,
        source_language: 'pt',
        summary: 'Generated content',
        genre: 'short_story' as const,
        content_type: 'story' as const,
        primary_cefr: 'C1' as const,
        estimated_read_minutes: 3,
        status: 'published' as const,
        rights_status: 'public_domain' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      vi.spyOn(contentCentredService, 'getContentItems').mockResolvedValue(mockPublished);

      vi.spyOn(adminService, 'getBackgroundJobs').mockResolvedValue([
        {
          id: 'job-live-1',
          jobType: 'CEFR C1 Sentence Synthesis',
          language: 'pt',
          cefrLevel: 'C1',
          status: 'failed',
          retryCount: 0,
          maxRetries: 3,
          errorReason: 'Timeout reaching Open Corpus',
          lastRunAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ]);
      vi.spyOn(adminService, 'retryBackgroundJob').mockResolvedValue({
        success: true,
        message: 'Retried',
      });

      render(
        <I18nProvider>
          <AdminWorkbench />
        </I18nProvider>
      );

      // 1. CEFR Audit tab
      const cefrTabBtn = screen.getAllByRole('button', { name: /Auditoria CEFR|CEFR Audit/i })[0];
      fireEvent.click(cefrTabBtn);

      expect(
        screen.getByText(/Auditoria de Conteúdo Pedagógico CEFR|Pedagogical CEFR Content Audit/i)
      ).toBeDefined();
      await waitFor(() => {
        expect(screen.getAllByText(/Excelente|Excellent/).length).toBeGreaterThan(0);
      });

      // 2. Provider Health tab
      const providerTabBtn = screen.getAllByRole('button', { name: /Provedores|Provider Health/i })[0];
      fireEvent.click(providerTabBtn);

      expect(
        screen.getByText(/Telemetria e Saúde dos Provedores Abertos|Live Provider Health & Latency Monitor/i)
      ).toBeDefined();
      expect(screen.getAllByText(/Kaikki \/ Wiktionary Lexical Engine/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Tatoeba Example Sentences Corpus/i).length).toBeGreaterThan(0);

      // 3. Failed Generation Jobs tab
      const jobsTabBtn = screen.getAllByRole('button', { name: /Fila de Falhas|Failed Jobs/i })[0];
      fireEvent.click(jobsTabBtn);

      expect(await screen.findByText(/CEFR C1 Sentence Synthesis/i)).toBeDefined();
      const retryBtn = screen.getAllByRole('button', { name: /Tentar Novamente|Try Again|Retry/i })[0];
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.queryByText(/CEFR C1 Sentence Synthesis/i)).toBeNull();
      });

      // 4. Datasets tab shows live registry/health inventory rather than static dataset placeholders
      const datasetsTabBtn = screen.getAllByRole('button', { name: /Datasets/i })[0];
      fireEvent.click(datasetsTabBtn);

      expect(
        screen.getByText(/Rastreamento de Versões dos Datasets Abertos|Open Educational Dataset Tracking/i)
      ).toBeDefined();
      expect(screen.getAllByText(/Wikipedia/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Wikimedia/i).length).toBeGreaterThan(0);
    });
  });
});
