/**
 * Comprehensive Unit Test Suite for Lexilume Provider Architecture
 * Lexilume — Illuminate Your Words
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MyMemoryProvider,
  LibreTranslateProvider,
  LocalTranslationProvider,
  TranslationManager,
  KaikkiProvider,
  DictionaryIndex,
  DictionaryManager,
  TatoebaProvider,
  OpusProvider,
  ExamplesManager,
  FrequencyWordsProvider,
  GutendexProvider,
  OpenLibraryProvider,
  WikipediaReadingProvider,
  WikimediaCommonsProvider,
  OpenverseProvider,
  WebSpeechProvider,
  VoskProvider,
  WhisperProvider,
  LanguageToolProvider,
  GeminiProvider,
  ValidationError,
  ProviderUnavailableError,
} from '../../services/providers';
import { ProviderCache } from '../../services/cache/providerCache';
import { ProviderHealthTracker, sanitizeLog } from '../../services/monitoring/providerHealth';

describe('Lexilume Provider Integration Layer', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await ProviderCache.getInstance().clearAll();
    DictionaryIndex.getInstance().clear();
  });

  // ==========================================================================
  // 1. TRANSLATION PROVIDERS & CASCADE
  // ==========================================================================
  describe('Translation Providers', () => {
    it('MyMemoryProvider validates input and throws on text > 1000 characters', async () => {
      const provider = new MyMemoryProvider();
      await expect(
        provider.execute({ text: 'a'.repeat(1001), sourceLang: 'pt', targetLang: 'en' })
      ).rejects.toThrow(ValidationError);
    });

    it('MyMemoryProvider falls back to local dictionary when network fails', async () => {
      const provider = new MyMemoryProvider();
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network offline'));

      const result = await provider.execute({
        text: 'prerrogativa',
        sourceLang: 'pt',
        targetLang: 'en',
      });

      expect(result.translatedText.toLowerCase()).toContain('prerogative');
      expect(result.isVerified).toBe(true);
    });

    it('LocalTranslationProvider provides deterministic offline translations', async () => {
      const local = new LocalTranslationProvider();
      const result = await local.execute({
        text: 'prerrogativa',
        sourceLang: 'pt',
        targetLang: 'en',
      });

      expect(result.translatedText).toBeDefined();
      expect(result.isVerified).toBe(true);
      expect(result.matchConfidence).toBe(1.0);
    });

    it('TranslationManager cascades to local translation on remote failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('All networks down'));
      const manager = TranslationManager.getInstance();

      const result = await manager.translate('prerrogativa', 'pt', 'en');
      expect(result.translatedText).toBeDefined();
      expect(result.isVerified).toBe(true);
    });
  });

  // ==========================================================================
  // 2. DICTIONARY PROVIDERS & MINISEARCH INDEX
  // ==========================================================================
  describe('Dictionary Providers & Search Index', () => {
    it('KaikkiProvider validates word input', async () => {
      const provider = new KaikkiProvider();
      await expect(provider.execute({ word: '', language: 'pt' })).rejects.toThrow(ValidationError);
    });

    it('DictionaryIndex indexes and performs fast prefix and fuzzy searches', () => {
      const index = DictionaryIndex.getInstance();
      index.addEntry({
        word: 'serendipity',
        language: 'en',
        meanings: [
          {
            partOfSpeech: 'noun',
            definitions: ['Finding valuable things not sought for.'],
          },
        ],
        provider: 'test',
      });

      // Prefix match
      const prefixResults = index.search('seren', 'en');
      expect(prefixResults.length).toBeGreaterThan(0);
      expect(prefixResults[0].word).toBe('serendipity');

      // Fuzzy match
      const fuzzyResults = index.search('serendipiti', 'en');
      expect(fuzzyResults.length).toBeGreaterThan(0);
      expect(fuzzyResults[0].word).toBe('serendipity');
    });

    it('DictionaryManager handles Portuguese and Spanish lookups with seed fallbacks', async () => {
      const manager = DictionaryManager.getInstance();
      const result = await manager.lookup('exquisito', 'es');
      expect(result.word).toBe('exquisito');
      expect(result.meanings.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 3. EXAMPLE SENTENCE PROVIDERS
  // ==========================================================================
  describe('Example Sentence Providers', () => {
    it('TatoebaProvider normalizes search results with attribution', async () => {
      const provider = new TatoebaProvider();
      const mockResponse = {
        results: [
          {
            id: 12345,
            text: 'O livro está na mesa.',
            lang: 'por',
            translations: [[{ id: 67890, text: 'The book is on the table.', lang: 'eng' }]],
            audio: [{ id: 1, author: 'native_speaker', url: 'https://audio.tatoeba.org/12345.mp3' }],
          },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const results = await provider.execute({
        query: 'livro',
        sourceLang: 'pt',
        targetLang: 'en',
      });

      expect(results.length).toBe(1);
      expect(results[0].sourceText).toBe('O livro está na mesa.');
      expect(results[0].targetText).toBe('The book is on the table.');
      expect(results[0].audioUrl).toBe('https://audio.tatoeba.org/12345.mp3');
      expect(results[0].isPedagogicallyVerified).toBe(true);
    });

    it('OpusProvider marks raw corpus sentences as unverified by default', async () => {
      const provider = new OpusProvider();
      const mockResponse = {
        results: [
          {
            source: 'Raw corpus source sentence.',
            target: 'Raw corpus target translation.',
            corpus: 'OpenSubtitles',
          },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const results = await provider.execute({
        query: 'sentence',
        sourceLang: 'en',
        targetLang: 'es',
      });

      expect(results.length).toBe(1);
      expect(results[0].isPedagogicallyVerified).toBe(false);
    });
  });

  // ==========================================================================
  // 4. VOCABULARY FREQUENCY PROVIDER
  // ==========================================================================
  describe('FrequencyWordsProvider', () => {
    it('retrieves empirical frequency rank and per-million statistics for core lemmas', async () => {
      const provider = new FrequencyWordsProvider();
      const result = await provider.execute({ word: 'serendipity', language: 'en' });

      expect(result.word).toBe('serendipity');
      expect(result.rank).toBe(18450);
      expect(result.frequencyPerMillion).toBe(1.2);
      expect(result.datasetSource).toContain('wordfreq');
    });
  });

  // ==========================================================================
  // 5. READING RESOURCES
  // ==========================================================================
  describe('Reading Providers (Gutendex & Open Library)', () => {
    it('GutendexProvider extracts public domain books and download formats', async () => {
      const provider = new GutendexProvider();
      const mockData = {
        count: 1,
        results: [
          {
            id: 84,
            title: 'Frankenstein; Or, The Modern Prometheus',
            authors: [{ name: 'Shelley, Mary Wollstonecraft' }],
            languages: ['en'],
            subjects: ['Science fiction', 'Monsters'],
            bookshelves: ['Precursors of Science Fiction'],
            copyright: false,
            formats: {
              'text/plain; charset=utf-8': 'https://gutenberg.org/files/84/84-0.txt',
              'image/jpeg': 'https://gutenberg.org/covers/84.jpg',
            },
            download_count: 50000,
          },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const books = await provider.execute({ language: 'en', topic: 'fiction' });
      expect(books.length).toBe(1);
      expect(books[0].title).toContain('Frankenstein');
      expect(books[0].isPublicDomain).toBe(true);
      expect(books[0].readableFormatUrl).toBe('https://gutenberg.org/files/84/84-0.txt');
    });

    it('OpenLibraryProvider normalizes book search metadata', async () => {
      const provider = new OpenLibraryProvider();
      const mockData = {
        numFound: 1,
        docs: [
          {
            key: '/works/OL123W',
            title: 'Dom Casmurro',
            author_name: ['Machado de Assis'],
            first_publish_year: 1899,
            language: ['por'],
            cover_i: 4567,
            public_scan_b: true,
          },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const books = await provider.execute({ query: 'Dom Casmurro' });
      expect(books.length).toBe(1);
      expect(books[0].title).toBe('Dom Casmurro');
      expect(books[0].authors).toContain('Machado de Assis');
      expect(books[0].coverUrl).toContain('4567-M.jpg');
    });
  });

  // ==========================================================================
  // 6. MEDIA RESOURCES & ATTRIBUTION
  // ==========================================================================
  describe('Media Providers (Wikimedia Commons & Openverse)', () => {
    it('WikimediaCommonsProvider normalizes media metadata and author attribution', async () => {
      const provider = new WikimediaCommonsProvider();
      const mockData = {
        query: {
          pages: {
            '101': {
              title: 'File:Amazon_Rainforest.jpg',
              imageinfo: [
                {
                  url: 'https://upload.wikimedia.org/Amazon.jpg',
                  thumburl: 'https://upload.wikimedia.org/Amazon_thumb.jpg',
                  extmetadata: {
                    Artist: { value: 'Jane Photographer' },
                    LicenseShortName: { value: 'CC-BY-SA-4.0' },
                    Credit: { value: 'Jane Photographer via Wikimedia Commons' },
                  },
                },
              ],
            },
          },
        },
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const items = await provider.execute({ query: 'Amazon Rainforest' });
      expect(items.length).toBe(1);
      expect(items[0].url).toBe('https://upload.wikimedia.org/Amazon.jpg');
      expect(items[0].author).toBe('Jane Photographer');
      expect(items[0].license).toBe('CC-BY-SA-4.0');
    });

    it('OpenverseProvider validates Creative Commons images', async () => {
      const provider = new OpenverseProvider();
      const mockData = {
        result_count: 1,
        results: [
          {
            id: 'openverse-001',
            title: 'Lisbon Tram',
            creator: 'Carlos Silva',
            url: 'https://openverse.example/tram.jpg',
            license: 'by-sa',
          },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const items = await provider.execute({ query: 'Lisbon Tram' });
      expect(items.length).toBe(1);
      expect(items[0].title).toBe('Lisbon Tram');
      expect(items[0].license).toBe('BY-SA');
    });
  });

  // ==========================================================================
  // 7. SPEECH RESOURCES & CONSENT INVARIANT
  // ==========================================================================
  describe('Speech Providers & User Consent Guard', () => {
    it('WebSpeechProvider checks client capability safely', () => {
      const provider = new WebSpeechProvider();
      expect(typeof provider.isSynthesisSupported()).toBe('boolean');
      expect(typeof provider.isRecognitionSupported()).toBe('boolean');
    });

    it('VoskProvider ENFORCES user consent invariant before model initialization', async () => {
      const provider = new VoskProvider();
      const dummyBlob = new Blob(['audio-data'], { type: 'audio/webm' });

      // Invariant: Calling Vosk without user consent MUST throw ValidationError
      await expect(
        provider.execute({
          audioBlob: dummyBlob,
          language: 'pt',
          hasUserConsentForModelDownload: false,
        })
      ).rejects.toThrow(ValidationError);

      // Calling with consent succeeds
      const result = await provider.execute({
        audioBlob: dummyBlob,
        language: 'pt',
        hasUserConsentForModelDownload: true,
      });
      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // 8. GRAMMAR & AUXILIARY AI
  // ==========================================================================
  describe('Grammar & AI Synthesis', () => {
    it('LanguageToolProvider validates character length limits <= 5000', async () => {
      const provider = new LanguageToolProvider();
      await expect(
        provider.execute({ text: 'x'.repeat(5005), language: 'pt-BR' })
      ).rejects.toThrow(ValidationError);
    });

    it('GeminiProvider returns deterministic pedagogical fallback when offline or unconfigured', async () => {
      const provider = new GeminiProvider();
      // Simulate unconfigured or missing API key
      const result = await provider.execute({
        topic: 'Business Meeting',
        language: 'en',
        cefrLevel: 'B2',
      });

      expect(result.title).toContain('Business Meeting');
      expect(result.turns.length).toBeGreaterThanOrEqual(2);
      expect(result.pragmatic_tips.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 9. MONITORING, LOG SANITIZATION, AND CACHING
  // ==========================================================================
  describe('Monitoring, Privacy Scrubbing, and Caching', () => {
    it('sanitizeLog scrubs API keys, Bearer tokens, emails, and passwords', () => {
      const sensitive =
        'Error with api_key=AIzaSySecret123456 and token=ab12cd34ef56 and email learner@example.com with Bearer eyJhbGciOiJIUzI1NiIsIn';
      const scrubbed = sanitizeLog(sensitive);

      expect(scrubbed).not.toContain('AIzaSySecret123456');
      expect(scrubbed).not.toContain('learner@example.com');
      expect(scrubbed).not.toContain('eyJhbGciOiJIUzI1NiIsIn');
      expect(scrubbed).toContain('[REDACTED_SECRET]');
      expect(scrubbed).toContain('[REDACTED_EMAIL]');
      expect(scrubbed).toContain('[REDACTED_TOKEN]');
    });

    it('ProviderHealthTracker tracks success and failure rates per provider', () => {
      const tracker = ProviderHealthTracker.getInstance();
      tracker.registerProvider('test_provider', 'Test Service', 'translation');

      tracker.recordSuccess('test_provider', 120);
      expect(tracker.getStatus('test_provider')?.status).toBe('healthy');
      expect(tracker.getStatus('test_provider')?.averageLatencyMs).toBe(120);

      tracker.recordFailure('test_provider', new Error('Timeout connection'));
      expect(tracker.getStatus('test_provider')?.status).toBe('degraded');
      expect(tracker.getStatus('test_provider')?.failedRequests).toBe(1);
    });

    it('ProviderCache stores and retrieves data with expiration check', async () => {
      const cache = ProviderCache.getInstance();
      await cache.set('test_provider', 'key1', { foo: 'bar' }, 5000);

      const retrieved = await cache.get<{ foo: string }>('test_provider', 'key1');
      expect(retrieved).toEqual({ foo: 'bar' });

      // Expired entry check
      await cache.set('test_provider', 'key_expired', { foo: 'expired' }, -100);
      const expired = await cache.get('test_provider', 'key_expired');
      expect(expired).toBeNull();
    });
  });
});
