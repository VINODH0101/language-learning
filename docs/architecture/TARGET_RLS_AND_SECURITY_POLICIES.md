# Lexilume — Target Row-Level Security (RLS) & Security Policies

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production Application:** `https://lexi.monster`  
> **Phase:** Phase 5 — Database Design, Data Mapping & Safe Migration Plan  
> **Target Migration Number:** `015` (`015_content_centred_architecture.sql`)  
> **Document Type:** Production Security, Access Control & RLS Specification

---

## 1. Executive Summary & Security Model

Lexilume operates a multi-tenant, privacy-conscious language learning platform. Row-Level Security (RLS) in PostgreSQL is the bedrock defense against unauthorized data exposure, tenant cross-talk, and privilege escalation.

### Architectural Access Roles:
1. **Anonymous Guest (`anon`):**
   - Read access to published educational content and open licenses.
   - Zero access to user progress, personal saved words, or mistake notebooks.
2. **Authenticated Learner (`authenticated`):**
   - Read access to all published content items, versions, and learning activities.
   - Strict, isolated CRUD access to their own data (`learner_content_progress`, `user_saved_words`, `user_mistakes`) enforced by `auth.uid() = user_id`.
   - Zero access to unpublished content drafts, admin audit logs, or pipeline processing jobs.
3. **Administrator (`admin` role via `user_roles`):**
   - Verified via `public.has_role(auth.uid(), 'admin')` or `public.is_admin()`.
   - Full read, write, update, and delete access across content catalogs, processing jobs, moderation queues, and system audits.
4. **Service Role (`service_role`):**
   - Internal background processors and GitHub Actions bypass RLS for automated batch ingestion and dictionary enrichment.

---

## 2. Table-by-Table RLS Policy Specifications

### 2.1 `content_sources`
Public read access ensures open-source attribution compliance; admin write access ensures provenance integrity.

```sql
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read content sources (public attribution)
CREATE POLICY "Public and learners can view content sources" 
ON public.content_sources
FOR SELECT 
USING (true);

-- Policy: Admins have full management access
CREATE POLICY "Admins can manage content sources" 
ON public.content_sources
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

---

### 2.2 `english_content_items`
Learners and guests can browse only published materials; administrators manage the complete publishing lifecycle.

```sql
ALTER TABLE public.english_content_items ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published content items
CREATE POLICY "Anyone can view published content items" 
ON public.english_content_items
FOR SELECT 
USING (status = 'published');

-- Policy: Admins can view all content items (draft, in_review, archived)
CREATE POLICY "Admins can view all content items" 
ON public.english_content_items
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can insert, update, or archive content items
CREATE POLICY "Admins can manage content items" 
ON public.english_content_items
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

---

### 2.3 `content_versions`
Learners access immutable versions that are flagged as published; admins create and inspect all drafts and candidate versions.

```sql
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published content versions
CREATE POLICY "Anyone can view published content versions" 
ON public.content_versions
FOR SELECT 
USING (is_published = true);

-- Policy: Admins can view all content versions
CREATE POLICY "Admins can view all content versions" 
ON public.content_versions
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can insert and manage versions
CREATE POLICY "Admins can manage content versions" 
ON public.content_versions
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

---

### 2.4 `learning_activities`
Activities inherit the visibility of their parent published content version.

```sql
ALTER TABLE public.learning_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view activities belonging to published content versions
CREATE POLICY "Anyone can view published activities" 
ON public.learning_activities
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.content_versions v 
        WHERE v.id = learning_activities.content_version_id 
          AND v.is_published = true
    )
);

-- Policy: Admins have full management access to activities
CREATE POLICY "Admins can manage activities" 
ON public.learning_activities
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

---

### 2.5 `learner_content_progress`
Strict tenant isolation: learners can only read, create, and update their own progress records.

```sql
ALTER TABLE public.learner_content_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Learners can view their own progress
CREATE POLICY "Learners can view own progress" 
ON public.learner_content_progress
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Learners can create their own progress records
CREATE POLICY "Learners can insert own progress" 
ON public.learner_content_progress
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Learners can update their own progress records
CREATE POLICY "Learners can update own progress" 
ON public.learner_content_progress
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all progress for telemetry and analytics
CREATE POLICY "Admins can view all progress" 
ON public.learner_content_progress
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

---

### 2.6 `user_saved_words`
Personal vocabulary entries are strictly private to the learner who saved them.

```sql
ALTER TABLE public.user_saved_words ENABLE ROW LEVEL SECURITY;

-- Policy: Learners can view own saved words
CREATE POLICY "Learners can view own saved words" 
ON public.user_saved_words
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Learners can insert own saved words
CREATE POLICY "Learners can insert own saved words" 
ON public.user_saved_words
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Learners can update own saved words (SM-2 reviews)
CREATE POLICY "Learners can update own saved words" 
ON public.user_saved_words
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Learners can delete own saved words
CREATE POLICY "Learners can delete own saved words" 
ON public.user_saved_words
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Admins can view vocabulary stats for system aggregation
CREATE POLICY "Admins can view all saved words" 
ON public.user_saved_words
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

---

### 2.7 `user_mistakes`
Mistake notebooks contain sensitive pedagogical performance telemetry and are accessible only by the owner.

```sql
ALTER TABLE public.user_mistakes ENABLE ROW LEVEL SECURITY;

-- Policy: Learners can view own mistakes
CREATE POLICY "Learners can view own mistakes" 
ON public.user_mistakes
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Learners can insert own mistakes
CREATE POLICY "Learners can insert own mistakes" 
ON public.user_mistakes
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Learners can update own mistakes (marking reviewed or resolved)
CREATE POLICY "Learners can update own mistakes" 
ON public.user_mistakes
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view mistake telemetry for pedagogical optimization
CREATE POLICY "Admins can view all mistakes" 
ON public.user_mistakes
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

---

### 2.8 `content_processing_jobs`
Automated pipeline jobs are restricted strictly to administrators and background processing agents.

```sql
ALTER TABLE public.content_processing_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins have full access to processing jobs
CREATE POLICY "Admins can view and manage processing jobs" 
ON public.content_processing_jobs
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

---

## 3. Threat Modeling & Defensive Invariants

| Threat / Attack Vector | Mitigation in Target Architecture |
| :--- | :--- |
| **Insecure Direct Object Reference (IDOR)** | RLS policies enforce `auth.uid() = user_id` at the database kernel level; tampering with query parameters (`/api/words?user_id=attacker`) yields 0 rows. |
| **Privilege Escalation via `user_roles`** | `user_roles` is guarded by RLS policies where only users who already possess the `'admin'` role can grant or revoke roles. Standard authenticated users have zero write permissions on `user_roles`. |
| **Unpublished Draft Leakage** | Public/learner SELECT policies on `english_content_items` and `content_versions` strictly require `status = 'published'` and `is_published = true`. Unpublished drafts are invisible to non-admins. |
| **JSONB Payload Injection** | JSONB payloads are validated against strict JSON Schemas prior to insertion via Pydantic on the backend and TypeScript interfaces on the frontend. Parameterized queries in Supabase client prevent SQL injection. |
| **Denial of Service via Unbounded Scans** | Partial indexes on active review queues (`WHERE state IN ('learning', 'reviewing')`) and compound keys prevent table-scan resource exhaustion. |
