# Lexilume — Dexie Schema & Local Browser Migration Specification

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production Application:** `https://lexi.monster`  
> **Phase:** Phase 5 — Database Design, Data Mapping & Safe Migration Plan  
> **Target Dexie Version:** Version 5 in `frontend/src/services/localDb.ts`  
> **Document Type:** Client-Side Offline Storage & Upgrade Specification

---

## 1. Executive Summary & Local-First Invariants

Lexilume is built on a **Local-First Architecture**. Core learning workflows—including authentic content reading, audio playback, spaced repetition flashcard reviews, vocabulary lookups, and mistake tracking—must operate seamlessly when the learner is offline or experiencing intermittent connectivity.

### Client-Side Invariants:
1. **Zero Browser Data Loss:** An upgrade to the local database schema must never wipe existing saved words, completed lesson streaks, or pending sync mutations from IndexedDB.
2. **Deterministic Upgrade Path:** Dexie's declarative versioning (`this.version(5).stores(...).upgrade(...)`) must safely translate existing records from versions 1–4 into target structures.
3. **Multi-Tenant Local Scoping:** In shared device scenarios, all local queries and mutations are strictly filtered by `user_id`.
4. **Resilient Memory Fallback:** In private browsing modes or restricted webview environments where IndexedDB is disabled, an in-memory Map fallback maintains functional continuity for the duration of the session.

---

## 2. Current State Inventory: Versions 1 Through 4

From inspection of [`frontend/src/services/localDb.ts`](file:///frontend/src/services/localDb.ts):

```typescript
// Existing stores in PolyglotLocalDatabase:
version(1):
  cachedLessons:        'id, language, lesson_date, cefr_level, expires_at'
  activeLessonProgress: 'id, language, curriculum_node_id, updated_at'
  savedVocabulary:      'id, user_id, source_text, target_lang, created_at'
  srsReviews:           'id, user_id, language, vocabulary_item_id, next_review_date'
  mistakeNotebook:      'id, user_id, language, error_category, timestamp, is_resolved'
  syncQueue:            'id, action, status, created_at'

version(2):
  culturalBookmarks:    'id, user_id, article_id, content_language, origin_country, topic, cefr_level, created_at'

version(3):
  apiCache:             'id, provider, cacheKey, expiresAt'

version(4):
  syncQueue:            'id, user_id, action, status, created_at'
```

---

## 3. Target Dexie Schema: Version 5

Version 5 introduces 4 new stores aligned with the content-centred architecture while keeping legacy stores intact for backward compatibility:

```typescript
// Proposed Version 5 additions in frontend/src/services/localDb.ts:
this.version(5).stores({
  // Legacy stores preserved for zero-loss rollback
  cachedLessons:        'id, language, lesson_date, cefr_level, expires_at',
  activeLessonProgress: 'id, language, curriculum_node_id, updated_at',
  savedVocabulary:      'id, user_id, source_text, target_lang, created_at',
  srsReviews:           'id, user_id, language, vocabulary_item_id, next_review_date',
  mistakeNotebook:      'id, user_id, language, error_category, timestamp, is_resolved',
  culturalBookmarks:    'id, user_id, article_id, content_language, origin_country, topic, cefr_level, created_at',
  apiCache:             'id, provider, cacheKey, expiresAt',
  syncQueue:            'id, user_id, action, status, created_at',

  // Target Content-Centred Stores
  cachedContentItems:     'id, slug, status, primary_cefr, genre, updated_at',
  learnerContentProgress: 'id, user_id, content_item_id, status, percent_complete, last_studied_at',
  userSavedWords:         'id, user_id, lemma, explanation_language, next_review, state, updated_at',
  userMistakes:           'id, user_id, content_item_id, error_category, status, last_occurred_at'
}).upgrade(async (tx) => {
  // Safe transactional data migration inside IndexedDB
  await migrateLegacyLocalVocabulary(tx);
  await migrateLegacyLocalMistakes(tx);
});
```

---

## 4. Target Local TypeScript Interfaces

```typescript
export interface CachedContentItemRecord {
  id: string; // UUID of english_content_items
  slug: string;
  title: string;
  summary: string;
  genre: string;
  primary_cefr: string;
  estimated_read_minutes: number;
  status: 'published' | 'draft';
  current_version_id: string;
  structured_payload: {
    title: string;
    paragraphs: Array<{
      id: string;
      order: number;
      sentences: Array<{
        id: string;
        text: string;
        tokens: Array<{ text: string; lemma: string; pos: string; cefr?: string }>;
        audio_offset_ms?: { start: number; end: number };
      }>;
    }>;
    annotations?: Record<string, unknown>;
    grammar_points?: Array<unknown>;
  };
  cached_at: string;
  expires_at: number; // timestamp in ms for LRU eviction
}

export interface LearnerContentProgressRecord {
  id: string; // `${user_id}_${content_item_id}`
  user_id: string;
  content_item_id: string;
  content_version_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'revisiting';
  percent_complete: number;
  completed_activity_ids: string[];
  time_spent_seconds: number;
  comprehension_score?: number;
  last_studied_at: string;
  updated_at: string;
}

export interface UserSavedWordRecord {
  id: string;
  user_id: string;
  term: string;
  lemma: string;
  pos?: string;
  cefr_level?: string;
  explanation_language: 'en' | 'pt' | 'es';
  definition: string;
  context_sentence?: string;
  source_content_id?: string;
  audio_url?: string;
  next_review: string; // YYYY-MM-DD
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  lapses: number;
  last_reviewed_at?: string;
  state: 'learning' | 'reviewing' | 'mastered' | 'ignored';
  created_at: string;
  updated_at: string;
}

export interface UserMistakeRecord {
  id: string;
  user_id: string;
  content_item_id?: string;
  activity_id?: string;
  activity_type: string;
  error_category: string;
  stimulus: string;
  user_response: string;
  correct_response: string;
  pedagogical_explanation: string;
  status: 'unresolved' | 'review_pending' | 'mastered' | 'dismissed';
  occurrences_count: number;
  first_occurred_at: string;
  last_occurred_at: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}
```

---

## 5. Transactional Upgrade Implementation

The Dexie `.upgrade()` handler guarantees atomic transition of existing local records during the first application boot following the v5 deployment:

```typescript
async function migrateLegacyLocalVocabulary(tx: Dexie.Transaction) {
  const savedVocabTable = tx.table<SavedVocabularyRecord>('savedVocabulary');
  const srsReviewsTable = tx.table<SRSItemState & { id: string }>('srsReviews');
  const targetWordsTable = tx.table<UserSavedWordRecord>('userSavedWords');

  const savedList = await savedVocabTable.toArray();
  const srsMap = new Map<string, SRSItemState>();
  const srsList = await srsReviewsTable.toArray();
  
  for (const srs of srsList) {
    const key = `${srs.user_id || 'guest'}_${srs.vocabulary_item_id.toLowerCase().trim()}`;
    srsMap.set(key, srs);
  }

  for (const item of savedList) {
    const lemma = item.source_text.toLowerCase().trim();
    const userKey = item.user_id || 'guest';
    const srsEntry = srsMap.get(`${userKey}_${lemma}`);

    const newRecord: UserSavedWordRecord = {
      id: item.id || crypto.randomUUID(),
      user_id: item.user_id || 'guest',
      term: item.source_text,
      lemma: lemma,
      explanation_language: (item.target_lang as 'en' | 'pt' | 'es') || 'en',
      definition: item.target_text || 'Saved word',
      next_review: srsEntry?.next_review_date || new Date().toISOString().split('T')[0],
      interval_days: srsEntry?.interval || 0,
      ease_factor: srsEntry?.ease_factor || 2.5,
      repetitions: srsEntry?.repetitions || 0,
      lapses: 0,
      state: (srsEntry?.repetitions ?? 0) > 4 ? 'mastered' : 'learning',
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await targetWordsTable.put(newRecord);
  }
}

async function migrateLegacyLocalMistakes(tx: Dexie.Transaction) {
  const legacyMistakesTable = tx.table<MistakeNotebookItem>('mistakeNotebook');
  const targetMistakesTable = tx.table<UserMistakeRecord>('userMistakes');

  const oldMistakes = await legacyMistakesTable.toArray();

  for (const old of oldMistakes) {
    const newMistake: UserMistakeRecord = {
      id: old.id || crypto.randomUUID(),
      user_id: old.user_id || 'guest',
      activity_type: 'exercise_attempt',
      error_category: old.error_category || 'vocabulary_choice',
      stimulus: old.stimulus || 'Practice exercise',
      user_response: old.user_response || '',
      correct_response: old.correct_response || '',
      pedagogical_explanation: old.pedagogical_explanation || 'Pay close attention to word choice and context.',
      status: old.is_resolved ? 'mastered' : 'unresolved',
      occurrences_count: old.occurrences_count || 1,
      first_occurred_at: old.timestamp || new Date().toISOString(),
      last_occurred_at: old.timestamp || new Date().toISOString(),
      created_at: old.timestamp || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await targetMistakesTable.put(newMistake);
  }
}
```

---

## 6. Storage Quota Management & Eviction Strategy

Authentic content with token trees and audio metadata requires deliberate storage budgeting:

1. **Storage Budget:** IndexedDB allocation targets < 50MB per device.
2. **LRU Eviction on `cachedContentItems`:**
   - Maximum cached content items: **50 items**.
   - When the cache exceeds 50 items, the oldest items by `expires_at` are evicted, **except** those where `learnerContentProgress.status = 'in_progress'`.
3. **Permanent Retention for Learner Artifacts:**
   - `userSavedWords`, `learnerContentProgress`, and `userMistakes` are **never** evicted automatically. They are learner-owned progress records that persist until explicitly deleted by the user.
4. **Quota Error Handling:** If `QuotaExceededError` is trapped during write:
   - Clear `apiCache` entirely.
   - Clear expired items in `cachedContentItems`.
   - Retry mutation once. If still failing, write to in-memory fallback and alert the learner.
