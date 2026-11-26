import { CEFRLevel } from '../../types';
import { ContentItem } from '../../types/contentCentred';
import { ProviderHealthRecord } from '../../services/monitoring/providerHealth';
import { ApiRegistry } from '../../integrations/external-apis/core/ApiRegistry';

export interface LiveCefrAuditMetric {
  level: CEFRLevel;
  vocab: number;
  passages: number;
  exercises: number;
  statusKey: string;
  statusFallback: string;
}

export interface LiveSourceInventoryItem {
  id: string;
  name: string;
  category: string;
  attribution: string;
  status: string;
  totalRequests: number;
}

const AUDIT_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

/**
 * Computes genuine CEFR coverage counts strictly from live published AI Content Engine items.
 */
export function computeLiveCefrAudit(publishedItems: ContentItem[] = []): LiveCefrAuditMetric[] {
  return AUDIT_LEVELS.map(level => {
    const levelItems = publishedItems.filter(it => it.primary_cefr === level);
    const vocab = levelItems.filter(it => it.content_type === 'vocabulary').length;
    const passages = levelItems.filter(
      it =>
        it.content_type !== 'vocabulary' &&
        it.content_type !== 'practice' &&
        it.content_type !== 'grammar'
    ).length;
    const exercises = levelItems.filter(
      it =>
        it.content_type === 'practice' ||
        it.content_type === 'grammar' ||
        it.genre === 'grammar_in_action'
    ).length;

    const total = vocab + passages + exercises;
    let statusKey = 'admin:cefr_status_empty';
    let statusFallback = 'Insufficient';
    if (total >= 6) {
      statusKey = 'admin:cefr_status_excellent';
      statusFallback = 'Excellent';
    } else if (total > 0) {
      statusKey = 'admin:cefr_status_ok';
      statusFallback = 'Compliant';
    }

    return {
      level,
      vocab,
      passages,
      exercises,
      statusKey,
      statusFallback,
    };
  });
}

/**
 * Computes live external source and dataset inventory from ProviderHealthTracker and ApiRegistry.
 */
export function getLiveSourceInventory(
  healthRecords: ProviderHealthRecord[] = []
): LiveSourceInventoryItem[] {
  const registeredProviders = ApiRegistry.getInstance().getAllProviders();
  const byId = new Map<string, LiveSourceInventoryItem>();

  for (const rec of healthRecords) {
    byId.set(rec.providerId, {
      id: rec.providerId,
      name: rec.name,
      category: rec.category,
      attribution: rec.providerId,
      status: rec.status,
      totalRequests: rec.totalRequests,
    });
  }

  for (const reg of registeredProviders) {
    const existing = byId.get(reg.metadata.id);
    if (existing) {
      existing.attribution = reg.metadata.attribution || existing.attribution;
      existing.totalRequests = Math.max(existing.totalRequests, reg.metrics.totalRequests);
    } else {
      byId.set(reg.metadata.id, {
        id: reg.metadata.id,
        name: reg.metadata.name,
        category: reg.metadata.type,
        attribution: reg.metadata.attribution || reg.metadata.id,
        status: reg.status,
        totalRequests: reg.metrics.totalRequests,
      });
    }
  }

  return Array.from(byId.values());
}
