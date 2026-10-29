/**
 * Polyglot C1 Daily — Security & Content Sanitization Utilities.
 * 
 * Protects against Cross-Site Scripting (XSS) and malformed payload injection
 * when displaying content from external Wikipedia extracts, Wiktionary, or user notes.
 */

const DANGEROUS_TAG_REGEX = /<\s*(script|style|iframe|object|embed|applet|form|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>|<\s*(script|style|iframe|object|embed|applet|form|svg|math)[^>]*\/?\s*>/gi;
const INLINE_EVENT_REGEX = /\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi;
const JAVASCRIPT_URL_REGEX = /(?:href|src|data)\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi;

/**
 * Sanitizes an untrusted HTML or markup string to ensure no executable
 * JavaScript, harmful iframes, or unvetted tags enter the DOM.
 */
export function sanitizeHtml(raw: string): string {
  if (!raw) return '';
  let clean = raw;

  // 1. Strip dangerous tags
  clean = clean.replace(DANGEROUS_TAG_REGEX, '');

  // 2. Strip inline event handlers (e.g. onload, onerror, onclick)
  clean = clean.replace(INLINE_EVENT_REGEX, '');

  // 3. Strip javascript: URLs in attributes
  clean = clean.replace(JAVASCRIPT_URL_REGEX, '');

  return clean;
}

/**
 * Strips all HTML tags completely, returning pure text safe for inline rendering.
 */
export function sanitizePlainText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Validates whether a given URL is safe for external linking.
 */
export function isSafeUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
