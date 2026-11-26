/**
 * Lexilume — Content-Centred Service (Phase 7)
 * 
 * Provides unified, offline-first access to:
 * 1. Authentic Content Items, Versions, and Activities.
 * 2. Learner Content Progress telemetry.
 * 3. Personal Lexicon with SM-2 Spaced Repetition.
 * 4. Pedagogical Mistake Notebook.
 * 
 * Invariants:
 * - Local-First: works seamlessly offline via Dexie v5 and memory fallback.
 * - Cache-Aside: fetches published content from Supabase when connected, caches in Dexie.
 * - Published versions are immutable; updates spawn new draft editions.
 * - Multilingual lemma collision protection.
 */

import {
  ContentItem,
  ContentVersion,
  LearningActivity,
  LearnerContentProgress,
  UserSavedWord,
  UserMistake,
  ContentGenre,
  ContentStatus,
  MistakeStatus,
  ErrorCategory,
  validateStructuredPayload,
  validateActivityConfiguration,
} from '../types/contentCentred';
import { Language, ExplanationLanguage, CEFRLevel } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { generateUuid, isValidUuid } from './uuid';
import {
  localDb,
  cacheContentItemLocal,
  getCachedContentItemsLocal,
  getCachedContentItemLocal,
  saveLearnerProgressLocal,
  getLearnerProgressLocal,
  getAllLearnerProgressLocal,
  saveUserWordLocal,
  getUserSavedWordsLocal,
  saveUserMistakeLocal,
  getUserMistakesLocal,
  getUserMistakeByIdLocal,
} from './localDb';
import { SRSService } from './srs';
import { syncEngine } from './syncEngine';
import { authService } from './auth';

// In-memory registry of items and versions for fast synchronous lookup & offline operation
const localItemsRegistry = new Map<string, ContentItem & { version?: ContentVersion; activities?: LearningActivity[] }>();
const localVersionsRegistry = new Map<string, ContentVersion>();
const localActivitiesRegistry = new Map<string, LearningActivity[]>();

// ============================================================================
// CONTENT CENTRED SERVICE CLASS
// ============================================================================

// Reliable Supabase write helpers: inspect the returned `error` object (not
// only JS exceptions) and skip remote writes whose identifiers are not valid
// UUIDs (e.g. local seed fixtures), keeping local-first data intact.
async function supabaseUpsert(
  table: string,
  payload: any,
  onConflict: string,
  fkFields: string[] = []
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  if (!isValidUuid(payload.id)) {
    console.warn(`[ContentCentredService] Skipping Supabase ${table} upsert: non-UUID id.`);
    return;
  }
  for (const field of fkFields) {
    const value = payload[field];
    if (value && !isValidUuid(value)) {
      console.warn(
        `[ContentCentredService] Skipping Supabase ${table} upsert: non-UUID ${field}.`
      );
      return;
    }
  }
  const { error } = await supabase.from(table as any).upsert(payload, { onConflict });
  if (error) {
    console.warn(`[ContentCentredService] Supabase ${table} upsert error:`, error.message);
  }
}

async function supabaseUpdate(
  table: string,
  values: any,
  eq: { column: string; value: unknown }
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  if (!isValidUuid(eq.value)) {
    console.warn(`[ContentCentredService] Skipping Supabase ${table} update: non-UUID key.`);
    return;
  }
  const { error } = await supabase.from(table as any).update(values).eq(eq.column, eq.value);
  if (error) {
    console.warn(`[ContentCentredService] Supabase ${table} update error:`, error.message);
  }
}

async function supabaseInsert(
  table: string,
  payload: any,
  fkFields: string[] = []
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  for (const field of fkFields) {
    const value = payload[field];
    if (value && !isValidUuid(value)) {
      console.warn(`[ContentCentredService] Skipping Supabase ${table} insert: non-UUID ${field}.`);
      return;
    }
  }
  const { error } = await supabase.from(table as any).insert(payload);
  if (error) {
    console.warn(`[ContentCentredService] Supabase ${table} insert error:`, error.message);
  }
}

export class ContentCentredService {
  private static instance: ContentCentredService;

  private constructor() {
    this.hydrateFromDexie();
  }

  public static getInstance(): ContentCentredService {
    if (!ContentCentredService.instance) {
      ContentCentredService.instance = new ContentCentredService();
    }
    return ContentCentredService.instance;
  }

  /**
   * Clears in-memory item/version/activity registries for isolated test resets.
   */
  public clearLocalRegistries(): void {
    localItemsRegistry.clear();
    localVersionsRegistry.clear();
    localActivitiesRegistry.clear();
  }

  private async hydrateFromDexie(): Promise<void> {
    try {
      const items = await getCachedContentItemsLocal();
      const legacySeedIds = new Set(['ci_coffee_dublin_001', 'ci_mercado_ribeira_002', 'ci_barcelona_gotico_003', 'ci_lisboa_eletrico_004']);
      for (const item of items) {
        if (legacySeedIds.has(item.id)) continue;
        localItemsRegistry.set(item.id, item);
        if (item.version) {
          localVersionsRegistry.set(item.version.id, item.version);
        }
      }
    } catch (e) {
      console.warn('[ContentCentredService] Error hydrating from localDb:', e);
    }
  }

  // ==========================================================================
  // 1. CONTENT CATALOG OPERATIONS
  // ==========================================================================

  public async getContentItems(filters?: {
    target_language?: Language;
    cefr_level?: CEFRLevel;
    genre?: ContentGenre;
    status?: ContentStatus;
  }): Promise<ContentItem[]> {
    let items: ContentItem[] = [];

    // 1. Attempt query from Supabase if online
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('content_items').select('*');
        if (filters?.status) {
          query = query.eq('status', filters.status);
        } else {
          query = query.eq('status', 'published');
        }
        if (filters?.target_language) query = query.eq('target_language', filters.target_language);
        if (filters?.genre) query = query.eq('genre', filters.genre);
        if (filters?.cefr_level) query = query.eq('primary_cefr', filters.cefr_level);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          items = data as ContentItem[];
          for (const it of items) {
            localItemsRegistry.set(it.id, it);
            cacheContentItemLocal(it);
          }
        }
      } catch (err) {
        // Fall back to local
      }
    }

    // 2. Fall back to local registry & Dexie cache
    if (items.length === 0) {
      const allLocal = Array.from(localItemsRegistry.values());
      items = allLocal.filter(it => {
        if (filters?.status && it.status !== filters.status) return false;
        if (!filters?.status && it.status !== 'published') return false;
        if (filters?.target_language && it.target_language !== filters.target_language) return false;
        if (filters?.genre && it.genre !== filters.genre) return false;
        if (filters?.cefr_level && it.primary_cefr !== filters.cefr_level) return false;
        return true;
      });
    }

    return items;
  }

  public async getContentItemById(id: string): Promise<(ContentItem & { version?: ContentVersion }) | null> {
    // Check local memory first
    const cached = localItemsRegistry.get(id);
    if (cached && cached.version) return cached;

    // Check Dexie
    const local = await getCachedContentItemLocal(id);
    if (local && local.version) return local;

    // Check Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('content_items').select('*').eq('id', id).maybeSingle();
        if (!error && data) {
          const item = data as ContentItem;
          if (item.current_version_id) {
            const version = await this.getContentVersion(item.current_version_id);
            const combined = { ...item, version: version || undefined };
            localItemsRegistry.set(item.id, combined);
            cacheContentItemLocal(combined);
            return combined;
          }
          return item;
        }
      } catch (e) {
        // Ignore
      }
    }

    return cached || local || null;
  }

  public async getContentVersion(versionId: string): Promise<ContentVersion | null> {
    if (localVersionsRegistry.has(versionId)) {
      return localVersionsRegistry.get(versionId)!;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('content_versions').select('*').eq('id', versionId).maybeSingle();
        if (!error && data) {
          const version = data as ContentVersion;
          localVersionsRegistry.set(version.id, version);
          return version;
        }
      } catch (e) {
        // Ignore
      }
    }

    return null;
  }

  public async getActivitiesForVersion(versionId: string): Promise<LearningActivity[]> {
    if (localActivitiesRegistry.has(versionId)) {
      return localActivitiesRegistry.get(versionId)!;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('learning_activities')
          .select('*')
          .eq('content_version_id', versionId)
          .order('activity_order', { ascending: true });
        if (!error && data && data.length > 0) {
          const acts = data as LearningActivity[];
          localActivitiesRegistry.set(versionId, acts);
          return acts;
        }
      } catch (e) {
        // Ignore
      }
    }

    return [];
  }

  // ==========================================================================
  // 2. ADMIN CREATION & PUBLICATION (Immutability & Role Enforced)
  // ==========================================================================

  private assertAdminRole(systemBypass: boolean = false): void {
    if (systemBypass) return;
    const auth = authService.getState();
    if (auth.role !== 'admin') {
      throw new Error('Access denied: Administrative privileges required to modify learning content catalog.');
    }
  }

  private assertUserAccess(targetUserId: string): void {
    const auth = authService.getState();
    if (!auth.isGuest && auth.user && auth.role !== 'admin' && auth.user.id !== targetUserId) {
      throw new Error(`Access denied: Cross-tenant access violation. User ${auth.user.id} cannot access data belonging to ${targetUserId}.`);
    }
  }

  public async saveContentItem(item: Partial<ContentItem>, options?: { systemBypass?: boolean }): Promise<ContentItem> {
    this.assertAdminRole(options?.systemBypass);
    const id = item.id || generateUuid();
    const fullItem: ContentItem = {
      id,
      title: item.title || 'Untitled Learning Text',
      slug: item.slug || `item-${Date.now()}`,
      target_language: item.target_language || ('en' as Language),
      explanation_language: item.explanation_language || ('en' as ExplanationLanguage),
      source_language: item.source_language || 'en',
      summary: item.summary || '',
      genre: item.genre || ('conversation' as ContentGenre),
      primary_cefr: item.primary_cefr || ('B1' as CEFRLevel),
      estimated_read_minutes: item.estimated_read_minutes || 3,
      status: item.status || ('draft' as ContentStatus),
      current_version_id: item.current_version_id,
      source_id: item.source_id,
      rights_status: item.rights_status || 'public_domain',
      rights_notes: item.rights_notes,
      source_url: item.source_url,
      author: item.author || 'Editorial Staff',
      created_by: item.created_by,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localItemsRegistry.set(fullItem.id, fullItem);
    await cacheContentItemLocal(fullItem);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabaseUpsert('content_items', fullItem, 'id', ['source_id', 'current_version_id']);
      } catch (e) {
        console.warn('[ContentCentredService] Supabase item save failed, retained in local storage:', e);
      }
    }

    return fullItem;
  }

  public async saveContentVersion(version: Partial<ContentVersion>, options?: { systemBypass?: boolean }): Promise<ContentVersion> {
    this.assertAdminRole(options?.systemBypass);
    if (!version.content_item_id) {
      throw new Error('content_item_id is required to create a content version');
    }

    // Strict immutability enforcement on published versions (RISK-804)
    if (version.id && localVersionsRegistry.has(version.id)) {
      const existing = localVersionsRegistry.get(version.id)!;
      if (existing.is_published) {
        if (
          version.structured_payload !== undefined ||
          (version.cefr_level !== undefined && version.cefr_level !== existing.cefr_level) ||
          version.is_published === false
        ) {
          throw new Error('Published content versions are immutable. Create a new version edition instead (version_number + 1).');
        }
      }
    }

    // Validate structured payload bounds and schema (Milestone 8.1 / Section 5.4)
    if (version.structured_payload) {
      const validation = validateStructuredPayload(version.structured_payload);
      if (!validation.valid) {
        throw new Error(`Invalid structured payload: ${validation.errors.join('; ')}`);
      }
    }

    const id = version.id || generateUuid();
    const fullVersion: ContentVersion = {
      id,
      content_item_id: version.content_item_id,
      version_number: version.version_number || 1,
      cefr_level: version.cefr_level || ('B1' as CEFRLevel),
      structured_payload: version.structured_payload || {
        title: 'Untitled',
        paragraphs: [],
        annotations: {},
        grammar_points: [],
      },
      audio_metadata: version.audio_metadata || {},
      word_count: version.word_count || 0,
      sentence_count: version.sentence_count || 0,
      lexical_density: version.lexical_density || 0.5,
      is_published: Boolean(version.is_published),
      change_summary: version.change_summary,
      created_by: version.created_by,
      published_at: version.is_published ? (version.published_at || new Date().toISOString()) : undefined,
      created_at: version.created_at || new Date().toISOString(),
    };

    localVersionsRegistry.set(fullVersion.id, fullVersion);

    // Update parent item in local registry
    const parent = localItemsRegistry.get(fullVersion.content_item_id);
    if (parent) {
      parent.version = fullVersion;
      if (fullVersion.is_published) {
        parent.current_version_id = fullVersion.id;
      }
      cacheContentItemLocal(parent);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabaseUpsert('content_versions', fullVersion, 'id', ['content_item_id']);
      } catch (e) {
        console.warn('[ContentCentredService] Supabase version save failed, retained in localDb:', e);
      }
    }

    return fullVersion;
  }

  public async publishContentVersion(itemId: string, versionId: string, options?: { systemBypass?: boolean }): Promise<void> {
    this.assertAdminRole(options?.systemBypass);
    const version = await this.getContentVersion(versionId);
    if (!version) throw new Error(`Content version ${versionId} not found`);

    version.is_published = true;
    version.published_at = new Date().toISOString();
    localVersionsRegistry.set(version.id, version);

    const item = await this.getContentItemById(itemId);
    if (item) {
      item.status = 'published';
      item.current_version_id = version.id;
      item.version = version;
      localItemsRegistry.set(item.id, item);
      await cacheContentItemLocal(item);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabaseUpdate('content_versions', { is_published: true, published_at: version.published_at }, { column: 'id', value: version.id });

        await supabaseUpdate('content_items', { status: 'published', current_version_id: version.id, updated_at: new Date().toISOString() }, { column: 'id', value: itemId });
      } catch (e) {
        console.warn('[ContentCentredService] Remote publish update failed, saved locally:', e);
      }
    }
  }

  public async saveLearningActivity(activity: Partial<LearningActivity>, options?: { systemBypass?: boolean }): Promise<LearningActivity> {
    this.assertAdminRole(options?.systemBypass);
    if (!activity.content_version_id) {
      throw new Error('content_version_id is required');
    }

    if (activity.configuration) {
      const validation = validateActivityConfiguration(activity.configuration);
      if (!validation.valid) {
        throw new Error(`Invalid activity configuration: ${validation.errors.join('; ')}`);
      }
    }
    const id = activity.id || generateUuid();
    const fullActivity: LearningActivity = {
      id,
      content_version_id: activity.content_version_id,
      activity_type: activity.activity_type || 'reading_comprehension',
      activity_title: activity.activity_title || 'Comprehension Activity',
      activity_order: activity.activity_order || 1,
      estimated_minutes: activity.estimated_minutes || 5,
      configuration: activity.configuration || { instructions: '', questions: [] },
      created_at: activity.created_at || new Date().toISOString(),
    };

    const existing = localActivitiesRegistry.get(fullActivity.content_version_id) || [];
    const index = existing.findIndex(a => a.id === fullActivity.id);
    if (index >= 0) {
      existing[index] = fullActivity;
    } else {
      existing.push(fullActivity);
    }
    localActivitiesRegistry.set(fullActivity.content_version_id, existing);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabaseUpsert('learning_activities', fullActivity, 'id', ['content_version_id']);
      } catch (e) {
        console.warn('[ContentCentredService] Activity save to Supabase failed:', e);
      }
    }

    return fullActivity;
  }

  // ==========================================================================
  // 3. LEARNER PROGRESS TELEMETRY
  // ==========================================================================

  public async getLearnerProgress(userId: string, contentItemId: string, versionId?: string): Promise<LearnerContentProgress | null> {
    this.assertUserAccess(userId);
    const local = await getLearnerProgressLocal(userId, contentItemId, versionId);
    if (local) return local;

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('learner_content_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('content_item_id', contentItemId);
        if (versionId) {
          query = query.eq('content_version_id', versionId);
        }
        const { data, error } = await query
          .order('last_studied_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!error && data) {
          const rec = data as LearnerContentProgress;
          await saveLearnerProgressLocal(rec);
          return rec;
        }
      } catch (e) {
        // ignore
      }
    }

    return null;
  }

  public async getAllLearnerProgress(userId: string): Promise<LearnerContentProgress[]> {
    this.assertUserAccess(userId);
    const local = await getAllLearnerProgressLocal(userId);
    if (local.length > 0) return local;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('learner_content_progress')
          .select('*')
          .eq('user_id', userId);
        if (!error && data) {
          const records = data as LearnerContentProgress[];
          for (const rec of records) {
            await saveLearnerProgressLocal(rec);
          }
          return records;
        }
      } catch (e) {
        // ignore
      }
    }

    return local;
  }

  public async updateLearnerProgress(
    progress: Partial<LearnerContentProgress> & { user_id: string; content_item_id: string; content_version_id?: string }
  ): Promise<LearnerContentProgress> {
    this.assertUserAccess(progress.user_id);
    const existing = await this.getLearnerProgress(progress.user_id, progress.content_item_id, progress.content_version_id);
    const id = existing?.id || progress.id || generateUuid();

    const fullRecord: LearnerContentProgress = {
      id,
      user_id: progress.user_id,
      content_item_id: progress.content_item_id,
      content_version_id: progress.content_version_id || existing?.content_version_id || 'v1',
      status: progress.status || existing?.status || 'in_progress',
      percent_complete: progress.percent_complete !== undefined ? progress.percent_complete : (existing?.percent_complete || 0),
      completed_activity_ids: progress.completed_activity_ids || existing?.completed_activity_ids || [],
      time_spent_seconds: (existing?.time_spent_seconds || 0) + (progress.time_spent_seconds || 0),
      comprehension_score: progress.comprehension_score !== undefined ? progress.comprehension_score : existing?.comprehension_score,
      client_mutation_id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      first_opened_at: existing?.first_opened_at || new Date().toISOString(),
      last_studied_at: new Date().toISOString(),
      completed_at: (progress.status === 'completed' || existing?.status === 'completed') ? (existing?.completed_at || new Date().toISOString()) : undefined,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveLearnerProgressLocal(fullRecord);
    syncEngine.queueAction('SYNC_LEARNER_PROGRESS', fullRecord, progress.user_id);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabaseUpsert('learner_content_progress', fullRecord, 'user_id,content_item_id', [
          'content_item_id',
          'content_version_id',
        ]);
      } catch (e) {
        console.warn('[ContentCentredService] Cloud progress sync queued locally:', e);
      }
    }

    return fullRecord;
  }

  // ==========================================================================
  // 4. PERSONAL VOCABULARY & SM-2 SPDCED REPETITION
  // ==========================================================================

  public async getUserSavedWords(userId: string, targetLanguage?: Language): Promise<UserSavedWord[]> {
    this.assertUserAccess(userId);
    const localWords = await getUserSavedWordsLocal(userId, targetLanguage);
    if (localWords.length > 0) return localWords;

    if (isSupabaseConfigured && supabase) {
      try {
        let q = supabase.from('user_saved_words').select('*').eq('user_id', userId);
        if (targetLanguage) q = q.eq('target_language', targetLanguage);
        const { data, error } = await q.order('next_review', { ascending: true });
        if (!error && data) {
          const words = data as UserSavedWord[];
          for (const w of words) {
            await saveUserWordLocal(w);
          }
          return words;
        }
      } catch (e) {
        // ignore
      }
    }

    return localWords;
  }

  public async saveUserWord(
    word: Partial<UserSavedWord> & {
      user_id: string;
      term: string;
      lemma: string;
      target_language: Language;
      explanation_language: ExplanationLanguage;
      definition: string;
    }
  ): Promise<UserSavedWord> {
    this.assertUserAccess(word.user_id);
    const existingWords = await this.getUserSavedWords(word.user_id, word.target_language);
    const pos = word.pos || 'other';
    const existing = existingWords.find(
      w => w.lemma.toLowerCase() === word.lemma.toLowerCase() &&
           w.pos === pos &&
           w.explanation_language === word.explanation_language
    );

    const id = existing?.id || word.id || generateUuid();
    const fullWord: UserSavedWord = {
      id,
      user_id: word.user_id,
      target_language: word.target_language,
      explanation_language: word.explanation_language,
      term: word.term,
      lemma: word.lemma,
      pos,
      cefr_level: word.cefr_level || existing?.cefr_level,
      definition: word.definition,
      context_sentence: word.context_sentence || existing?.context_sentence,
      context_translation: word.context_translation || existing?.context_translation,
      source_content_id: word.source_content_id || existing?.source_content_id,
      source_version_id: word.source_version_id || existing?.source_version_id,
      audio_url: word.audio_url || existing?.audio_url,
      ipa: word.ipa || existing?.ipa,
      client_mutation_id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ease_factor: word.ease_factor || existing?.ease_factor || 2.5,
      interval_days: word.interval_days !== undefined ? word.interval_days : (existing?.interval_days || 0),
      repetitions: word.repetitions !== undefined ? word.repetitions : (existing?.repetitions || 0),
      lapses: word.lapses !== undefined ? word.lapses : (existing?.lapses || 0),
      last_reviewed_at: word.last_reviewed_at || existing?.last_reviewed_at,
      next_review: word.next_review || existing?.next_review || new Date().toISOString().split('T')[0],
      legacy_srs_item_id: word.legacy_srs_item_id || existing?.legacy_srs_item_id,
      state: word.state || existing?.state || 'learning',
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveUserWordLocal(fullWord);
    syncEngine.queueAction('SYNC_USER_SAVED_WORD', fullWord, word.user_id);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabaseUpsert('user_saved_words', fullWord, 'user_id,target_language,lemma,pos,explanation_language', ['source_content_id', 'source_version_id']);
      } catch (e) {
        console.warn('[ContentCentredService] Supabase word save failed, kept locally:', e);
      }
    }

    return fullWord;
  }

  public async recordWordReview(userId: string, wordId: string, rating: number): Promise<UserSavedWord> {
    this.assertUserAccess(userId);
    const words = await this.getUserSavedWords(userId);
    const word = words.find(w => w.id === wordId);
    if (!word) throw new Error(`Saved word ${wordId} not found`);

    const srsState = {
      user_id: word.user_id,
      language: word.target_language,
      vocabulary_item_id: word.lemma,
      ease_factor: word.ease_factor,
      interval_days: word.interval_days,
      repetition_count: word.repetitions,
      lapse_count: word.lapses,
      last_reviewed_at: word.last_reviewed_at || null,
      next_review_date: word.next_review,
      mastery_status: word.state as any,
      history: [],
    };

    const nextState = SRSService.calculateNextState(srsState as any, rating);

    word.ease_factor = nextState.ease_factor;
    word.interval_days = nextState.interval_days;
    word.repetitions = nextState.repetition_count;
    word.lapses = nextState.lapse_count;
    word.last_reviewed_at = new Date().toISOString();
    word.next_review = nextState.next_review_date;
    word.state = nextState.mastery_status as any;
    word.updated_at = new Date().toISOString();

    await saveUserWordLocal(word);
    syncEngine.queueAction('SYNC_USER_SAVED_WORD', word, userId);
    syncEngine.queueAction('SYNC_WORD_REVIEW_EVENT', {
      user_id: userId,
      saved_word_id: word.id,
      rating,
      previous_interval_days: srsState.interval_days,
      new_interval_days: nextState.interval_days,
      previous_ease_factor: srsState.ease_factor,
      new_ease_factor: nextState.ease_factor,
      reviewed_at: new Date().toISOString(),
    }, userId);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabaseUpdate('user_saved_words', { ease_factor: word.ease_factor, interval_days: word.interval_days, repetitions: word.repetitions, lapses: word.lapses, last_reviewed_at: word.last_reviewed_at, next_review: word.next_review, state: word.state, updated_at: word.updated_at }, { column: 'id', value: word.id });

        await supabaseInsert('user_word_review_events', { user_id: userId, saved_word_id: word.id, rating, previous_interval_days: srsState.interval_days, new_interval_days: nextState.interval_days, previous_ease_factor: srsState.ease_factor, new_ease_factor: nextState.ease_factor, reviewed_at: new Date().toISOString() }, ['saved_word_id']);
      } catch (e) {
        console.warn('[ContentCentredService] Supabase review sync queued locally:', e);
      }
    }

    return word;
  }

  // ==========================================================================
  // 5. MISTAKE NOTEBOOK
  // ==========================================================================

  public async getUserMistakes(
    userId: string,
    status?: MistakeStatus,
    category?: ErrorCategory
  ): Promise<UserMistake[]> {
    this.assertUserAccess(userId);
    const local = await getUserMistakesLocal(userId);
    let filtered = local;
    if (status) filtered = filtered.filter(m => m.status === status);
    if (category) filtered = filtered.filter(m => m.error_category === category);

    if (filtered.length > 0) return filtered;

    if (isSupabaseConfigured && supabase) {
      try {
        let q = supabase.from('user_mistakes').select('*').eq('user_id', userId);
        if (status) q = q.eq('status', status);
        if (category) q = q.eq('error_category', category);
        const { data, error } = await q.order('last_occurred_at', { ascending: false });
        if (!error && data) {
          const remoteMistakes = data as UserMistake[];
          for (const m of remoteMistakes) {
            await saveUserMistakeLocal(m);
          }
          return remoteMistakes;
        }
      } catch (e) {
        // ignore
      }
    }

    return filtered;
  }

  public async recordUserMistake(
    mistake: Partial<UserMistake> & {
      user_id: string;
      stimulus: string;
      user_response: string;
      correct_response: string;
      pedagogical_explanation: string;
    }
  ): Promise<UserMistake> {
    this.assertUserAccess(mistake.user_id);
    const allMistakes = await this.getUserMistakes(mistake.user_id);
    const existing = allMistakes.find(
      m => m.stimulus === mistake.stimulus && m.status !== 'dismissed' && m.status !== 'mastered'
    );

    const id = existing?.id || mistake.id || generateUuid();
    const fullMistake: UserMistake = {
      id,
      user_id: mistake.user_id,
      content_item_id: mistake.content_item_id || existing?.content_item_id,
      content_version_id: mistake.content_version_id || existing?.content_version_id,
      activity_id: mistake.activity_id || existing?.activity_id,
      activity_type: mistake.activity_type || existing?.activity_type || 'reading_comprehension',
      error_category: mistake.error_category || existing?.error_category || 'general',
      stimulus: mistake.stimulus,
      user_response: mistake.user_response,
      correct_response: mistake.correct_response,
      pedagogical_explanation: mistake.pedagogical_explanation,
      status: 'unresolved',
      occurrences_count: (existing?.occurrences_count || 0) + 1,
      client_mutation_id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      first_occurred_at: existing?.first_occurred_at || new Date().toISOString(),
      last_occurred_at: new Date().toISOString(),
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveUserMistakeLocal(fullMistake);
    syncEngine.queueAction('SYNC_USER_MISTAKE', fullMistake, mistake.user_id);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabaseUpsert('user_mistakes', fullMistake, 'id', [
          'content_item_id',
          'content_version_id',
          'activity_id',
        ]);
      } catch (e) {
        console.warn('[ContentCentredService] Supabase mistake save queued locally:', e);
      }
    }

    return fullMistake;
  }

  public async resolveUserMistake(mistakeId: string, status: MistakeStatus = 'mastered'): Promise<UserMistake> {
    const local = await getUserMistakesLocal('guest'); // Query all or by ID
    const mistake = await getUserMistakeByIdLocal(mistakeId);
    if (!mistake) {
      throw new Error(`Mistake ${mistakeId} not found`);
    }
    this.assertUserAccess(mistake.user_id);

    mistake.status = status;
    mistake.resolved_at = new Date().toISOString();
    mistake.updated_at = new Date().toISOString();

    await saveUserMistakeLocal(mistake);
    syncEngine.queueAction('SYNC_USER_MISTAKE', mistake, mistake.user_id);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabaseUpdate('user_mistakes', { status: mistake.status, resolved_at: mistake.resolved_at, updated_at: mistake.updated_at }, { column: 'id', value: mistakeId });
      } catch (e) {
        // ignore
      }
    }

    return mistake;
  }
}

export const contentCentredService = ContentCentredService.getInstance();
