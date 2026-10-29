/**
 * Zero-cost Web Speech API service for text-to-speech and voice practice.
 */

import { enforceRegionalVariety } from '../lib/languages/languageMatrix';

export class SpeechService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;

  static getVoiceLang(language: 'pt' | 'es' | 'en', variety: string = 'all'): string {
    const validVariety = enforceRegionalVariety(language, variety);

    if (language === 'en') {
      return validVariety === 'en-GB' ? 'en-GB' : 'en-US';
    }
    if (language === 'pt') {
      return validVariety === 'pt-PT' ? 'pt-PT' : 'pt-BR';
    }
    if (validVariety === 'es-AR') {
      return 'es-AR';
    }
    if (validVariety === 'es-419' || validVariety === 'es-MX') {
      return 'es-MX';
    }
    return 'es-ES';
  }

  static speak(text: string, language: 'pt' | 'es' | 'en', variety: string = 'all', audioUrl?: string | null): Promise<void> {
    return new Promise((resolve) => {
      // 1. If a valid audio URL is provided, prefer playing the native recording
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.onended = () => resolve();
        audio.onerror = () => {
          // Fall back to synthesis on network error
          this.speakWithSynthesis(text, language, variety).then(resolve);
        };
        audio.play().catch(() => {
          this.speakWithSynthesis(text, language, variety).then(resolve);
        });
        return;
      }

      // 2. Otherwise use client-side SpeechSynthesis
      this.speakWithSynthesis(text, language, variety).then(resolve);
    });
  }

  private static speakWithSynthesis(text: string, language: 'pt' | 'es' | 'en', variety: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }

      this.synth.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      const targetLang = this.getVoiceLang(language, variety);
      utterance.lang = targetLang;
      utterance.rate = 0.95; // Slightly slower for clarity in C1 study

      // Try finding a matching voice
      const voices = this.synth.getVoices();
      const match = voices.find(v => v.lang.replace('_', '-') === targetLang) ||
                    voices.find(v => v.lang.startsWith(language));
      if (match) {
        utterance.voice = match;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      this.synth.speak(utterance);
    });
  }

  static isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }

  static getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  static hasVoiceForLanguage(language: 'pt' | 'es' | 'en', variety: string = 'all'): boolean {
    if (!this.synth) return false;
    const voices = this.synth.getVoices();
    const targetLang = this.getVoiceLang(language, variety);
    return voices.some(v => v.lang.replace('_', '-') === targetLang || v.lang.startsWith(language));
  }

  static startRecognition(
    language: 'pt' | 'es' | 'en',
    variety: string,
    onResult: (transcript: string) => void,
    onError: (err: any) => void
  ): { stop: () => void } {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      onError(new Error('Speech recognition not supported in this browser.'));
      return { stop: () => {} };
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = this.getVoiceLang(language, variety);
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      if (event.results && event.results[0] && event.results[0][0]) {
        onResult(event.results[0][0].transcript);
      }
    };

    recognition.onerror = (event: any) => {
      onError(event.error);
    };

    recognition.start();

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch (e) {
          // ignore
        }
      },
    };
  }
}
