/**
 * Lexilume — Daily Learning Content Types
 * 
 * Defines Administrator-managed Daily Poetry and Daily Conversation models.
 */

import { Language, CEFRLevel } from './index';

export interface DialogueLine {
  speaker: string;
  line: string;
  translation?: string;
  audio_url?: string;
}

export interface DailyPoem {
  id: string;
  title: string;
  author: string;
  learning_language: Language;
  cefr_level: CEFRLevel;
  excerpt: string;
  full_text: string;
  cultural_context: string;
  country_name?: string;
  country_code?: string;
  translation?: string;
  published_at: string;
  is_active: boolean;
  archived_at?: string;
  created_by?: string;
}

export interface DailyConversation {
  id: string;
  title: string;
  scenario: string;
  learning_language: Language;
  cefr_level: CEFRLevel;
  dialogue: DialogueLine[];
  cultural_context: string;
  country_name?: string;
  country_code?: string;
  published_at: string;
  is_active: boolean;
  archived_at?: string;
  created_by?: string;
}

export interface DailyContentState {
  activePoetry: DailyPoem[];
  activeConversations: DailyConversation[];
  archivedPoetry: DailyPoem[];
  archivedConversations: DailyConversation[];
}
