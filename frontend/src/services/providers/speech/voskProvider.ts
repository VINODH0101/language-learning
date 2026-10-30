/**
 * Vosk Offline Speech Recognition Provider
 * https://alphacephei.com/vosk/
 *
 * INVARIANT: Never download large speech models automatically without explicit user consent.
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError, ProviderUnavailableError } from '../types';

export interface VoskRecognitionInput {
  audioBlob: Blob;
  language: string;
  hasUserConsentForModelDownload?: boolean;
}

export class VoskProvider extends BaseProvider<VoskRecognitionInput, string> {
  public readonly metadata: ProviderMetadata = {
    id: 'vosk_offline',
    name: 'Vosk Offline Speech Recognizer',
    description: 'Local WebAssembly speech recognition engine running small acoustic models offline.',
    category: 'speech',
    attribution: 'Alpha Cephei — Apache 2.0 Open Source Speech Recognition',
    attributionUrl: 'https://alphacephei.com/vosk',
    license: 'Apache 2.0',
    isPaid: false,
    requiresKey: false,
  };

  protected validateInput(input: VoskRecognitionInput): void {
    if (!input.audioBlob || input.audioBlob.size === 0) {
      throw new ValidationError(this.metadata.id, 'Arquivo de áudio não pode estar vazio.');
    }
    // Strict Invariant Enforcement
    if (!input.hasUserConsentForModelDownload) {
      throw new ValidationError(
        this.metadata.id,
        'O download de modelos de fala Vosk requer consentimento explícito do usuário para economizar dados.'
      );
    }
  }

  protected generateCacheKey(input: VoskRecognitionInput): string {
    return `${input.language}:${input.audioBlob.size}`;
  }

  protected async fetchRaw(input: VoskRecognitionInput): Promise<unknown> {
    // Simulated WASM / WebWorker Vosk dispatch
    if (typeof window === 'undefined') {
      throw new ProviderUnavailableError(this.metadata.id, 501, 'Vosk offline speech recognition requer ambiente do navegador.');
    }

    return {
      text: 'Áudio reconhecido com sucesso localmente.',
    };
  }

  protected normalize(raw: any): string {
    return (raw?.text || '').trim();
  }
}
