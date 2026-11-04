import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminWorkbench } from '../../features/admin/AdminWorkbench';
import { ProviderHealthTracker } from '../../services/monitoring/providerHealth';

describe('Step 8: Advanced Learning Features — Admin Tools & Observability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('10. Admin Workbench', () => {
    it('moderates content review items, allowing approve and reject actions', async () => {
      render(<AdminWorkbench />);

      // Title & initial tab
      expect(screen.getByText(/Painel de Administração e Qualidade|Administration & Quality Workbench/i)).toBeDefined();
      expect(screen.getByText(/Fila de Moderação e Validação de Conteúdo|Pedagogical Content Review Queue/i)).toBeDefined();

      // Check review items
      expect(screen.getByText('perspicácia')).toBeDefined();
      expect(screen.getByText('Barroco Joanino no Norte de Portugal')).toBeDefined();

      // Approve an item
      const approveBtns = screen.getAllByRole('button', { name: /Aprovar|Approve/i });
      expect(approveBtns.length).toBeGreaterThan(0);
      fireEvent.click(approveBtns[0]);

      // Shows approved badge
      expect(screen.getByText(/✓ Aprovado|✓ Approved/i)).toBeDefined();

      // Reject an item
      const rejectBtns = screen.getAllByRole('button', { name: /Rejeitar|Reject/i });
      expect(rejectBtns.length).toBeGreaterThan(0);
      fireEvent.click(rejectBtns[0]);

      // Shows rejected badge
      expect(screen.getByText(/✗ Rejeitado|✗ Rejected/i)).toBeDefined();
    });

    it('enforces language enablement matrix and strictly excludes Hindi', async () => {
      render(<AdminWorkbench />);

      // Navigate to languages tab
      const langTabBtn = screen.getAllByRole('button', { name: /Matriz de Idiomas \(3\)/i })[0];
      fireEvent.click(langTabBtn);

      // Verify only the three product languages are listed
      expect(screen.getByText(/Português \(BR \/ PT\)/i)).toBeDefined();
      expect(screen.getByText(/Español \(ES \/ MX\)/i)).toBeDefined();
      expect(screen.getByText(/English \(US \/ GB\)/i)).toBeDefined();
      expect(screen.queryByText(/Français/i)).toBeNull();
      expect(screen.queryByText(/Deutsch/i)).toBeNull();
      expect(screen.queryByText(/Italiano/i)).toBeNull();
      expect(screen.queryByText(/Japonês/i)).toBeNull();
      expect(screen.queryByText(/Coreano/i)).toBeNull();
      expect(screen.queryByText(/Russo/i)).toBeNull();
      expect(screen.queryByText(/Holandês/i)).toBeNull();
      expect(screen.queryByText(/Mandarim/i)).toBeNull();
      expect(screen.queryByText(/Turco/i)).toBeNull();
      expect(screen.queryByText(/Tâmil/i)).toBeNull();

      // Hindi is explicitly blocked
      expect(screen.getByText(/HI \(Hindi\)/i)).toBeDefined();
      expect(screen.getByText(/Excluído pelo Escopo do Sistema|Excluded by system scope/i)).toBeDefined();

      const blockedBtn = screen.getAllByRole('button', { name: /Bloqueado|Blocked/i })[0];
      expect(blockedBtn).toBeDefined();
      fireEvent.click(blockedBtn);
    });

    it('audits CEFR distribution, provider health, failed job retries, and dataset versions', async () => {
      render(<AdminWorkbench />);

      // 1. CEFR Audit tab
      const cefrTabBtn = screen.getAllByRole('button', { name: /Auditoria CEFR|CEFR Audit/i })[0];
      fireEvent.click(cefrTabBtn);

      expect(
        screen.getByText(/Auditoria de Conteúdo Pedagógico CEFR|Pedagogical CEFR Content Audit/i)
      ).toBeDefined();
      expect(screen.getAllByText(/Conforme|Compliant/).length).toBeGreaterThan(0);
      expect(screen.getByText(/Excelente|Excellent/)).toBeDefined();

      // 2. Provider Health tab
      const providerTabBtn = screen.getAllByRole('button', { name: /Provedores|Provider Health/i })[0];
      fireEvent.click(providerTabBtn);

      expect(
        screen.getByText(/Telemetria e Saúde dos Provedores Abertos|Live Provider Health & Latency Monitor/i)
      ).toBeDefined();
      expect(screen.getByText(/Kaikki \/ Wiktionary Lexical Engine/i)).toBeDefined();
      expect(screen.getByText(/Tatoeba Example Sentences Corpus/i)).toBeDefined();

      // 3. Failed Generation Jobs tab
      const jobsTabBtn = screen.getAllByRole('button', { name: /Fila de Falhas|Failed Jobs/i })[0];
      fireEvent.click(jobsTabBtn);

      expect(screen.getByText(/CEFR C1 Sentence Synthesis/i)).toBeDefined();
      const retryBtn = screen.getAllByRole('button', { name: /Tentar Novamente|Try Again/i })[0];
      fireEvent.click(retryBtn);

      // Job is removed upon retry
      expect(screen.queryByText(/CEFR C1 Sentence Synthesis/i)).toBeNull();

      // 4. Dataset Versions tab
      const datasetsTabBtn = screen.getAllByRole('button', { name: /Datasets/i })[0];
      fireEvent.click(datasetsTabBtn);

      expect(
        screen.getByText(/Rastreamento de Versões dos Datasets Abertos|Open Educational Dataset Tracking/i)
      ).toBeDefined();
      expect(screen.getByText(/2026\.04-stable/i)).toBeDefined();
      expect(screen.getByText(/Release 2026-Q2/i)).toBeDefined();
    });
  });
});
