/**
 * Local Offline Trilingual Translation Provider
 * Zero external network calls. Always available offline fallback.
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError } from '../types';
import { normalizeTranslation } from '../../normalization/responseNormalizers';
import { NormalizedTranslationResult } from '../../../integrations/external-apis/core/types';
import { localDb } from '../../localDb';
import { contentAccess } from '../../contentAccess';

export class LocalTranslationProvider extends BaseProvider<{ text: string; sourceLang: string; targetLang: string }, NormalizedTranslationResult> {
  public readonly metadata: ProviderMetadata = {
    id: 'local_translation',
    name: 'Local Cached & Generated Translation Store',
    description: 'Uses previously cached translations, saved phrasebook entries, and published AI Content Engine vocabulary offline.',
    category: 'translation',
    attribution: 'Lexilume Local Cache & Content Engine',
    license: 'CC-BY-SA 4.0',
    isPaid: false,
    requiresKey: false,
  };

  protected validateInput(input: { text: string; sourceLang: string; targetLang: string }): void {
    if (!input.text || input.text.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'Translation text cannot be empty.');
    }
  }

  protected generateCacheKey(input: { text: string; sourceLang: string; targetLang: string }): string {
    return `${input.sourceLang.toLowerCase()}:${input.targetLang.toLowerCase()}:${input.text.trim().toLowerCase()}`;
  }

  protected async fetchRaw(input: { text: string; sourceLang: string; targetLang: string }): Promise<unknown> {
    const term = input.text.trim().toLowerCase();

    // 1. Check user saved phrasebook in IndexedDB
    try {
      const saved = await localDb.savedVocabulary.toArray();
      const matchSaved = saved.find(
        s =>
          s.source_text.trim().toLowerCase() === term &&
          s.source_lang === input.sourceLang &&
          s.target_lang === input.targetLang
      );
      if (matchSaved) {
        return {
          translatedText: matchSaved.translated_text,
          match: 1.0,
          verified: matchSaved.is_verified ?? true,
        };
      }
    } catch {
      // IndexedDB unavailable in some environments
    }

    // 2. Check published AI Content Engine vocabulary
    try {
      const generatedVocab = await contentAccess.getPublishedVocabularyEntries(
        input.sourceLang,
        input.targetLang
      );
      const matchGen = generatedVocab.find(v => v.lemma.trim().toLowerCase() === term);
      if (matchGen) {
        const translated =
          matchGen.translations[input.targetLang as keyof typeof matchGen.translations] ||
          matchGen.definitions[input.targetLang as keyof typeof matchGen.definitions];
        if (translated) {
          return {
            translatedText: translated,
            match: 1.0,
            verified: true,
          };
        }
      }
    } catch {
      // Ignore offline store error
    }

    throw new Error(`No cached or generated translation found offline for "${input.text}".`);
  }

  protected normalize(raw: any, input: { text: string; sourceLang: string; targetLang: string }): NormalizedTranslationResult {
    return normalizeTranslation(
      raw.translatedText,
      input.sourceLang,
      input.targetLang,
      this.metadata.id,
      {
        isVerified: Boolean(raw.verified),
        isApproximate: !raw.verified,
        matchConfidence: raw.match ?? 1.0,
        notes: 'Resolved from cached or AI-generated vocabulary.',
      }
    );
  }
}
