import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { contentPipelineService } from '../services/contentPipelineService';
import { contentCentredService } from '../services/contentCentredService';
import { authService } from '../services/auth';
import { saveProcessingJobLocal } from '../services/localDb';

describe('Lexilume Content-Centred Pipeline (Phase 7)', () => {
  beforeEach(async () => {
    await authService.signIn('admin@polyglot.dev', 'AdminPass123!');
  });

  afterEach(async () => {
    await authService.signOut();
  });
  const sampleDublinText = `
The barista poured the velvety flat white into a warm ceramic cup with gentle precision.
Outside, morning rain tapped rhythmic patterns against the tall Victorian window panes.

Commuters shook their umbrellas near the doorway, greeting the owner with warm familiar smiles.
The rich aroma of freshly roasted Ethiopian beans filled the room, offering comfort from the chilly Dublin breeze.
`;

  it('executes 8-stage pedagogical pipeline on authentic text', async () => {
    const result = await contentPipelineService.executePipeline({
      title: 'A Morning Coffee in Dublin',
      rawText: sampleDublinText,
      targetLanguage: 'en',
      explanationLanguage: 'pt',
      genre: 'culture_and_travel',
      declaredCefr: 'B1',
      sourceAttribution: 'Authentic narrative',
      rightsStatus: 'public_domain',
    });

    expect(result.item).toBeDefined();
    expect(result.item.title).toBe('A Morning Coffee in Dublin');
    expect(result.item.status).toBe('review_required');
    expect(result.item.target_language).toBe('en');
    expect(result.item.explanation_language).toBe('pt');

    expect(result.version).toBeDefined();
    expect(result.version.version_number).toBe(1);
    expect(result.version.is_published).toBe(false);
    expect(result.version.structured_payload.paragraphs.length).toBe(2);
    expect(result.version.structured_payload.paragraphs[0].sentences.length).toBe(2);
    expect(Object.keys(result.version.structured_payload.annotations).length).toBeGreaterThan(0);

    expect(result.activities.length).toBe(1);
    const questions = result.activities[0].configuration.questions;
    expect(questions.length).toBeGreaterThanOrEqual(2);
    expect(questions[0].correct_answer).toBeTruthy();

    expect(result.job.status).toBe('completed');
    expect(result.job.stages_completed.length).toBe(9); // stages 0 through 8
  });

  it('rejects texts under 15 words with informative validation error', async () => {
    await expect(
      contentPipelineService.executePipeline({
        title: 'Too Short',
        rawText: 'Hello there world.',
        targetLanguage: 'en',
        explanationLanguage: 'en',
        genre: 'conversation',
      })
    ).rejects.toThrow(/at least 15 words/);
  });

  it('supports stage-level retry and preserves previous job status', async () => {
    const result = await contentPipelineService.executePipeline({
      title: 'Retry Test Story',
      rawText: sampleDublinText,
      targetLanguage: 'en',
      explanationLanguage: 'es',
      genre: 'short_story',
    });

    const retried = await contentPipelineService.retryStage(result.job.id, 'stage_5_extract_lexicon');
    expect(retried.status).toBe('completed');
    expect(retried.retry_count).toBe(1);
  });

  it('4. Enforces copyright rights validation and fair use declaration (RISK-805)', async () => {
    // Restricted rights without fair use declaration must be rejected
    await expect(
      contentPipelineService.executePipeline({
        title: 'Restricted Copyright Book Excerpt',
        rawText: sampleDublinText,
        targetLanguage: 'en',
        explanationLanguage: 'pt',
        genre: 'literature',
        rightsStatus: 'restricted',
        educationalFairUseConfirmed: false,
      })
    ).rejects.toThrow(/Copyright rights validation failed/i);

    // Restricted rights WITH explicit educational fair use confirmation must succeed
    const fairUseResult = await contentPipelineService.executePipeline({
      title: 'Fair Use Pedagogical Excerpt',
      rawText: sampleDublinText,
      targetLanguage: 'en',
      explanationLanguage: 'pt',
      genre: 'literature',
      rightsStatus: 'restricted',
      educationalFairUseConfirmed: true,
    });

    expect(fairUseResult.item).toBeDefined();
    expect(fairUseResult.item.title).toBe('Fair Use Pedagogical Excerpt');
    expect(fairUseResult.job.status).toBe('completed');
  });

  it('5. Recovers interrupted in-flight jobs stuck in running state (RISK-805)', async () => {
    const crashedJobId = `job_crashed_${Date.now()}`;
    await saveProcessingJobLocal({
      id: crashedJobId,
      content_item_id: 'ci_mock_crashed',
      version_number: 1,
      status: 'running',
      current_stage: 'stage_3_segment',
      stages_completed: ['stage_0_intake', 'stage_1_detect_lang', 'stage_2_classify'],
      stage_outputs: {},
      stage_timings: {},
      retry_count: 0,
      started_at: new Date(Date.now() - 60000).toISOString(),
      created_at: new Date(Date.now() - 60000).toISOString(),
      updated_at: new Date(Date.now() - 60000).toISOString(),
    });

    // Run recovery
    const recovered = await contentPipelineService.recoverInterruptedJobs();
    const found = recovered.find(j => j.id === crashedJobId);
    expect(found).toBeDefined();
    expect(found?.status).toBe('failed');
    expect(found?.error_message).toContain('interrupted');

    // And verify it can now be retried from its current stage
    const retried = await contentPipelineService.retryStage(crashedJobId, 'stage_3_segment');
    expect(retried.status).toBe('completed');
  });
});
