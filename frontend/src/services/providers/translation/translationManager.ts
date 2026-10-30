/**
 * Translation Cascade Manager
 * Orchestrates MyMemory -> LibreTranslate -> Local Translation Fallback.
 */

import { MyMemoryProvider } from './mymemoryProvider';
import { LibreTranslateProvider } from './libretranslateProvider';
import { LocalTranslationProvider } from './localTranslationProvider';
import { NormalizedTranslationResult } from '../../../integrations/external-apis/core/types';

export class TranslationManager {
  private static instance: TranslationManager;
  private myMemory = new MyMemoryProvider();
  private libreTranslate = new LibreTranslateProvider();
  private local = new LocalTranslationProvider();

  private constructor() {}

  public static getInstance(): TranslationManager {
    if (!TranslationManager.instance) {
      TranslationManager.instance = new TranslationManager();
    }
    return TranslationManager.instance;
  }

  public async translate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<NormalizedTranslationResult> {
    const input = { text, sourceLang, targetLang };

    // 1. Try MyMemory
    try {
      return await this.myMemory.execute(input);
    } catch (myMemoryErr) {
      console.warn('[TranslationManager] MyMemory unavailable, trying LibreTranslate fallback...', myMemoryErr);
    }

    // 2. Try LibreTranslate
    try {
      return await this.libreTranslate.execute(input);
    } catch (libreErr) {
      console.warn('[TranslationManager] LibreTranslate unavailable, trying Local fallback...', libreErr);
    }

    // 3. Guaranteed Local Fallback
    return await this.local.execute(input);
  }
}
