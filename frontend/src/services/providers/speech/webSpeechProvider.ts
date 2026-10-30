/**
 * Browser Web Speech API Provider
 * Zero-cost, local client-side SpeechSynthesis and SpeechRecognition.
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError, ProviderUnavailableError } from '../types';

export interface SpeechSynthesisInput {
  text: string;
  lang: string;
  pitch?: number;
  rate?: number;
}

export class WebSpeechProvider extends BaseProvider<SpeechSynthesisInput, boolean> {
  public readonly metadata: ProviderMetadata = {
    id: 'web_speech_api',
    name: 'Browser Web Speech API (W3C)',
    description: 'Built-in browser synthesis and recognition running locally without network bandwidth.',
    category: 'speech',
    attribution: 'W3C Web Speech API Specification',
    license: 'Built-in Web Standard',
    isPaid: false,
    requiresKey: false,
  };

  protected validateInput(input: SpeechSynthesisInput): void {
    if (!input.text || input.text.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'Texto para fala não pode estar vazio.');
    }
  }

  protected generateCacheKey(input: SpeechSynthesisInput): string {
    return `${input.lang}:${input.text.trim()}`;
  }

  public isSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public isRecognitionSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  protected async fetchRaw(input: SpeechSynthesisInput): Promise<boolean> {
    if (!this.isSynthesisSupported()) {
      throw new ProviderUnavailableError(this.metadata.id, 501, 'Web Speech Synthesis não é suportado neste navegador.');
    }

    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(input.text);
      utterance.lang = input.lang;
      if (input.pitch) utterance.pitch = input.pitch;
      if (input.rate) utterance.rate = input.rate;

      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);

      window.speechSynthesis.speak(utterance);
    });
  }

  protected normalize(raw: any): boolean {
    return Boolean(raw);
  }
}
