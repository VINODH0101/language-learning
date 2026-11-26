/**
 * Google Gemini Generative AI Provider
 * Optional enhancement for conversational dialogues, exercise distractors, and writing feedback.
 *
 * INVARIANTS:
 * 1. Gemini is strictly an auxiliary synthesis generator, NEVER a verified dictionary authority.
 * 2. All generated content must pass strict schema validation (Zod) before use.
 * 3. Never hardcode private keys in bundles.
 * 4. Deterministic pedagogical fallbacks are guaranteed on any error or offline state.
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError, ProviderUnavailableError } from '../types';
import { GeminiResponseSchema, GeneratedDialogueScenarioSchema } from '../../validation/schemas';
import { DialogueScenario } from '../../../types';

export interface GeminiDialogueInput {
  topic: string;
  language: string;
  cefrLevel: string;
}

export class GeminiProvider extends BaseProvider<GeminiDialogueInput, DialogueScenario> {
  public readonly metadata: ProviderMetadata = {
    id: 'google_gemini',
    name: 'Google Gemini AI (Optional)',
    description: 'Auxiliary generative engine for dynamic conversation scenarios and contextual writing hints.',
    category: 'ai',
    attribution: 'Google Gemini Generative AI (Optional Auxiliary Engine)',
    attributionUrl: 'https://ai.google.dev',
    license: 'Proprietary API with Free Tier',
    isPaid: false,
    requiresKey: true,
  };

  protected validateInput(input: GeminiDialogueInput): void {
    if (!input.topic || input.topic.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'Tópico do diálogo obrigatório.');
    }
  }

  protected generateCacheKey(input: GeminiDialogueInput): string {
    return `${input.language}:${input.cefrLevel}:${input.topic.trim().toLowerCase()}`;
  }

  protected async fetchRaw(input: GeminiDialogueInput, signal: AbortSignal): Promise<unknown> {
    // ADR-002: Never read or transmit provider API keys in client bundles or localStorage.
    // Browser calls optionally proxy through the server-side Content API; otherwise
    // BaseProvider invokes getFallback() deterministically.
    const apiBase =
      typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CONTENT_API_BASE
        ? String((import.meta as any).env.VITE_CONTENT_API_BASE).replace(/\/+$/, '')
        : '';

    if (!apiBase) {
      throw new ProviderUnavailableError(
        this.metadata.id,
        503,
        'Síntese Gemini disponível apenas no backend; usando fallback determinístico local.'
      );
    }

    const response = await fetch(`${apiBase}/ai/dialogue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: input.topic,
        targetLanguage: input.language,
        cefrLevel: input.cefrLevel,
      }),
      signal,
    });

    if (!response.ok) {
      throw new ProviderUnavailableError(
        this.metadata.id,
        response.status,
        `Backend AI Proxy HTTP ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  }

  protected normalize(raw: any, input: GeminiDialogueInput): DialogueScenario {
    const parsedGemini = GeminiResponseSchema.parse(raw);
    const textPart = parsedGemini.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textPart) {
      throw new Error('Gemini retornou resposta vazia.');
    }

    // Extract JSON block if enclosed in markdown backticks
    const cleanedJson = textPart.replace(/```json/gi, '').replace(/```/g, '').trim();
    const rawParsed = JSON.parse(cleanedJson);

    // Validate generated output structure against strict Zod schema
    const validated = GeneratedDialogueScenarioSchema.parse(rawParsed);

    return {
      id: `ai-dialogue-${Date.now()}`,
      language: input.language as any,
      title: validated.title,
      category: 'travel',
      cefr_level: input.cefrLevel as any,
      context: validated.context,
      turns: validated.turns.map(t => ({
        speaker: t.speaker,
        line: t.line,
        translation: t.translation,
      })),
      pragmatic_tips: validated.pragmatic_tips,
      vocabulary: [],
    };
  }

  /**
   * Guaranteed deterministic offline fallback dialogue.
   */
  protected getFallback(input: GeminiDialogueInput): DialogueScenario {
    return {
      id: `deterministic-dialogue-${input.language}`,
      language: input.language as any,
      title: `Diálogo Prático: ${input.topic}`,
      category: 'work',
      cefr_level: (input.cefrLevel as any) || 'B2',
      context: `Cenário conversacional autêntico para prática oral e compreensão sobre ${input.topic}.`,
      turns: [
        {
          speaker: 'Sofia',
          line: input.language === 'en' ? 'Could you clarify the main point?' : input.language === 'es' ? '¿Podrías aclarar el punto principal?' : 'Poderia esclarecer o ponto principal?',
          translation: 'Poderia esclarecer o ponto principal da reunião?',
        },
        {
          speaker: 'Mateo',
          line: input.language === 'en' ? 'Certainly. We must prioritize customer feedback.' : input.language === 'es' ? 'Por supuesto. Debemos priorizar las opiniones de los usuarios.' : 'Certamente. Devemos priorizar as sugestões dos utilizadores.',
          translation: 'Certamente. Devemos priorizar as sugestões dos utilizadores.',
        },
      ],
      pragmatic_tips: [
        'Utilize marcadores discursivos para expressar cordialidade.',
        'Mantenha entonação pausada em perguntas abertas.',
      ],
      vocabulary: [],
    };
  }
}
