/**
 * Frequency Ranking Manager
 * Provides word frequency data to prioritize high-yield vocabulary without conflating rank with CEFR level.
 */

import { FrequencyWordsProvider, FrequencyQueryInput } from './frequencyWordsProvider';
import { NormalizedFrequencyItem } from '../../normalization/responseNormalizers';

export class FrequencyManager {
  private static instance: FrequencyManager;
  private provider = new FrequencyWordsProvider();

  private constructor() {}

  public static getInstance(): FrequencyManager {
    if (!FrequencyManager.instance) {
      FrequencyManager.instance = new FrequencyManager();
    }
    return FrequencyManager.instance;
  }

  public async getWordFrequency(input: FrequencyQueryInput): Promise<NormalizedFrequencyItem> {
    return await this.provider.execute(input);
  }
}
