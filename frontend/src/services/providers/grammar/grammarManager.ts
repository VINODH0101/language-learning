/**
 * Grammar Manager
 * Dispatches text for rule-based grammar checking.
 */

import { LanguageToolProvider, GrammarCheckInput } from './languageToolProvider';
import { NormalizedProofreadResult } from '../../../integrations/external-apis/core/types';

export class GrammarManager {
  private static instance: GrammarManager;
  private provider = new LanguageToolProvider();

  private constructor() {}

  public static getInstance(): GrammarManager {
    if (!GrammarManager.instance) {
      GrammarManager.instance = new GrammarManager();
    }
    return GrammarManager.instance;
  }

  public async check(input: GrammarCheckInput): Promise<NormalizedProofreadResult> {
    return await this.provider.execute(input);
  }
}
