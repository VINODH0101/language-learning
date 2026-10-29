import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyMemoryAdapter } from '../../integrations/external-apis/adapters/mymemory/MyMemoryAdapter';
import { FreeDictionaryAdapter } from '../../integrations/external-apis/adapters/free-dictionary/FreeDictionaryAdapter';
import { DicionarioAbertoAdapter } from '../../integrations/external-apis/adapters/dicionario-aberto/DicionarioAbertoAdapter';
import { WikipediaAdapter } from '../../integrations/external-apis/adapters/wikipedia/WikipediaAdapter';
import { JikanAdapter } from '../../integrations/external-apis/adapters/jikan/JikanAdapter';
import { LanguageToolAdapter } from '../../integrations/external-apis/adapters/languagetool/LanguageToolAdapter';
import { GeminiAdapter } from '../../integrations/external-apis/adapters/gemini/GeminiAdapter';
import { ValidationError } from '../../integrations/external-apis/core/ApiError';
import { ApiCache } from '../../integrations/external-apis/core/ApiCache';

describe('External API Adapters Suite', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await ApiCache.getInstance().clearAll();
  });

  // 1. MyMemoryAdapter
  describe('MyMemoryAdapter', () => {
    it('validates input length <= 1000 characters and throws ValidationError on exceed', async () => {
      const adapter = new MyMemoryAdapter();
      const longText = 'A'.repeat(1050);

      await expect(
        adapter.execute({ text: longText, sourceLang: 'pt', targetLang: 'en' })
      ).rejects.toThrow(ValidationError);
    });

    it('falls back to local trilingual dictionary when offline', async () => {
      const adapter = new MyMemoryAdapter();
      // Force fetch rejection across all retries
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await adapter.execute({
        text: 'prerrogativa',
        sourceLang: 'pt',
        targetLang: 'en',
      });

      expect(result.translatedText.toLowerCase()).toContain('prerogative');
      expect(result.isVerified).toBe(true);
    });
  });

  // 2. FreeDictionaryAdapter
  describe('FreeDictionaryAdapter', () => {
    it('validates that language must be English', async () => {
      const adapter = new FreeDictionaryAdapter();

      await expect(
        adapter.execute({ word: 'casa', language: 'pt' })
      ).rejects.toThrow(ValidationError);
    });

    it('normalizes mock Free Dictionary API response with phonetics and definitions', async () => {
      const adapter = new FreeDictionaryAdapter();
      const mockApiData = [
        {
          word: 'resilience',
          phonetic: '/rɪˈzɪl.jəns/',
          phonetics: [{ text: '/rɪˈzɪl.jəns/', audio: 'https://audio.example/resilience.mp3' }],
          meanings: [
            {
              partOfSpeech: 'noun',
              definitions: [
                {
                  definition: 'The capacity to recover quickly from difficulties; toughness.',
                  example: 'Her emotional resilience stood out.',
                },
              ],
            },
          ],
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockApiData,
      } as Response);

      const result = await adapter.execute({ word: 'resilience', language: 'en' });
      expect(result.word).toBe('resilience');
      expect(result.phonetic).toBe('/rɪˈzɪl.jəns/');
      expect(result.phoneticAudioUrl).toBe('https://audio.example/resilience.mp3');
      expect(result.meanings[0].definitions[0]).toContain('The capacity to recover');
    });

    it('falls back to local enVocabulary seed data when fetch fails', async () => {
      const adapter = new FreeDictionaryAdapter();
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Network Error'));

      const result = await adapter.execute({ word: 'resilience', language: 'en' });
      expect(result.word).toBe('resilience');
      expect(result.meanings[0].definitions.length).toBeGreaterThan(0);
    });
  });

  // 3. DicionarioAbertoAdapter
  describe('DicionarioAbertoAdapter', () => {
    it('normalizes Dicionario Aberto XML definitions and extracts grammar groups', async () => {
      const adapter = new DicionarioAbertoAdapter();
      const mockXmlData = [
        {
          word: 'caminho',
          xml: '<entry><form><orth>caminho</orth></form><gramGrp>m.</gramGrp><def>Faixa de terreno por onde se transita de um lugar para outro.</def></entry>',
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockXmlData,
      } as Response);

      const result = await adapter.execute({ word: 'caminho', language: 'pt' });
      expect(result.word).toBe('caminho');
      expect(result.meanings[0].partOfSpeech).toBe('m.');
      expect(result.meanings[0].definitions[0]).toContain('Faixa de terreno');
    });

    it('falls back to local ptVocabulary when offline', async () => {
      const adapter = new DicionarioAbertoAdapter();
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Network Error'));

      const result = await adapter.execute({ word: 'saudade', language: 'pt' });
      expect(result.word).toBe('saudade');
      expect(result.meanings[0].definitions.length).toBeGreaterThan(0);
    });
  });

  // 4. WikipediaAdapter
  describe('WikipediaAdapter', () => {
    it('normalizes Wikipedia on-this-day historical events into reading articles', async () => {
      const adapter = new WikipediaAdapter();
      const mockFeedData = {
        selected: [
          {
            year: 1910,
            text: 'Proclamação da República Portuguesa em Lisboa.',
            pages: [
              {
                title: 'Implantação da República Portuguesa',
                extract: 'A Implantação da República Portuguesa foi o resultado de uma revolução.',
                description: 'Revolução de 5 de Outubro de 1910',
              },
            ],
          },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockFeedData,
      } as Response);

      const articles = await adapter.execute({ language: 'pt' });
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0].title).toContain('1910');
      expect(articles[0].contentParagraphs[0]).toContain('Proclamação da República');
    });

    it('falls back to curated cultural catalog when offline', async () => {
      const adapter = new WikipediaAdapter();
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Network Error'));

      const articles = await adapter.execute({ language: 'pt' });
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0].language).toBe('pt');
    });
  });

  // 5. JikanAdapter
  describe('JikanAdapter', () => {
    it('normalizes Jikan character profiles into pedagogical reading passages', async () => {
      const adapter = new JikanAdapter();
      const mockJikanData = {
        data: [
          {
            mal_id: 1,
            url: 'https://myanimelist.net/character/1/Spike_Spiegel',
            name: 'Spike Spiegel',
            name_kanji: 'スパイク・スピーゲル',
            about: 'Spike Spiegel is a tall and lean bounty hunter born on Mars.',
            images: {
              jpg: {
                image_url: 'https://cdn.myanimelist.net/images/characters/4/50143.jpg',
              },
            },
          },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockJikanData,
      } as Response);

      const entities = await adapter.execute({ query: 'Spike' });
      expect(entities.length).toBe(1);
      expect(entities[0].title).toBe('Spike Spiegel');
      expect(entities[0].japaneseTitle).toBe('スパイク・スピーゲル');
      expect(entities[0].readingPassage).toContain('Spike Spiegel is a tall');
      expect(entities[0].glossary).toBeDefined();
    });
  });

  // 6. LanguageToolAdapter
  describe('LanguageToolAdapter', () => {
    it('normalizes LanguageTool matches and offsets for interactive proofreading', async () => {
      const adapter = new LanguageToolAdapter();
      const mockLTData = {
        matches: [
          {
            message: 'Possível erro de concordância verbal.',
            shortMessage: 'Concordância',
            offset: 0,
            length: 8,
            replacements: [{ value: 'Nós fomos' }],
            rule: {
              id: 'CONCORDANCIA_PLURAL',
              category: { name: 'Gramática' },
              issueType: 'grammar',
            },
          },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLTData,
      } as Response);

      const result = await adapter.execute({
        text: 'Nós foi ao mercado.',
        language: 'pt-BR',
      });

      expect(result.hasErrors).toBe(true);
      expect(result.matches.length).toBe(1);
      expect(result.matches[0].message).toContain('concordância');
      expect(result.matches[0].replacements).toContain('Nós fomos');
    });

    it('falls back to local heuristic detection (false friends & duplicates) when offline', async () => {
      const adapter = new LanguageToolAdapter();
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Network Error'));

      const result = await adapter.execute({
        text: 'Ele comprou o o livro ontem.',
        language: 'pt',
      });

      expect(result.hasErrors).toBe(true);
      expect(result.matches.some(m => m.ruleId === 'CONSECUTIVE_DUPLICATE')).toBe(true);
    });
  });

  // 7. GeminiAdapter
  describe('GeminiAdapter', () => {
    it('generates structured daily lesson payload without client API key exposure', async () => {
      const adapter = new GeminiAdapter();
      expect(adapter.metadata.requiresKey).toBe(false);

      const lesson = await adapter.execute({
        language: 'pt',
        level: 'C1',
      });

      expect(lesson).toBeDefined();
      expect(lesson.language).toBe('pt');
      expect(lesson.cefr_level).toBe('C1');
      expect(lesson.section_4_reading).toBeDefined();
    });
  });
});
