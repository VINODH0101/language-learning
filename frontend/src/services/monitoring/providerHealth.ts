/**
 * Provider Health Monitoring and Privacy-Preserving Structured Logger
 * Lexilume — Illuminate Your Words
 */

export type ProviderHealthState = 'healthy' | 'degraded' | 'offline' | 'unconfigured';

export interface ProviderHealthRecord {
  providerId: string;
  name: string;
  category: string;
  status: ProviderHealthState;
  averageLatencyMs: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastCheckedAt?: string;
  lastErrorMessage?: string;
}

/**
 * Strips sensitive authentication tokens, API keys, email addresses, and passwords from log strings.
 */
export function sanitizeLog(input: unknown): string {
  if (input === null || input === undefined) return '';
  let str = typeof input === 'string' ? input : JSON.stringify(input);

  // Redact API keys and authorization headers
  str = str.replace(/(api[_-]?key|key|token|auth|secret)=([a-zA-Z0-9_\-]{8,})/gi, '$1=[REDACTED_SECRET]');
  str = str.replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED_TOKEN]');

  // Redact emails
  str = str.replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, '[REDACTED_EMAIL]');

  // Redact password parameters
  str = str.replace(/(password|passwd|pwd)=([^\s&]+)/gi, '$1=[REDACTED_PASSWORD]');

  return str;
}

export class ProviderHealthTracker {
  private static instance: ProviderHealthTracker;
  private records: Map<string, ProviderHealthRecord> = new Map();

  private constructor() {}

  public static getInstance(): ProviderHealthTracker {
    if (!ProviderHealthTracker.instance) {
      ProviderHealthTracker.instance = new ProviderHealthTracker();
    }
    return ProviderHealthTracker.instance;
  }

  public registerProvider(providerId: string, name: string, category: string): void {
    if (!this.records.has(providerId)) {
      this.records.set(providerId, {
        providerId,
        name,
        category,
        status: 'healthy',
        averageLatencyMs: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        lastCheckedAt: new Date().toISOString(),
      });
    }
  }

  public recordSuccess(providerId: string, latencyMs: number): void {
    const record = this.records.get(providerId);
    if (!record) return;

    record.totalRequests++;
    record.successfulRequests++;
    record.lastCheckedAt = new Date().toISOString();
    record.status = 'healthy';

    if (record.averageLatencyMs === 0) {
      record.averageLatencyMs = latencyMs;
    } else {
      record.averageLatencyMs = Math.round((record.averageLatencyMs * (record.totalRequests - 1) + latencyMs) / record.totalRequests);
    }
  }

  public recordFailure(providerId: string, error: unknown, latencyMs: number = 0): void {
    const record = this.records.get(providerId);
    if (!record) return;

    record.totalRequests++;
    record.failedRequests++;
    record.lastCheckedAt = new Date().toISOString();
    record.lastErrorMessage = sanitizeLog(error instanceof Error ? error.message : String(error));

    // Determine degraded vs offline
    const isOffline =
      error instanceof TypeError ||
      (error instanceof Error && error.message.toLowerCase().includes('failed to fetch'));
    record.status = isOffline ? 'offline' : 'degraded';

    console.warn(`[Lexilume Monitor] Provider ${providerId} failure: ${record.lastErrorMessage}`);
  }

  public getStatus(providerId: string): ProviderHealthRecord | undefined {
    return this.records.get(providerId);
  }

  public getAllStatuses(): ProviderHealthRecord[] {
    return Array.from(this.records.values());
  }

  public isProviderHealthy(providerId: string): boolean {
    const record = this.records.get(providerId);
    return !record || record.status === 'healthy';
  }

  public resetForTesting(): void {
    this.records.clear();
  }
}
