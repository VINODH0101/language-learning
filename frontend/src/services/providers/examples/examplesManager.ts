/**
 * Example Sentences Manager
 * Combines Tatoeba verified examples with OPUS parallel corpora.
 */

import { TatoebaProvider, TatoebaSearchInput } from './tatoebaProvider';
import { OpusProvider, OpusSearchInput } from './opusProvider';
import { NormalizedSentencePair } from '../../normalization/responseNormalizers';

export class ExamplesManager {
  private static instance: ExamplesManager;
  private tatoeba = new TatoebaProvider();
  private opus = new OpusProvider();

  private constructor() {}

  public static getInstance(): ExamplesManager {
    if (!ExamplesManager.instance) {
      ExamplesManager.instance = new ExamplesManager();
    }
    return ExamplesManager.instance;
  }

  public async getExamples(input: TatoebaSearchInput): Promise<NormalizedSentencePair[]> {
    try {
      const results = await this.tatoeba.execute(input);
      if (results.length > 0) return results;
    } catch (err) {
      console.warn('[ExamplesManager] Tatoeba request failed, falling back to OPUS...', err);
    }

    try {
      const opusResults = await this.opus.execute({
        query: input.query,
        sourceLang: input.sourceLang,
        targetLang: input.targetLang,
        limit: input.limit,
      });
      return opusResults;
    } catch (err) {
      console.warn('[ExamplesManager] OPUS request also failed:', err);
      return [];
    }
  }
}
