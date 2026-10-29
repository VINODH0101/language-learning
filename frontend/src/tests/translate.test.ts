import { describe, it, expect } from 'vitest';
import { TranslationService } from '../services/translate';

describe('TranslationService (Trilingual Learning & Lookup)', () => {
  it('searches Portuguese to English terms', () => {
    const results = TranslationService.search('prerrogativa', 'pt-en');
    expect(results.length).toBeGreaterThan(0);
    const item = results[0];
    expect(item.sourceText).toContain('prerrogativa');
    expect(item.targetText.toLowerCase()).toContain('prerogative');
    expect(item.targetLang).toBe('en');
  });

  it('searches Spanish to English terms', () => {
    const results = TranslationService.search('no obstante', 'es-en');
    expect(results.length).toBeGreaterThan(0);
    const item = results[0];
    expect(item.sourceText).toContain('no obstante');
    expect(item.targetText.toLowerCase()).toContain('nevertheless');
    expect(item.targetLang).toBe('en');
  });

  it('searches English to Portuguese/Spanish with false cognate notes', () => {
    const results = TranslationService.search('actually', 'en-pt');
    expect(results.length).toBeGreaterThan(0);
    const item = results[0];
    expect(item.sourceText).toBe('actually');
    expect(item.targetText).toContain('na verdade');
    expect(item.notes).toContain('atualmente');
  });

  it('retrieves English challenges for Portuguese and Spanish speakers', () => {
    const ptChallenges = TranslationService.getChallenges('pt');
    expect(ptChallenges.length).toBeGreaterThan(0);
    expect(ptChallenges[0].source_lang).toBe('pt');

    const esChallenges = TranslationService.getChallenges('es');
    expect(esChallenges.length).toBeGreaterThan(0);
    expect(esChallenges[0].source_lang).toBe('es');
  });

  it('evaluates English challenge submission correctly with pedagogical feedback', () => {
    const ptChallenge = TranslationService.getChallenges('pt')[0];
    
    // Correct translation
    const correctRes = TranslationService.checkChallenge(
      ptChallenge,
      "Actually, I don't agree with that decision."
    );
    expect(correctRes.isCorrect).toBe(true);

    // Incorrect transfer mistake (using 'Currently' instead of 'Actually')
    const wrongRes = TranslationService.checkChallenge(
      ptChallenge,
      "Currently, I don't agree with that decision."
    );
    expect(wrongRes.isCorrect).toBe(false);
    expect(wrongRes.feedback).toContain('Actually');
  });

  it('rejects translation requests exceeding 1,000 characters', async () => {
    const longText = 'A'.repeat(1005);
    const res = await TranslationService.translateOnline(longText, 'pt', 'en', false);
    expect(res.success).toBe(false);
    expect(res.error).toContain('1.000 caracteres');
  });

  it('prioritizes verified educational dictionary in translateOnline', async () => {
    const res = await TranslationService.translateOnline('prerrogativa', 'pt', 'en', true);
    expect(res.success).toBe(true);
    expect(res.result?.isVerified).toBe(true);
    expect(res.result?.providerName).toBe('dictionary');
    expect(res.result?.translatedText.toLowerCase()).toContain('prerogative');
  });
});
