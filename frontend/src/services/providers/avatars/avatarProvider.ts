/**
 * DiceBear Avatar Provider
 * Endpoint: https://api.dicebear.com/9.x/{style}/svg?seed={seed}
 * 
 * Generates privacy-friendly, deterministic avatars from stable user seeds without sending PII.
 * Features:
 * - Multi-style selection: bottts, personas, adventurer, initials, thumbs, pixel-art
 * - Offline inline SVG fallback (user initials)
 * - Seed regeneration and persistence
 */

export type AvatarStyle =
  | 'bottts'
  | 'personas'
  | 'adventurer'
  | 'initials'
  | 'thumbs'
  | 'pixel-art'
  | 'lorelei';

export interface AvatarOptions {
  seed: string;
  style?: AvatarStyle;
  backgroundColor?: string; // hex without #
}

export class AvatarProvider {
  private static instance: AvatarProvider;

  public static getInstance(): AvatarProvider {
    if (!AvatarProvider.instance) {
      AvatarProvider.instance = new AvatarProvider();
    }
    return AvatarProvider.instance;
  }

  /**
   * Builds the official DiceBear SVG URL for the given seed and style.
   */
  public getAvatarUrl(options: AvatarOptions): string {
    const style = options.style || 'personas';
    const cleanSeed = encodeURIComponent(options.seed.trim() || 'learner');
    const bgParam = options.backgroundColor ? `&backgroundColor=${options.backgroundColor}` : '';
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${cleanSeed}${bgParam}`;
  }

  /**
   * Generates a deterministic client-side SVG data URI without making external network calls.
   * Useful as offline fallback or instant local rendering.
   */
  public getOfflineInitialsSvgUri(name: string, bgHex: string = '4f46e5'): string {
    const initials = name
      .split(' ')
      .map(part => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'LX';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="28" fill="#${bgHex}"/><text x="50" y="62" font-size="38" font-family="system-ui, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  /**
   * Generates a random alphanumeric seed for avatar customization.
   */
  public generateRandomSeed(): string {
    return `lexi_${Math.random().toString(36).substring(2, 9)}`;
  }
}
