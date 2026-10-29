/**
 * Central API Registry for provider registration, discovery, health tracking, and dispatching.
 */

import { BaseApiProvider } from './ApiProvider';
import { ProviderMetadata, ProviderMetrics, ProviderStatus, ProviderType } from './types';

export interface ProviderRegistrationInfo {
  metadata: ProviderMetadata;
  status: ProviderStatus;
  metrics: ProviderMetrics;
  isEnabled: boolean;
}

export class ApiRegistry {
  private static instance: ApiRegistry;
  private providers: Map<string, BaseApiProvider<unknown, unknown>> = new Map();
  private enabledStates: Map<string, boolean> = new Map();

  private constructor() {}

  public static getInstance(): ApiRegistry {
    if (!ApiRegistry.instance) {
      ApiRegistry.instance = new ApiRegistry();
    }
    return ApiRegistry.instance;
  }

  public register(provider: BaseApiProvider<unknown, unknown>): void {
    this.providers.set(provider.metadata.id, provider);
    if (!this.enabledStates.has(provider.metadata.id)) {
      this.enabledStates.set(provider.metadata.id, true);
    }
  }

  public getProvider<TInput, TOutput>(
    id: string
  ): BaseApiProvider<TInput, TOutput> | undefined {
    return this.providers.get(id) as BaseApiProvider<TInput, TOutput> | undefined;
  }

  public getProvidersByType(type: ProviderType): BaseApiProvider<unknown, unknown>[] {
    const list: BaseApiProvider<unknown, unknown>[] = [];
    for (const [id, provider] of this.providers.entries()) {
      if (provider.metadata.type === type && this.isEnabled(id)) {
        list.push(provider);
      }
    }
    return list;
  }

  public setEnabled(id: string, enabled: boolean): void {
    this.enabledStates.set(id, enabled);
  }

  public isEnabled(id: string): boolean {
    return this.enabledStates.get(id) ?? true;
  }

  public getAllProviders(): ProviderRegistrationInfo[] {
    const infos: ProviderRegistrationInfo[] = [];
    for (const [id, provider] of this.providers.entries()) {
      infos.push({
        metadata: provider.metadata,
        status: provider.status,
        metrics: { ...provider.metrics },
        isEnabled: this.isEnabled(id),
      });
    }
    return infos;
  }

  public getHealthSummary(): {
    total: number;
    ready: number;
    degraded: number;
    offline: number;
    error: number;
    totalRequests: number;
  } {
    let ready = 0;
    let degraded = 0;
    let offline = 0;
    let error = 0;
    let totalRequests = 0;

    for (const provider of this.providers.values()) {
      totalRequests += provider.metrics.totalRequests;
      switch (provider.status) {
        case 'ready':
          ready++;
          break;
        case 'degraded':
          degraded++;
          break;
        case 'offline':
          offline++;
          break;
        case 'error':
          error++;
          break;
        default:
          ready++;
          break;
      }
    }

    return {
      total: this.providers.size,
      ready,
      degraded,
      offline,
      error,
      totalRequests,
    };
  }

  /**
   * Clear registry (useful for testing).
   */
  public reset(): void {
    this.providers.clear();
    this.enabledStates.clear();
  }
}
