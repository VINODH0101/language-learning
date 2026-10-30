/**
 * Speech Manager
 * Coordinates Web Speech API (TTS/STT), self-hosted Whisper, and consent-gated Vosk offline models.
 */

import { WebSpeechProvider, SpeechSynthesisInput } from './webSpeechProvider';
import { WhisperProvider, WhisperTranscriptionInput } from './whisperProvider';
import { VoskProvider, VoskRecognitionInput } from './voskProvider';

export class SpeechManager {
  private static instance: SpeechManager;
  private webSpeech = new WebSpeechProvider();
  private whisper = new WhisperProvider();
  private vosk = new VoskProvider();

  private constructor() {}

  public static getInstance(): SpeechManager {
    if (!SpeechManager.instance) {
      SpeechManager.instance = new SpeechManager();
    }
    return SpeechManager.instance;
  }

  public async speak(input: SpeechSynthesisInput): Promise<boolean> {
    return await this.webSpeech.execute(input);
  }

  public async transcribeAudio(
    audioBlob: Blob,
    language?: string,
    options?: { preferOffline?: boolean; userConsented?: boolean }
  ): Promise<string> {
    if (options?.preferOffline && options.userConsented) {
      try {
        return await this.vosk.execute({
          audioBlob,
          language: language || 'en',
          hasUserConsentForModelDownload: true,
        });
      } catch (err) {
        console.warn('[SpeechManager] Vosk recognition failed, trying Whisper...', err);
      }
    }

    try {
      return await this.whisper.execute({ audioBlob, language });
    } catch (err) {
      console.warn('[SpeechManager] Whisper recognition failed:', err);
      throw err;
    }
  }
}
