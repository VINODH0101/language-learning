/**
 * External API Adapters export & central registration bootstrap.
 */

import { ApiRegistry } from '../core/ApiRegistry';
import { MyMemoryAdapter } from './mymemory/MyMemoryAdapter';
import { FreeDictionaryAdapter } from './free-dictionary/FreeDictionaryAdapter';
import { DicionarioAbertoAdapter } from './dicionario-aberto/DicionarioAbertoAdapter';
import { WikipediaAdapter } from './wikipedia/WikipediaAdapter';
import { JikanAdapter } from './jikan/JikanAdapter';
import { LanguageToolAdapter } from './languagetool/LanguageToolAdapter';
import { GeminiAdapter } from './gemini/GeminiAdapter';

export * from './mymemory/MyMemoryAdapter';
export * from './free-dictionary/FreeDictionaryAdapter';
export * from './dicionario-aberto/DicionarioAbertoAdapter';
export * from './wikipedia/WikipediaAdapter';
export * from './jikan/JikanAdapter';
export * from './languagetool/LanguageToolAdapter';
export * from './gemini/GeminiAdapter';

let isInitialized = false;

export function initializeExternalApiRegistry(): ApiRegistry {
  const registry = ApiRegistry.getInstance();

  if (isInitialized && registry.getAllProviders().length > 0) {
    return registry;
  }

  // Register all 7 providers
  registry.register(new MyMemoryAdapter());
  registry.register(new FreeDictionaryAdapter());
  registry.register(new DicionarioAbertoAdapter());
  registry.register(new WikipediaAdapter());
  registry.register(new JikanAdapter());
  registry.register(new LanguageToolAdapter());
  registry.register(new GeminiAdapter());

  isInitialized = true;
  return registry;
}

export function resetExternalApiRegistryForTesting(): void {
  isInitialized = false;
  ApiRegistry.getInstance().reset();
}
