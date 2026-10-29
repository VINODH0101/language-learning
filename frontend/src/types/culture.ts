import { Language, CEFRLevel } from './index';

export type CultureRegion =
  | 'Asia'
  | 'Europe'
  | 'Africa'
  | 'Americas'
  | 'Middle East'
  | 'Oceania'
  | 'Global';

export type CultureTopic =
  | 'festivals'
  | 'food'
  | 'history'
  | 'music'
  | 'art'
  | 'traditions'
  | 'literature'
  | 'society'
  | 'travel'
  | 'news';

export type CultureContentType =
  | 'original_lesson'
  | 'cultural_guide'
  | 'external_article'
  | 'recent_news';

export interface ComprehensionQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface CulturalArticle {
  id: string;
  title: string;
  summary: string;
  content_paragraphs: string[];
  content_translation?: string[];
  content_language: Language;
  target_learning_language: Language;
  origin_country: string;
  origin_region: CultureRegion;
  topic: CultureTopic;
  content_type: CultureContentType;
  cefr_level: CEFRLevel;
  read_time_minutes: number;
  tags: string[];
  glossary?: Record<string, string>;
  comprehension_questions?: ComprehensionQuestion[];
  source_url: string;
  publisher: string;
  published_at: string;
  license: string;
  attribution_text: string;
  image_url?: string;
}

export interface CultureFilterState {
  origin_country?: string;
  origin_region?: CultureRegion | 'all';
  content_language?: Language | 'all';
  cefr_level?: CEFRLevel | 'all';
  topic?: CultureTopic | 'all';
  content_type?: CultureContentType | 'all';
  search_query?: string;
}

export interface CulturalBookmark {
  id: string;
  user_id: string;
  article_id: string;
  article_title: string;
  content_language: Language;
  origin_country: string;
  topic: string;
  cefr_level: CEFRLevel;
  created_at: string;
}
