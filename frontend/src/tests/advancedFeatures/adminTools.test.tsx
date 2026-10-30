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
      expect(screen.getByText(/Painel de Administração e Qualidade/i)).toBeDefined();
      expect(screen.getByText(/Fila de Moderação e Validação de Conteúdo/i)).toBeDefined();

      // Check review items
      expect(screen.getByText('perspicácia')).toBeDefined();
      expect(screen.getByText('Barroco Joanino no Norte de Portugal')).toBeDefined();

      // Approve an item
      const approveBtns = screen.getAllByRole('button', { name: /Aprovar/i });
      expect(approveBtns.length).toBeGreaterThan(0);
      fireEvent.click(approveBtns[0]);

      // Shows approved badge
      expect(screen.getByText(/✓ Aprovado/i)).toBeDefined();

      // Reject an item
      const rejectBtns = screen.getAllByRole('button', { name: /Rejeitar/i });
      expect(rejectBtns.length).toBeGreaterThan(0);
      fireEvent.click(rejectBtns[0]);

      // Shows rejected badge
      expect(screen.getByText(/✗ Rejeitado/i)).toBeDefined();
    });

    it('enforces language enablement matrix and strictly excludes Hindi', async () => {
      render(<AdminWorkbench />);

      // Navigate to languages tab
      const langTabBtn = screen.getAllByRole('button', { name: /Matriz de Idiomas \(13\)/i })[0];
      fireEvent.click(langTabBtn);

      // Verify 13 supported languages are listed
      expect(screen.getByText(/Português \(BR \/ PT\)/i)).toBeDefined();
      expect(screen.getByText(/Español \(ES \/ MX\)/i)).toBeDefined();
      expect(screen.getByText(/English \(US \/ GB\)/i)).toBeDefined();
      expect(screen.getByText(/Français/i)).toBeDefined();
      expect(screen.getByText(/Deutsch/i)).toBeDefined();
      expect(screen.getByText(/Italiano/i)).toBeDefined();
      expect(screen.getByText(/Japonês/i)).toBeDefined();
      expect(screen.getByText(/Coreano/i)).toBeDefined();
      expect(screen.getByText(/Russo/i)).toBeDefined();
      expect(screen.getByText(/Holandês/i)).toBeDefined();
      expect(screen.getByText(/Mandarim/i)).toBeDefined();
      expect(screen.getByText(/Turco/i)).toBeDefined();
      expect(screen.getByText(/Tâmil/i)).toBeDefined();

      // Hindi is explicitly blocked
      expect(screen.getByText(/HI \(Hindi\)/i)).toBeDefined();
      expect(screen.getByText(/Excluído pelo Escopo do Sistema/i)).toBeDefined();

      const blockedBtn = screen.getAllByRole('button', { name: /Bloqueado/i })[0];
      expect(blockedBtn).toBeDefined();
      fireEvent.click(blockedBtn);
    });

    it('audits CEFR distribution, provider health, failed job retries, and dataset versions', async () => {
      render(<AdminWorkbench />);

      // 1. CEFR Audit tab
      const cefrTabBtn = screen.getAllByRole('button', { name: /Auditoria CEFR A1–C1/i })[0];
      fireEvent.click(cefrTabBtn);

      expect(screen.getByText(/Auditoria de Conteúdo Pedagógico CEFR \(A1–C1\)/i)).toBeDefined();
      expect(screen.getAllByText('Conforme').length).toBeGreaterThan(0);
      expect(screen.getByText('Excelente')).toBeDefined();

      // 2. Provider Health tab
      const providerTabBtn = screen.getAllByRole('button', { name: /Saúde de Provedores/i })[0];
      fireEvent.click(providerTabBtn);

      expect(screen.getByText(/Telemetria e Saúde dos Provedores Abertos/i)).toBeDefined();
      expect(screen.getByText(/Kaikki \/ Wiktionary Lexical Engine/i)).toBeDefined();
      expect(screen.getByText(/Tatoeba Example Sentences Corpus/i)).toBeDefined();

      // 3. Failed Generation Jobs tab
      const jobsTabBtn = screen.getAllByRole('button', { name: /Fila de Falhas & Retentativas/i })[0];
      fireEvent.click(jobsTabBtn);

      expect(screen.getByText(/CEFR C1 Sentence Synthesis/i)).toBeDefined();
      const retryBtn = screen.getAllByRole('button', { name: /Tentar Novamente/i })[0];
      fireEvent.click(retryBtn);

      // Job is removed upon retry
      expect(screen.queryByText(/CEFR C1 Sentence Synthesis/i)).toBeNull();

      // 4. Dataset Versions tab
      const datasetsTabBtn = screen.getAllByRole('button', { name: /Versões dos Datasets/i })[0];
      fireEvent.click(datasetsTabBtn);

      expect(screen.getByText(/Rastreamento de Versões dos Datasets Abertos/i)).toBeDefined();
      expect(screen.getByText(/2026\.04-stable/i)).toBeDefined();
      expect(screen.getByText(/Release 2026-Q2/i)).toBeDefined();
    });
  });
});
