import { describe, it, expect } from 'vitest';
import { contentPipelineService } from '../services/contentPipelineService';
import { contentCentredService } from '../services/contentCentredService';

describe('Lexilume Phase 7 — Full End-to-End Pipeline & Learner Flow (Milestone 7.9)', () => {
  const learnerUserId = 'usr_learner_tester_02';

  it('executes full workflow: Admin Import -> Pipeline -> Publication -> Learner Reader -> Word Lookup -> SM-2 Review -> Mistake Notebook', async () => {
    // ------------------------------------------------------------------------
    // STAGE 1 & 2: Admin Imports Raw Text & 8-Stage Pedagogical Pipeline Runs
    // ------------------------------------------------------------------------
    const pipelineResult = await contentPipelineService.executePipeline({
      title: 'Uma Tarde no Mercado do Bolhão',
      rawText: 'O Mercado do Bolhão é um dos edifícios mais emblemáticos da cidade do Porto. As vendedoras oferecem frutas frescas e peixe do dia com muita simpatia e alegria nas manhãs de sábado.',
      targetLanguage: 'pt',
      explanationLanguage: 'en',
      genre: 'culture_and_travel',
      rightsStatus: 'public_domain',
      author: 'Porto Cultural Heritage Archive',
      sourceUrl: 'https://bolhao.porto.pt/historia',
      declaredCefr: 'B1',
    });

    expect(pipelineResult.job.status).toBe('completed');
    expect(pipelineResult.job.stages_completed.length).toBeGreaterThanOrEqual(8);
    expect(pipelineResult.item.title).toBe('Uma Tarde no Mercado do Bolhão');
    expect(pipelineResult.version.is_published).toBe(false);

    const createdItem = pipelineResult.item;
    const draftVersion = pipelineResult.version;

    // ------------------------------------------------------------------------
    // STAGE 3: Admin Review & Immutable Publication
    // ------------------------------------------------------------------------
    await contentCentredService.publishContentVersion(createdItem.id, draftVersion.id);

    const publishedItem = await contentCentredService.getContentItemById(createdItem.id);
    expect(publishedItem?.status).toBe('published');
    expect(publishedItem?.current_version_id).toBe(draftVersion.id);

    // ------------------------------------------------------------------------
    // STAGE 4: Learner Browses Catalog & Progress Telemetry
    // ------------------------------------------------------------------------
    const publishedItems = await contentCentredService.getContentItems({ target_language: 'pt' });
    const foundInCatalog = publishedItems.find(it => it.id === createdItem.id);
    expect(foundInCatalog).toBeDefined();

    // Learner starts reading
    const initialProgress = await contentCentredService.updateLearnerProgress({
      user_id: learnerUserId,
      content_item_id: createdItem.id,
      content_version_id: draftVersion.id,
      percent_complete: 50,
      time_spent_seconds: 120,
    });
    expect(initialProgress.percent_complete).toBe(50);
    expect(initialProgress.status).toBe('in_progress');

    // ------------------------------------------------------------------------
    // STAGE 5: Contextual Vocabulary Lookup & SM-2 Scheduling
    // ------------------------------------------------------------------------
    // Learner encounters and saves "emblemáticos"
    const savedWord = await contentCentredService.saveUserWord({
      user_id: learnerUserId,
      target_language: 'pt',
      explanation_language: 'en',
      term: 'emblemáticos',
      lemma: 'emblemático',
      pos: 'adjective',
      cefr_level: 'B1',
      definition: 'Serving as a symbol of a particular quality or concept.',
      context_sentence: 'O Mercado do Bolhão é um dos edifícios mais emblemáticos da cidade do Porto.',
      source_content_id: createdItem.id,
      source_version_id: draftVersion.id,
    });

    expect(savedWord.ease_factor).toBe(2.5);
    expect(savedWord.interval_days).toBe(0);
    expect(savedWord.state).toBe('learning');

    // Learner reviews word with SM-2 rating 4 (Good recall)
    const reviewedWord = await contentCentredService.recordWordReview(learnerUserId, savedWord.id, 4);
    expect(reviewedWord.interval_days).toBe(1);
    expect(reviewedWord.repetitions).toBe(1);
    expect(reviewedWord.state).toBe('learning');

    // ------------------------------------------------------------------------
    // STAGE 6: Comprehension Evaluation & Mistake Notebook Remediation
    // ------------------------------------------------------------------------
    // Learner completes comprehension activity with an incorrect response
    const mistake = await contentCentredService.recordUserMistake({
      user_id: learnerUserId,
      content_item_id: createdItem.id,
      content_version_id: draftVersion.id,
      activity_type: 'reading_comprehension',
      error_category: 'comprehension_inference',
      stimulus: 'O que oferecem as vendedoras no Mercado do Bolhão?',
      user_response: 'Carros e roupas usadas',
      correct_response: 'Frutas frescas e peixe do dia',
      pedagogical_explanation: 'O texto esclarece que as vendedoras oferecem frutas frescas e peixe do dia com muita simpatia.',
    });

    expect(mistake.status).toBe('unresolved');
    expect(mistake.occurrences_count).toBe(1);

    // Learner reviews and masters the mistake
    const masteredMistake = await contentCentredService.resolveUserMistake(mistake.id, 'mastered');
    expect(masteredMistake.status).toBe('mastered');
    expect(masteredMistake.resolved_at).toBeDefined();

    // Finalize content progress
    const finalizedProgress = await contentCentredService.updateLearnerProgress({
      user_id: learnerUserId,
      content_item_id: createdItem.id,
      percent_complete: 100,
      comprehension_score: 0.85,
      status: 'completed',
    });
    expect(finalizedProgress.percent_complete).toBe(100);
    expect(finalizedProgress.status).toBe('completed');
  });
});
