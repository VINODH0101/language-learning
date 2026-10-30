/**
 * Whisper Speech-to-Text Provider (Self-Hosted / OpenAI-compatible endpoint)
 * https://github.com/openai/whisper
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError, ProviderUnavailableError } from '../types';

export interface WhisperTranscriptionInput {
  audioBlob: Blob;
  language?: string;
}

export class WhisperProvider extends BaseProvider<WhisperTranscriptionInput, string> {
  private endpoint: string;

  public readonly metadata: ProviderMetadata = {
    id: 'whisper_stt',
    name: 'OpenAI Whisper (Self-Hosted)',
    description: 'Self-hosted speech recognition server running open-source Whisper models.',
    category: 'speech',
    attribution: 'OpenAI Whisper — MIT License (Self-Hosted Server)',
    attributionUrl: 'https://github.com/openai/whisper',
    license: 'MIT',
    isPaid: false,
    requiresKey: false,
  };

  constructor(endpoint?: string) {
    super();
    this.endpoint =
      endpoint ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_WHISPER_URL) ||
      'http://localhost:8000/v1/audio/transcriptions';
  }

  protected validateInput(input: WhisperTranscriptionInput): void {
    if (!input.audioBlob || input.audioBlob.size === 0) {
      throw new ValidationError(this.metadata.id, 'Arquivo de áudio não pode estar vazio.');
    }
  }

  protected generateCacheKey(input: WhisperTranscriptionInput): string {
    return `${input.language || 'auto'}:${input.audioBlob.size}`;
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.endpoint.replace('/audio/transcriptions', '/health')}`);
      return res.ok;
    } catch {
      return false;
    }
  }

  protected async fetchRaw(input: WhisperTranscriptionInput, signal: AbortSignal): Promise<unknown> {
    const formData = new FormData();
    formData.append('file', input.audioBlob, 'recording.webm');
    formData.append('model', 'whisper-1');
    if (input.language) {
      formData.append('language', input.language);
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      body: formData,
      signal,
    });

    if (!response.ok) {
      throw new ProviderUnavailableError(
        this.metadata.id,
        response.status,
        `Whisper STT HTTP ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  }

  protected normalize(raw: any): string {
    return (raw?.text || '').trim();
  }
}
