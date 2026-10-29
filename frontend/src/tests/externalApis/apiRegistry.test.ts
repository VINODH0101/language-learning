import { describe, it, expect, beforeEach } from 'vitest';
import { ApiRegistry } from '../../integrations/external-apis/core/ApiRegistry';
import { initializeExternalApiRegistry, resetExternalApiRegistryForTesting } from '../../integrations/external-apis';

describe('ApiRegistry Central Layer', () => {
  beforeEach(() => {
    resetExternalApiRegistryForTesting();
  });

  it('initializes and registers all 7 external API adapters', () => {
    const registry = initializeExternalApiRegistry();
    const all = registry.getAllProviders();

    expect(all.length).toBe(7);

    const ids = all.map(p => p.metadata.id);
    expect(ids).toContain('mymemory');
    expect(ids).toContain('free-dictionary');
    expect(ids).toContain('dicionario-aberto');
    expect(ids).toContain('wikipedia');
    expect(ids).toContain('jikan');
    expect(ids).toContain('languagetool');
    expect(ids).toContain('gemini');
  });

  it('filters providers by provider type correctly', () => {
    const registry = initializeExternalApiRegistry();

    const dictProviders = registry.getProvidersByType('dictionary');
    expect(dictProviders.length).toBe(2);
    expect(dictProviders.map(d => d.metadata.id)).toContain('free-dictionary');
    expect(dictProviders.map(d => d.metadata.id)).toContain('dicionario-aberto');

    const readingProviders = registry.getProvidersByType('reading');
    expect(readingProviders.length).toBe(1);
    expect(readingProviders[0].metadata.id).toBe('wikipedia');

    const proofreadingProviders = registry.getProvidersByType('proofreading');
    expect(proofreadingProviders.length).toBe(1);
    expect(proofreadingProviders[0].metadata.id).toBe('languagetool');
  });

  it('supports enabling and disabling individual providers dynamically', () => {
    const registry = initializeExternalApiRegistry();

    expect(registry.isEnabled('jikan')).toBe(true);
    registry.setEnabled('jikan', false);
    expect(registry.isEnabled('jikan')).toBe(false);

    // Filter should exclude disabled providers
    const cultureProviders = registry.getProvidersByType('culture');
    expect(cultureProviders.find(p => p.metadata.id === 'jikan')).toBeUndefined();

    registry.setEnabled('jikan', true);
    expect(registry.isEnabled('jikan')).toBe(true);
  });

  it('computes accurate health summary metrics', () => {
    const registry = initializeExternalApiRegistry();
    const health = registry.getHealthSummary();

    expect(health.total).toBe(7);
    expect(health.ready).toBe(7);
    expect(health.degraded).toBe(0);
    expect(health.offline).toBe(0);
  });
});
