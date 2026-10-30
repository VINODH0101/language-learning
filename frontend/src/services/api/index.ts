/**
 * Reusable API Services & Registry Facade
 */

export * from './interfaces';
export { DictionaryService } from '../dictionaryService';
export { ProofreadingService } from '../proofreadingService';
export { CultureService } from '../cultureService';
export { ReadingService } from '../readingService';
export { TranslationService } from '../translate';
export * from '../providers';
export { initializeExternalApiRegistry, resetExternalApiRegistryForTesting } from '../../integrations/external-apis';
