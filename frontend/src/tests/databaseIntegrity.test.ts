import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { contentCentredService } from '../services/contentCentredService';
import { validateStructuredPayload, validateActivityConfiguration } from '../types/contentCentred';
import { authService } from '../services/auth';

describe('Lexilume Database Integrity & Immutability Suite (Milestone 8.1)', () => {
  beforeEach(async () => {
    await authService.signIn('admin@polyglot.dev', 'AdminPass123!');
  });

  afterEach(async () => {
    await authService.signOut();
  });
  it('1. Rejects payload alteration on already-published version (RISK-804)', async () => {
    // Create draft version
    const item = await contentCentredService.saveContentItem({
      title: 'Immutability Test Item',
      target_language: 'en',
      status: 'draft',
    });

    const version = await contentCentredService.saveContentVersion({
      content_item_id: item.id,
      version_number: 1,
      is_published: false,
      structured_payload: {
        title: 'Original Title',
        paragraphs: [{ id: 'p1', order: 1, sentences: [{ id: 's1', order: 1, text: 'Hello', tokens: [] }] }],
        annotations: {},
        grammar_points: [],
      },
    });

    // Publish version
    await contentCentredService.publishContentVersion(item.id, version.id);

    // Attempting to modify payload on the published version must throw
    await expect(
      contentCentredService.saveContentVersion({
        id: version.id,
        content_item_id: item.id,
        version_number: 1,
        is_published: true,
        structured_payload: {
          title: 'Tampered Title',
          paragraphs: [],
          annotations: {},
          grammar_points: [],
        },
      })
    ).rejects.toThrow(/Published content versions are immutable/i);
  });

  it('2. JSONB validator rejects malformed and oversized payloads', () => {
    // Null or non-object
    expect(validateStructuredPayload(null).valid).toBe(false);
    expect(validateStructuredPayload('not an object').valid).toBe(false);

    // Missing title
    expect(validateStructuredPayload({ paragraphs: [] }).valid).toBe(false);

    // Missing paragraphs array
    expect(validateStructuredPayload({ title: 'Test' }).valid).toBe(false);

    // Oversized paragraphs array
    const largeParas = Array.from({ length: 250 }, (_, i) => ({ id: `p${i}`, order: i, sentences: [] }));
    const result = validateStructuredPayload({ title: 'Test', paragraphs: largeParas });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('paragraphs limit'))).toBe(true);
  });

  it('3. Activity validator rejects invalid questions', () => {
    // Missing stem
    const invalidConfig = {
      instructions: 'Choose correct',
      questions: [{ id: 'q1', type: 'mc', stem: '', correct_answer: 'A', explanation: '' }],
    };
    expect(validateActivityConfiguration(invalidConfig).valid).toBe(false);

    // Missing correct answer
    const noAnswerConfig = {
      instructions: 'Choose correct',
      questions: [{ id: 'q1', type: 'mc', stem: 'What is this?', correct_answer: '', explanation: '' }],
    };
    expect(validateActivityConfiguration(noAnswerConfig).valid).toBe(false);
  });
});
