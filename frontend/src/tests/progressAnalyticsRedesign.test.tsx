import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProgressPage } from '../pages/ProgressPage';
import { StorageService } from '../services/storage';
import { courseService } from '../services/courseService';
import { activityService } from '../services/activityService';
import { ptCurriculum } from '../data/seedData';
import { I18nProvider } from '../i18n/i18nContext';
import { ExerciseAttempt, DailyPoem, DailyConversation } from '../types';

describe('Lexilume Progress Page Redesign & Learning Analytics Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('1. Scopes exercise attempts strictly by target language (eliminates cross-language contamination)', () => {
    // Save attempts in Portuguese
    const ptAttempt: ExerciseAttempt = {
      id: 'att_pt_01',
      exercise_id: 'ex_pt_01',
      submitted_answer: 'sou',
      is_correct: true,
      feedback: 'Correto!',
      attempt_count: 1,
      timestamp: new Date().toISOString(),
      language: 'pt',
      exercise_type: 'cloze',
    };
    StorageService.saveExerciseAttempt(ptAttempt);

    // Save attempts in Spanish (one incorrect)
    const esAttempt: ExerciseAttempt = {
      id: 'att_es_01',
      exercise_id: 'ex_es_01',
      submitted_answer: 'somos',
      is_correct: false,
      feedback: 'Incorrecto',
      attempt_count: 1,
      timestamp: new Date().toISOString(),
      language: 'es',
      exercise_type: 'cloze',
    };
    StorageService.saveExerciseAttempt(esAttempt);

    // Verify StorageService scopes attempts by language
    const ptAttempts = StorageService.getExerciseAttempts('pt');
    const esAttempts = StorageService.getExerciseAttempts('es');

    expect(ptAttempts.length).toBe(1);
    expect(ptAttempts[0].id).toBe('att_pt_01');
    expect(ptAttempts[0].is_correct).toBe(true);

    expect(esAttempts.length).toBe(1);
    expect(esAttempts[0].id).toBe('att_es_01');
    expect(esAttempts[0].is_correct).toBe(false);

    // Render ProgressPage for Portuguese
    render(
      <I18nProvider>
        <ProgressPage />
      </I18nProvider>
    );

    // PT accuracy should be 100% (1/1), not contaminated by Spanish error (which would make it 50%)
    expect(screen.getAllByText('100%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/1 \/ 1/i)).toBeDefined();
  });

  it('2. Does not display misleading C1 Pleno certificate without formal accreditation', () => {
    // Set track state to C1 and completed all nodes
    const track = StorageService.getTrackState('pt');
    track.current_cefr_level = 'C1';
    track.completed_curriculum_node_ids = courseService.getCurriculumForLanguage('pt').map(n => n.id);
    StorageService.saveTrackState(track);

    render(
      <I18nProvider>
        <ProgressPage />
      </I18nProvider>
    );

    // Verify untruthful certification labels are completely removed
    expect(screen.queryByText(/Atestado C1 Pleno/i)).toBeNull();
    expect(screen.queryByText(/Certificação C1/i)).toBeNull();
  });

  it('3. Dynamically calculates curriculum progression from actual published data (no hardcoded 36)', () => {
    // pt curriculum derives strictly from published seedData (not hardcoded 36)
    const ptNodes = courseService.getCurriculumForLanguage('pt');
    expect(ptNodes.length).toBe(ptCurriculum.length);
    expect(courseService.getCurriculumTotalNodes('pt')).toBe(ptCurriculum.length);

    // French has 0 published nodes in seedData (curation state)
    const frNodes = courseService.getCurriculumForLanguage('fr');
    expect(frNodes.length).toBe(0);
    expect(courseService.getCurriculumTotalNodes('fr')).toBe(0);
  });

  it('4. Switches between all supported languages without cross-language contamination', () => {
    render(
      <I18nProvider>
        <ProgressPage />
      </I18nProvider>
    );

    // Switch to English via quick button
    const enButton = screen.getByRole('button', { name: /^English$/i });
    fireEvent.click(enButton);

    // Shows English curriculum node from enCurriculum
    expect(screen.getByText(/Introductions and Daily Routines in the Present Simple/i)).toBeDefined();

    // Switch to Spanish via quick button
    const esButton = screen.getByRole('button', { name: /^Español$/i });
    fireEvent.click(esButton);

    // Shows Spanish curriculum node from esCurriculum
    expect(screen.getByText(/Presente de Indicativo y Verbos Ser, Estar y Tener/i)).toBeDefined();
  });

  it('5. Tracks Daily Literature and Communicative Dialogue activity with version pinning', () => {
    const testPoem: DailyPoem = {
      id: 'poem-test-99',
      title: 'Versos de Prova',
      author: 'Poeta Fictício',
      learning_language: 'pt',
      cefr_level: 'B2',
      excerpt: 'Versos de teste...',
      full_text: 'Linha um\nLinha dois',
      cultural_context: 'Contexto de teste',
      country_name: 'Portugal',
      country_code: 'PT',
      published_at: '2026-11-01T00:00:00Z',
      is_active: true,
    };

    activityService.recordPoetryInteraction(testPoem, 'completed');

    const summary = activityService.getLanguageActivitySummary('pt');
    expect(summary.poetryCompletedCount).toBe(1);

    const events = StorageService.getActivityEvents('pt');
    const poemEvent = events.find(e => e.content_id === 'poem-test-99');
    expect(poemEvent).toBeDefined();
    expect(poemEvent?.content_version).toBe('2026-11-01T00:00:00Z');
    expect(poemEvent?.activity_type).toBe('poetry_completed');
  });

  it('6. Keeps country exploration strictly independent from CEFR language proficiency', () => {
    StorageService.recordCountryExplored('JP');
    StorageService.recordCountryExplored('FR');

    const explored = StorageService.getExploredCountries();
    expect(explored).toContain('JP');
    expect(explored).toContain('FR');

    // Verify track state CEFR level is NOT modified by country exploration
    const track = StorageService.getTrackState('pt');
    expect(track.current_cefr_level).toBe('A1');
    expect(track.completed_curriculum_node_ids.length).toBe(0);
  });
});
