/**
 * Central Feature Configuration & Flags
 */

export interface FeatureFlags {
  enableGeminiDialogues: boolean;
  enableJikanCulture: boolean;
  enablePdfExport: boolean;
  enableSpeechSynthesis: boolean;
  enableLanguageTool: boolean;
}

export const FEATURES: FeatureFlags = {
  enableGeminiDialogues: true,
  enableJikanCulture: true,
  enablePdfExport: true,
  enableSpeechSynthesis: true,
  enableLanguageTool: true,
};
