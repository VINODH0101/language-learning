import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { contentCentredService } from '../services/contentCentredService';
import { contentPipelineService } from '../services/contentPipelineService';
import { authService } from '../services/auth';

describe('Lexilume Authentication, Authorization & RLS Security Suite (Milestone 8.2)', () => {
  beforeEach(async () => {
    await authService.signOut();
  });

  afterEach(async () => {
    await authService.signOut();
  });

  describe('1. Content Catalog Admin Authorization (RISK-802)', () => {
    it('blocks unauthenticated/guest users from creating or publishing content items', async () => {
      // Guest role by default
      expect(authService.getState().role).toBe('guest');

      await expect(
        contentCentredService.saveContentItem({
          title: 'Unauthorized Content',
          target_language: 'pt',
        })
      ).rejects.toThrow(/Administrative privileges required/i);

      await expect(
        contentCentredService.saveContentVersion({
          content_item_id: 'any_item',
          version_number: 1,
        })
      ).rejects.toThrow(/Administrative privileges required/i);

      await expect(
        contentCentredService.publishContentVersion('any_item', 'v1')
      ).rejects.toThrow(/Administrative privileges required/i);

      await expect(
        contentCentredService.saveLearningActivity({
          content_version_id: 'v1',
          activity_type: 'reading_comprehension',
        })
      ).rejects.toThrow(/Administrative privileges required/i);
    });

    it('blocks standard learners (role="user") from creating content or triggering pipeline', async () => {
      await authService.signIn('learner@polyglot.dev', 'LearnerPass123!');
      expect(authService.getState().role).toBe('user');

      await expect(
        contentCentredService.saveContentItem({
          title: 'Learner Tampered Content',
          target_language: 'es',
        })
      ).rejects.toThrow(/Administrative privileges required/i);

      await expect(
        contentPipelineService.executePipeline({
          title: 'Learner Triggered Pipeline',
          rawText: 'This is a sample text that should not be processed by standard learners without admin privilege.',
          targetLanguage: 'en',
          explanationLanguage: 'es',
          genre: 'short_story',
        })
      ).rejects.toThrow(/Administrative privileges required/i);
    });

    it('allows verified administrator to modify catalog and run pipeline', async () => {
      await authService.signIn('admin@polyglot.dev', 'AdminPass123!');
      expect(authService.getState().role).toBe('admin');

      const item = await contentCentredService.saveContentItem({
        title: 'Admin Authorized Content',
        target_language: 'pt',
        status: 'draft',
      });
      expect(item.id).toBeDefined();
      expect(item.title).toBe('Admin Authorized Content');

      const version = await contentCentredService.saveContentVersion({
        content_item_id: item.id,
        version_number: 1,
        is_published: false,
        structured_payload: {
          title: item.title,
          paragraphs: [],
          annotations: {},
          grammar_points: [],
        },
      });
      expect(version.id).toBeDefined();
    });
  });

  describe('2. Multi-Tenant Account & Data Isolation (AGENTS.md Invariant 4)', () => {
    const learnerAId = 'usr_learner_002'; // Maria Silva
    const learnerBId = 'usr_learner_999';

    beforeEach(async () => {
      await authService.signIn('learner@polyglot.dev', 'LearnerPass123!');
      expect(authService.getState().user?.id).toBe(learnerAId);
    });

    it('blocks Learner A from accessing or mutating Learner B progress records', async () => {
      // Learner A accessing Learner B progress
      await expect(
        contentCentredService.getLearnerProgress(learnerBId, 'item_123')
      ).rejects.toThrow(/Cross-tenant access violation/i);

      await expect(
        contentCentredService.getAllLearnerProgress(learnerBId)
      ).rejects.toThrow(/Cross-tenant access violation/i);

      await expect(
        contentCentredService.updateLearnerProgress({
          user_id: learnerBId,
          content_item_id: 'item_123',
          percent_complete: 100,
        })
      ).rejects.toThrow(/Cross-tenant access violation/i);

      // But Learner A can access their own progress
      const ownProgress = await contentCentredService.updateLearnerProgress({
        user_id: learnerAId,
        content_item_id: 'item_123',
        percent_complete: 25,
      });
      expect(ownProgress.user_id).toBe(learnerAId);
    });

    it('blocks Learner A from reading or modifying Learner B saved vocabulary', async () => {
      // Attempting to read Learner B words
      await expect(
        contentCentredService.getUserSavedWords(learnerBId, 'pt')
      ).rejects.toThrow(/Cross-tenant access violation/i);

      // Attempting to save word under Learner B
      await expect(
        contentCentredService.saveUserWord({
          user_id: learnerBId,
          term: 'saudade',
          lemma: 'saudade',
          target_language: 'pt',
          explanation_language: 'pt',
          definition: 'Sentimento nostálgico.',
        })
      ).rejects.toThrow(/Cross-tenant access violation/i);

      // Attempting to submit SRS review for Learner B
      await expect(
        contentCentredService.recordWordReview(learnerBId, 'word_123', 5)
      ).rejects.toThrow(/Cross-tenant access violation/i);

      // Learner A can manage their own words
      const ownWord = await contentCentredService.saveUserWord({
        user_id: learnerAId,
        term: 'fado',
        lemma: 'fado',
        target_language: 'pt',
        explanation_language: 'pt',
        definition: 'Canção tradicional portuguesa.',
      });
      expect(ownWord.user_id).toBe(learnerAId);
    });

    it('blocks Learner A from reading or recording mistakes for Learner B', async () => {
      await expect(
        contentCentredService.getUserMistakes(learnerBId)
      ).rejects.toThrow(/Cross-tenant access violation/i);

      await expect(
        contentCentredService.recordUserMistake({
          user_id: learnerBId,
          stimulus: 'O que significa fado?',
          user_response: 'Musica pop',
          correct_response: 'Musica tradicional',
          pedagogical_explanation: 'O fado é tradicional.',
        })
      ).rejects.toThrow(/Cross-tenant access violation/i);
    });

    it('allows System Administrator to inspect cross-tenant records', async () => {
      await authService.signIn('admin@polyglot.dev', 'AdminPass123!');
      expect(authService.getState().role).toBe('admin');

      // Admin can query learner A progress and words without violation
      const words = await contentCentredService.getUserSavedWords(learnerAId);
      expect(Array.isArray(words)).toBe(true);

      const progress = await contentCentredService.getAllLearnerProgress(learnerAId);
      expect(Array.isArray(progress)).toBe(true);
    });
  });
});
