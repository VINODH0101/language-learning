/**
 * Centralized Environment Configuration
 * 
 * Provides type-safe access to environment variables with fallback defaults.
 * Prevents direct uncontrolled access to import.meta.env across components.
 */

export interface EnvironmentConfig {
  isDev: boolean;
  isProd: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  isSupabaseConfigured: boolean;
  geminiApiKey: string;
  isGeminiConfigured: boolean;
  appVersion: string;
}

function getEnvVar(key: string, defaultValue = ''): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const val = import.meta.env[key];
    if (typeof val === 'string') {
      return val.trim();
    }
  }
  return defaultValue;
}

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', '');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', '');
const geminiApiKey = getEnvVar('VITE_GEMINI_API_KEY', '');

export const ENV: EnvironmentConfig = {
  isDev: typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV),
  isProd: typeof import.meta !== 'undefined' && Boolean(import.meta.env?.PROD),
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project-id.supabase.co'),
  geminiApiKey,
  isGeminiConfigured: Boolean(geminiApiKey && !geminiApiKey.includes('PLACEHOLDER')),
  appVersion: '2.0.0',
};
