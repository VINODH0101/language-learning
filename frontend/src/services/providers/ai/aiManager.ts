/**
 * AI Synthesis Manager
 * Dispatches dialogue generation to Gemini with deterministic pedagogical fallback.
 */

import { GeminiProvider, GeminiDialogueInput } from './geminiProvider';
import { DialogueScenario } from '../../../types';

export class AiManager {
  private static instance: AiManager;
  private gemini = new GeminiProvider();

  private constructor() {}

  public static getInstance(): AiManager {
    if (!AiManager.instance) {
      AiManager.instance = new AiManager();
    }
    return AiManager.instance;
  }

  public async generateDialogue(input: GeminiDialogueInput): Promise<DialogueScenario> {
    return await this.gemini.execute(input);
  }
}
