import { describe, it, expect, beforeEach } from 'vitest';
import { contentPipelineService } from '../services/contentPipelineService';
import { contentCentredService } from '../services/contentCentredService';

describe('Lexilume Content-Centred Pipeline (Phase 7)', () => {
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
});
