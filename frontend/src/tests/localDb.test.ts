import { describe, it, expect, beforeEach } from 'vitest';
import {
  getActiveProgress,
  saveActiveProgress,
  clearActiveProgress,
  logMistake,
  getMistakes,
  resolveMistake,
  deleteMistake,
  savePhrasebookWord,
  getPhrasebookWords,
  deletePhrasebookWord,
  estimateStorageUsage,
  clearAllLocalLearningData,
  exportAllIndexedDBData,
} from '../services/localDb';

describe('Local-First Database & Offline Persistence (localDb.ts)', () => {
  beforeEach(async () => {
    await clearAllLocalLearningData();
  });

  it('saves, retrieves, and clears active lesson progress for resume', async () => {
    // 1. Initial state should be null
    const initial = await getActiveProgress('pt');
    expect(initial).toBeNull();

    // 2. Save in-progress state
    await saveActiveProgress({
      id: 'pt',
      language: 'pt',
      curriculum_node_id: 'pt-c1-01',
      lesson_date: '2026-10-29',
      selected_tab: 'reading',
      reading_scroll_ratio: 0.45,
      exercise_answers: { 'ex-1': 'opcao_b' },
      completed_sections: ['vocab', 'grammar'],
      updated_at: new Date().toISOString(),
    });

    // 3. Verify retrieved progress matches exactly
    const retrieved = await getActiveProgress('pt');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.language).toBe('pt');
    expect(retrieved?.selected_tab).toBe('reading');
    expect(retrieved?.reading_scroll_ratio).toBe(0.45);
    expect(retrieved?.exercise_answers['ex-1']).toBe('opcao_b');
    expect(retrieved?.completed_sections).toContain('vocab');

    // 4. Clear progress on lesson completion
    await clearActiveProgress('pt');
    const afterClear = await getActiveProgress('pt');
    expect(afterClear).toBeNull();
  });

  it('logs mistakes with error categorization and allows resolution', async () => {
    const mistakeId = await logMistake({
      user_id: 'learner_1',
      language: 'pt',
      error_category: 'false_friend',
      prompt: 'Qual o significado de "esquisito" em português?',
      context_passage: 'O comportamento pareceu bastante esquisito.',
      user_answer: 'exquisite / delicious',
      correct_answer: 'weird / strange',
      explanation: 'Em português, esquisito significa estranho ou bizarro, não delicioso.',
    });

    expect(mistakeId).toBeDefined();

    // Fetch all mistakes
    const allMistakes = await getMistakes('pt');
    expect(allMistakes.length).toBe(1);
    expect(allMistakes[0].error_category).toBe('false_friend');
    expect(allMistakes[0].is_resolved).toBe(false);

    // Filter by specific category
    const falseFriends = await getMistakes('pt', 'false_friend');
    expect(falseFriends.length).toBe(1);

    const grammarMistakes = await getMistakes('pt', 'grammar');
    expect(grammarMistakes.length).toBe(0);

    // Mark as resolved
    await resolveMistake(mistakeId);
    const resolvedList = await getMistakes('pt');
    expect(resolvedList[0].is_resolved).toBe(true);
    expect(resolvedList[0].reviewed_count).toBe(1);

    // Delete mistake
    await deleteMistake(mistakeId);
    const afterDelete = await getMistakes('pt');
    expect(afterDelete.length).toBe(0);
  });

  it('saves and manages offline phrasebook words with translation', async () => {
    const wordId = await savePhrasebookWord({
      user_id: 'learner_1',
      source_text: 'desembaraço',
      translated_text: 'customs clearance / agility',
      source_lang: 'pt',
      target_lang: 'en',
      part_of_speech: 'noun',
      is_verified: true,
    });

    expect(wordId).toBeDefined();

    const phrasebook = await getPhrasebookWords('en');
    expect(phrasebook.length).toBe(1);
    expect(phrasebook[0].source_text).toBe('desembaraço');
    expect(phrasebook[0].translated_text).toBe('customs clearance / agility');

    // Delete word
    await deletePhrasebookWord(wordId);
    const afterDelete = await getPhrasebookWords('en');
    expect(afterDelete.length).toBe(0);
  });

  it('estimates storage usage and exports offline IndexedDB data', async () => {
    // Estimate should return valid numbers
    const estimate = await estimateStorageUsage();
    expect(estimate).toHaveProperty('usedBytes');
    expect(estimate).toHaveProperty('quotaBytes');
    expect(estimate).toHaveProperty('percentUsed');

    // Export should return structured object
    const exported = await exportAllIndexedDBData();
    expect(exported).toHaveProperty('cachedLessons');
    expect(exported).toHaveProperty('activeProgress');
    expect(exported).toHaveProperty('mistakes');
    expect(exported).toHaveProperty('savedVocabulary');
  });
});
