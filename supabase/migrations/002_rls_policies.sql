-- Polyglot C1 Daily: Row-Level Security Policies Migration
-- Migration 002_rls_policies.sql

-- Enable RLS on all educational reference tables
ALTER TABLE public.licenses_and_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curated_materials ENABLE ROW LEVEL SECURITY;

-- Allow public read access to educational reference tables
CREATE POLICY "Public read access for licenses" ON public.licenses_and_sources
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read access for curriculum nodes" ON public.curriculum_nodes
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read access for vocabulary" ON public.vocabulary_items
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read access for grammar rules" ON public.grammar_rules
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read access for exercise templates" ON public.exercise_templates
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read access for curated materials" ON public.curated_materials
    FOR SELECT TO anon, authenticated USING (true);

-- Enable RLS on user-specific tracking tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vocabulary_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;

-- Single-user scoped policies
CREATE POLICY "Users can read own profile" ON public.user_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can read own language tracks" ON public.language_tracks
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can read own daily lessons" ON public.daily_lessons
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own daily lessons progress" ON public.daily_lessons
    FOR UPDATE TO authenticated
    USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()))
    WITH CHECK (user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can record exercise attempts" ON public.lesson_exercises
    FOR ALL TO authenticated
    USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view and update own SRS vocabulary" ON public.user_vocabulary_history
    FOR ALL TO authenticated
    USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can read own email delivery status" ON public.email_deliveries
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));
