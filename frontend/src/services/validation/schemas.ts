/**
 * Zod Schemas for Validating External API Responses
 * Lexilume — Illuminate Your Words
 */

import { z } from 'zod';

// ============================================================================
// A. TRANSLATION SCHEMAS
// ============================================================================

export const MyMemoryResponseSchema = z.object({
  responseData: z.object({
    translatedText: z.string(),
    match: z.number().optional().default(0.85),
  }),
  responseStatus: z.union([z.number(), z.string()]).optional(),
  responderId: z.string().nullable().optional(),
  matches: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]).optional(),
        segment: z.string().optional(),
        translation: z.string(),
        quality: z.union([z.string(), z.number()]).optional(),
        'created-by': z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export const LibreTranslateResponseSchema = z.object({
  translatedText: z.string(),
  detectedLanguage: z
    .object({
      confidence: z.number().optional(),
      language: z.string().optional(),
    })
    .optional(),
  error: z.string().optional(),
});

// ============================================================================
// B. DICTIONARY SCHEMAS
// ============================================================================

export const FreeDictionaryEntrySchema = z.object({
  word: z.string(),
  phonetic: z.string().optional(),
  phonetics: z
    .array(
      z.object({
        text: z.string().optional(),
        audio: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  meanings: z
    .array(
      z.object({
        partOfSpeech: z.string(),
        definitions: z.array(
          z.object({
            definition: z.string(),
            example: z.string().optional(),
            synonyms: z.array(z.string()).optional().default([]),
            antonyms: z.array(z.string()).optional().default([]),
          })
        ),
        synonyms: z.array(z.string()).optional().default([]),
        antonyms: z.array(z.string()).optional().default([]),
      })
    )
    .default([]),
  sourceUrls: z.array(z.string()).optional().default([]),
});

export const FreeDictionaryListSchema = z.array(FreeDictionaryEntrySchema);

export const DicionarioAbertoEntrySchema = z.object({
  entry: z.object({
    form: z.string().optional(),
    sense: z.union([
      z.array(
        z.object({
          def: z.string().optional(),
          gramGrp: z.string().optional(),
        })
      ),
      z.object({
        def: z.string().optional(),
        gramGrp: z.string().optional(),
      }),
    ]),
  }),
});

export const KaikkiSenseSchema = z.object({
  glosses: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  examples: z
    .array(
      z.union([
        z.string(),
        z.object({
          text: z.string(),
          translation: z.string().optional(),
        }),
      ])
    )
    .optional()
    .default([]),
  synonyms: z.array(z.union([z.string(), z.object({ word: z.string() })])).optional().default([]),
  antonyms: z.array(z.union([z.string(), z.object({ word: z.string() })])).optional().default([]),
});

export const KaikkiEntrySchema = z.object({
  word: z.string(),
  pos: z.string(),
  lang_code: z.string(),
  sounds: z
    .array(
      z.object({
        ipa: z.string().optional(),
        audio: z.string().optional(),
        tags: z.array(z.string()).optional().default([]),
      })
    )
    .optional()
    .default([]),
  senses: z.array(KaikkiSenseSchema).optional().default([]),
  etymology_text: z.string().optional(),
  forms: z
    .array(
      z.object({
        form: z.string(),
        tags: z.array(z.string()).optional().default([]),
      })
    )
    .optional()
    .default([]),
});

// ============================================================================
// C. EXAMPLE SENTENCES & CORPORA
// ============================================================================

export const TatoebaSentenceSchema = z.object({
  id: z.number(),
  text: z.string(),
  lang: z.string(),
  translations: z
    .array(
      z.array(
        z.object({
          id: z.number(),
          text: z.string(),
          lang: z.string(),
        })
      )
    )
    .optional()
    .default([]),
  audio: z
    .array(
      z.object({
        id: z.number().optional(),
        author: z.string().optional(),
        url: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export const TatoebaSearchResponseSchema = z.object({
  results: z.array(TatoebaSentenceSchema).default([]),
  paging: z
    .object({
      total: z.number().optional(),
      count: z.number().optional(),
      page: z.number().optional(),
    })
    .optional(),
});

export const OpusSentencePairSchema = z.object({
  id: z.string(),
  corpus: z.string(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  sourceText: z.string(),
  targetText: z.string(),
  license: z.string(),
  alignmentConfidence: z.number().min(0).max(1).default(1),
  isPedagogicallyVerified: z.boolean().default(false),
});

// ============================================================================
// D. VOCABULARY FREQUENCY
// ============================================================================

export const FrequencyWordRecordSchema = z.object({
  word: z.string(),
  language: z.string(),
  rank: z.number().int().positive(),
  frequencyPerMillion: z.number().nonnegative(),
  datasetVersion: z.string(),
  datasetSource: z.string(),
  regionalVariant: z.string().optional(),
});

// ============================================================================
// E. READING RESOURCES
// ============================================================================

export const WikipediaSummarySchema = z.object({
  title: z.string(),
  extract: z.string(),
  description: z.string().optional(),
  thumbnail: z
    .object({
      source: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional(),
  content_urls: z
    .object({
      desktop: z
        .object({
          page: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export const GutendexBookSchema = z.object({
  id: z.number(),
  title: z.string(),
  authors: z
    .array(
      z.object({
        name: z.string(),
        birth_year: z.number().nullable().optional(),
        death_year: z.number().nullable().optional(),
      })
    )
    .default([]),
  languages: z.array(z.string()).default([]),
  subjects: z.array(z.string()).default([]),
  bookshelves: z.array(z.string()).default([]),
  copyright: z.boolean().nullable().optional(),
  formats: z.record(z.string(), z.string()).default({}),
  download_count: z.number().default(0),
});

export const GutendexResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable().optional(),
  previous: z.string().nullable().optional(),
  results: z.array(GutendexBookSchema).default([]),
});

export const OpenLibraryWorkSchema = z.object({
  key: z.string(),
  title: z.string(),
  author_name: z.array(z.string()).optional().default([]),
  first_publish_year: z.number().optional(),
  language: z.array(z.string()).optional().default([]),
  cover_i: z.number().optional(),
  edition_count: z.number().optional().default(1),
  public_scan_b: z.boolean().optional().default(false),
  has_fulltext: z.boolean().optional().default(false),
});

export const OpenLibrarySearchResponseSchema = z.object({
  numFound: z.number(),
  docs: z.array(OpenLibraryWorkSchema).default([]),
});

// ============================================================================
// F. MEDIA RESOURCES
// ============================================================================

export const WikimediaImageInfoSchema = z.object({
  query: z
    .object({
      pages: z.record(
        z.string(),
        z.object({
          title: z.string().optional(),
          imageinfo: z
            .array(
              z.object({
                url: z.string(),
                descriptionurl: z.string().optional(),
                descriptionshorturl: z.string().optional(),
                thumburl: z.string().optional(),
                extmetadata: z
                  .object({
                    Artist: z.object({ value: z.string() }).optional(),
                    LicenseShortName: z.object({ value: z.string() }).optional(),
                    LicenseUrl: z.object({ value: z.string() }).optional(),
                    Credit: z.object({ value: z.string() }).optional(),
                  })
                  .optional(),
              })
            )
            .optional(),
        })
      ),
    })
    .optional(),
});

export const OpenverseImageSchema = z.object({
  id: z.string(),
  title: z.string(),
  creator: z.string().nullable().optional(),
  creator_url: z.string().nullable().optional(),
  url: z.string(),
  thumbnail: z.string().nullable().optional(),
  license: z.string(),
  license_version: z.string().optional(),
  license_url: z.string().nullable().optional(),
  foreign_landing_url: z.string().optional(),
  detail_url: z.string().optional(),
});

export const OpenverseResponseSchema = z.object({
  result_count: z.number(),
  page_count: z.number().optional(),
  results: z.array(OpenverseImageSchema).default([]),
});

// ============================================================================
// G. SPEECH & GRAMMAR SCHEMAS
// ============================================================================

export const LanguageToolMatchSchema = z.object({
  message: z.string(),
  shortMessage: z.string().optional(),
  offset: z.number(),
  length: z.number(),
  replacements: z.array(z.object({ value: z.string() })).default([]),
  rule: z
    .object({
      id: z.string(),
      description: z.string().optional(),
      issueType: z.string().optional().default('grammar'),
      category: z.object({ id: z.string(), name: z.string().optional() }).optional(),
    })
    .optional(),
});

export const LanguageToolResponseSchema = z.object({
  matches: z.array(LanguageToolMatchSchema).default([]),
  software: z.object({ name: z.string(), version: z.string() }).optional(),
  language: z.object({ name: z.string(), code: z.string() }).optional(),
});

// ============================================================================
// H. AI GENERATOR SCHEMAS
// ============================================================================

export const GeminiCandidateSchema = z.object({
  content: z.object({
    parts: z.array(z.object({ text: z.string() })),
  }),
  finishReason: z.string().optional(),
});

export const GeminiResponseSchema = z.object({
  candidates: z.array(GeminiCandidateSchema).optional().default([]),
  promptFeedback: z.any().optional(),
});

export const GeneratedDialogueTurnSchema = z.object({
  speaker: z.string(),
  line: z.string(),
  translation: z.string(),
});

export const GeneratedDialogueScenarioSchema = z.object({
  title: z.string(),
  context: z.string(),
  turns: z.array(GeneratedDialogueTurnSchema).min(2),
  pragmatic_tips: z.array(z.string()).default([]),
});
