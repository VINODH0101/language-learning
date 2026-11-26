# Lexilume Phase 8 — Database Integrity Report

> **Repository:** `VINODH0101/language-learning`  
> **Branch:** `phase-8-reliability-quality`  
> **Milestone:** Milestone 8.1 — Database Integrity and Migration Reliability  
> **Status:** Hardened & Verified

---

## 1. Executive Summary

Milestone 8.1 verifies and hardens data integrity across PostgreSQL, Dexie v5 IndexedDB, TypeScript domain models, and Python Pydantic models. Specific emphasis was placed on:
1. Enforcing content version immutability at the database layer via PostgreSQL triggers as well as in the client service layer (`RISK-804`).
2. Validating JSONB structures (`structured_payload`, activity configurations) against size and nesting bounds before persistence.
3. Protecting against multi-tenant data corruption and cross-language lemma collision (`RISK-1` mitigation).

---

## 2. Immutability Enforcement Architecture

### 2.1 Database Trigger (`trg_prevent_published_version_mutation`)
A database trigger was added in `supabase/migrations/015_content_centred_architecture.sql`:

```sql
CREATE OR REPLACE FUNCTION public.prevent_published_version_mutation()
RETURNS TRIGGER AS $immut$
BEGIN
    -- If already published, reject any alterations to pedagogical payload or core metrics
    IF OLD.is_published = true THEN
        IF NEW.structured_payload IS DISTINCT FROM OLD.structured_payload OR
           NEW.cefr_level IS DISTINCT FROM OLD.cefr_level OR
           NEW.word_count IS DISTINCT FROM OLD.word_count OR
           NEW.sentence_count IS DISTINCT FROM OLD.sentence_count THEN
            RAISE EXCEPTION 'Published content versions are immutable. Create a new version edition instead (version_number + 1).'
                USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$immut$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_published_version_mutation ON public.content_versions;
CREATE TRIGGER trg_prevent_published_version_mutation
    BEFORE UPDATE ON public.content_versions
    FOR EACH ROW EXECUTE FUNCTION public.prevent_published_version_mutation();
```

### 2.2 Client Service Immutability Guard (`ContentCentredService.ts`)
In `saveContentVersion`:
```typescript
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
```
**Verification:** Verified via `src/tests/databaseIntegrity.test.ts` (Test 1).

---

## 3. JSONB Payload Schema Validation

To prevent malformed structures or oversized JSON documents from exhausting browser memory or IndexedDB quota, `validateStructuredPayload` and `validateActivityConfiguration` were introduced in `frontend/src/types/contentCentred.ts`:

- **Maximum Serialized Size:** 500 KB ceiling.
- **Maximum Paragraph Count:** 200 paragraphs per content version.
- **Maximum Sentences per Paragraph:** 100 sentences.
- **Structural Integrity:** Mandatory non-empty title, array paragraphs, valid token maps, and valid question stems/answers.

---

## 4. Key Constraints & Relation Integrity

| Table | Constraint | Purpose | Verified In |
| :--- | :--- | :--- | :--- |
| `user_saved_words` | `uq_user_saved_words UNIQUE (user_id, target_language, lemma, pos, explanation_language)` | Multilingual homonym collision protection | `test_migration_015.py` |
| `learner_content_progress` | `uq_learner_content_user_item UNIQUE (user_id, content_item_id)` | Single progress record per user per content item | `test_migration_015.py` |
| `learning_activities` | `uq_learning_activities_version_order UNIQUE (content_version_id, activity_order)` | Stable sequential activity ordering | `test_migration_015.py` |
| `content_versions` | `ON DELETE CASCADE` from `content_items` | Clean parent-child referential cleanup | `test_migration_015.py` |
| `user_word_review_events` | `rating CHECK (rating >= 0 AND rating <= 5)` | Strict SM-2 mathematical rating bounds | `test_migration_015.py` |
