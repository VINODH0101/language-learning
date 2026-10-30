/**
 * Application Routes & Navigation Identifiers
 */

export type AppRoute =
  | 'dashboard'
  | 'vocabulary'
  | 'explore'
  | 'portuguese'
  | 'spanish'
  | 'english'
  | 'translate'
  | 'practice'
  | 'progress'
  | 'settings'
  | 'admin';

export interface RouteConfig {
  id: AppRoute;
  path: string;
  labelKey: string;
  requiresAuth?: boolean;
  requiredRole?: string;
}

export const APP_ROUTES: Record<AppRoute, RouteConfig> = {
  dashboard: { id: 'dashboard', path: '/', labelKey: 'nav_dashboard' },
  vocabulary: { id: 'vocabulary', path: '/vocabulary', labelKey: 'nav_vocabulary' },
  explore: { id: 'explore', path: '/culture', labelKey: 'nav_culture' },
  portuguese: { id: 'portuguese', path: '/learn/pt', labelKey: 'nav_portuguese' },
  spanish: { id: 'spanish', path: '/learn/es', labelKey: 'nav_spanish' },
  english: { id: 'english', path: '/learn/en', labelKey: 'nav_english' },
  translate: { id: 'translate', path: '/translate', labelKey: 'nav_translate' },
  practice: { id: 'practice', path: '/practice', labelKey: 'nav_practice' },
  progress: { id: 'progress', path: '/progress', labelKey: 'nav_progress' },
  settings: { id: 'settings', path: '/settings', labelKey: 'nav_settings' },
  admin: { id: 'admin', path: '/admin', labelKey: 'nav_admin', requiresAuth: true, requiredRole: 'admin' },
};
