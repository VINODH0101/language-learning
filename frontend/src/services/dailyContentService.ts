/**
 * Lexilume — Daily Learning Content Service
 * 
 * Manages Administrator-published Daily Poetry and Daily Conversations.
 * Features:
 * - Independent linguistic retrieval (Target Learning Language & CEFR Level)
 * - Safe replacement semantics: Latest published is active; previous archived (never deleted)
 * - Offline-first IndexedDB / LocalStorage persistence with Supabase sync
 * - Zero fabricated content: authentic literary and communicative models across all 13 supported languages
 * - Hindi is strictly excluded
 */

import { Language, CEFRLevel, DailyPoem, DailyConversation, DailyContentState } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY_POETRY = 'lexilume_daily_poetry_v1';
const STORAGE_KEY_CONVERSATIONS = 'lexilume_daily_conversations_v1';

class DailyContentService {
  private static instance: DailyContentService;
  private listeners: Set<() => void> = new Set();

  public static getInstance(): DailyContentService {
    if (!DailyContentService.instance) {
      DailyContentService.instance = new DailyContentService();
    }
    return DailyContentService.instance;
  }

  private constructor() {}

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  // --- Learner Retrieval Methods ---

  public getDailyPoem(learningLanguage: Language, _explanationLanguage?: string, cefrLevel?: CEFRLevel): DailyPoem | null {
    const all = this.getLocalPoetry();
    const active = all.filter(p => p.is_active && p.learning_language === learningLanguage);
    if (active.length === 0) {
      // Never substitute archived content or another target language.
      return null;
    }
    if (cefrLevel) {
      const matchLevel = active.find(p => p.cefr_level === cefrLevel);
      if (matchLevel) return matchLevel;
    }
    return active[0];
  }

  public getDailyConversation(learningLanguage: Language, _explanationLanguage?: string, cefrLevel?: CEFRLevel): DailyConversation | null {
    const all = this.getLocalConversations();
    const active = all.filter(c => c.is_active && c.learning_language === learningLanguage);
    if (active.length === 0) {
      // Never substitute archived content or another target language.
      return null;
    }
    if (cefrLevel) {
      const matchLevel = active.find(c => c.cefr_level === cefrLevel);
      if (matchLevel) return matchLevel;
    }
    return active[0];
  }

  public async getActivePoem(learningLanguage: Language, cefrLevel?: CEFRLevel): Promise<DailyPoem | null> {
    return this.getActivePoetry(learningLanguage, cefrLevel);
  }

  public async getActivePoetry(learningLanguage: Language, cefrLevel?: CEFRLevel): Promise<DailyPoem | null> {
    // 1. If Supabase configured, check remote active item
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('daily_published_content')
          .select('*')
          .eq('content_type', 'poetry')
          .eq('learning_language', learningLanguage)
          .eq('is_active', true)
          .order('published_at', { ascending: false })
          .limit(1);

        if (cefrLevel) {
          query = query.eq('cefr_level', cefrLevel);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const row = data[0];
          return {
            id: row.id,
            title: row.title,
            author: row.author_or_speaker || 'Desconhecido',
            learning_language: row.learning_language as Language,
            cefr_level: (row.cefr_level || 'B1') as CEFRLevel,
            excerpt: row.excerpt,
            full_text: row.full_content,
            cultural_context: row.cultural_context || '',
            country_name: row.country_name,
            country_code: row.country_code,
            translation: row.translation,
            published_at: row.published_at,
            is_active: row.is_active,
          };
        }
      } catch (err) {
        console.warn('Supabase daily poetry fetch error, falling back to local', err);
      }
    }

    // 2. Local fallback
    const all = this.getLocalPoetry();
    const active = all.filter(p => p.is_active && p.learning_language === learningLanguage);
    if (active.length === 0) {
      // Never substitute archived content or another target language.
      return null;
    }
    if (cefrLevel) {
      const matchLevel = active.find(p => p.cefr_level === cefrLevel);
      if (matchLevel) return matchLevel;
    }
    return active[0];
  }

  public async getActiveConversation(learningLanguage: Language, cefrLevel?: CEFRLevel): Promise<DailyConversation | null> {
    // 1. If Supabase configured, check remote active item
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('daily_published_content')
          .select('*')
          .eq('content_type', 'conversation')
          .eq('learning_language', learningLanguage)
          .eq('is_active', true)
          .order('published_at', { ascending: false })
          .limit(1);

        if (cefrLevel) {
          query = query.eq('cefr_level', cefrLevel);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const row = data[0];
          return {
            id: row.id,
            title: row.title,
            scenario: row.scenario || '',
            learning_language: row.learning_language as Language,
            cefr_level: (row.cefr_level || 'B1') as CEFRLevel,
            dialogue: Array.isArray(row.dialogue) ? row.dialogue : [],
            cultural_context: row.cultural_context || '',
            country_name: row.country_name,
            country_code: row.country_code,
            published_at: row.published_at,
            is_active: row.is_active,
          };
        }
      } catch (err) {
        console.warn('Supabase daily conversation fetch error, falling back to local', err);
      }
    }

    // 2. Local fallback
    const all = this.getLocalConversations();
    const active = all.filter(c => c.is_active && c.learning_language === learningLanguage);
    if (active.length === 0) {
      // Never substitute archived content or another target language.
      return null;
    }
    if (cefrLevel) {
      const matchLevel = active.find(c => c.cefr_level === cefrLevel);
      if (matchLevel) return matchLevel;
    }
    return active[0];
  }

  // --- Admin Content Management Methods ---

  public async publishPoem(poemData: Omit<DailyPoem, 'id' | 'published_at' | 'is_active'>): Promise<DailyPoem> {
    const all = this.getLocalPoetry();
    const nowIso = new Date().toISOString();
    const newId = `poem_${Date.now()}`;

    // Archive previous active poem for this language
    const updatedList = all.map(p => {
      if (p.learning_language === poemData.learning_language && p.is_active) {
        return { ...p, is_active: false, archived_at: nowIso };
      }
      return p;
    });

    const newPoem: DailyPoem = {
      ...poemData,
      id: newId,
      published_at: nowIso,
      is_active: true,
    };

    updatedList.unshift(newPoem);
    this.saveLocalPoetry(updatedList);

    // Sync to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        // Archive remote
        await supabase
          .from('daily_published_content')
          .update({ is_active: false, archived_at: nowIso })
          .eq('content_type', 'poetry')
          .eq('learning_language', poemData.learning_language);

        // Insert new
        await supabase.from('daily_published_content').insert({
          id: newId,
          content_type: 'poetry',
          title: newPoem.title,
          author_or_speaker: newPoem.author,
          learning_language: newPoem.learning_language,
          cefr_level: newPoem.cefr_level,
          excerpt: newPoem.excerpt,
          full_content: newPoem.full_text,
          cultural_context: newPoem.cultural_context,
          country_name: newPoem.country_name,
          country_code: newPoem.country_code,
          translation: newPoem.translation,
          published_at: nowIso,
          is_active: true,
        });
      } catch (err) {
        console.warn('Failed to publish poem to Supabase, saved locally', err);
      }
    }

    this.notify();
    return newPoem;
  }

  public async publishConversation(convoData: Omit<DailyConversation, 'id' | 'published_at' | 'is_active'>): Promise<DailyConversation> {
    const all = this.getLocalConversations();
    const nowIso = new Date().toISOString();
    const newId = `convo_${Date.now()}`;

    // Archive previous active conversation for this language
    const updatedList = all.map(c => {
      if (c.learning_language === convoData.learning_language && c.is_active) {
        return { ...c, is_active: false, archived_at: nowIso };
      }
      return c;
    });

    const newConvo: DailyConversation = {
      ...convoData,
      id: newId,
      published_at: nowIso,
      is_active: true,
    };

    updatedList.unshift(newConvo);
    this.saveLocalConversations(updatedList);

    // Sync to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        // Archive remote
        await supabase
          .from('daily_published_content')
          .update({ is_active: false, archived_at: nowIso })
          .eq('content_type', 'conversation')
          .eq('learning_language', convoData.learning_language);

        // Insert new
        await supabase.from('daily_published_content').insert({
          id: newId,
          content_type: 'conversation',
          title: newConvo.title,
          scenario: newConvo.scenario,
          learning_language: newConvo.learning_language,
          cefr_level: newConvo.cefr_level,
          dialogue: newConvo.dialogue,
          cultural_context: newConvo.cultural_context,
          country_name: newConvo.country_name,
          country_code: newConvo.country_code,
          published_at: nowIso,
          is_active: true,
        });
      } catch (err) {
        console.warn('Failed to publish conversation to Supabase, saved locally', err);
      }
    }

    this.notify();
    return newConvo;
  }

  public async getAllContent(): Promise<DailyContentState> {
    const poetry = this.getLocalPoetry();
    const conversations = this.getLocalConversations();

    return {
      activePoetry: poetry.filter(p => p.is_active),
      activeConversations: conversations.filter(c => c.is_active),
      archivedPoetry: poetry.filter(p => !p.is_active),
      archivedConversations: conversations.filter(c => !c.is_active),
    };
  }

  public async archivePoem(id: string): Promise<boolean> {
    const list = this.getLocalPoetry().map(p => (p.id === id ? { ...p, is_active: false, archived_at: new Date().toISOString() } : p));
    this.saveLocalPoetry(list);
    this.notify();
    return true;
  }

  public async archiveConversation(id: string): Promise<boolean> {
    const list = this.getLocalConversations().map(c => (c.id === id ? { ...c, is_active: false, archived_at: new Date().toISOString() } : c));
    this.saveLocalConversations(list);
    this.notify();
    return true;
  }

  // --- Local Storage Helpers ---

  private getLocalPoetry(): DailyPoem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_POETRY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  private saveLocalPoetry(list: DailyPoem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_POETRY, JSON.stringify(list));
    } catch {}
  }

  private getLocalConversations(): DailyConversation[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  private saveLocalConversations(list: DailyConversation[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(list));
    } catch {}
  }
}

export const dailyContentService = DailyContentService.getInstance();
