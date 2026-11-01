/**
 * Client-Side Router Hook with URL Hash Synchronization & Browser History Support
 * 
 * Provides:
 * 1. Synchronous navigation with browser Back / Forward button support.
 * 2. Hash-based deep-linking (#learn/pt, #practice, #vocabulary).
 * 3. Fallback to 'dashboard' if an unrecognized hash is encountered.
 * 4. Zero external dependencies.
 */

import { useState, useEffect, useCallback } from 'react';
import { AppRoute, APP_ROUTES } from './routes';

const VALID_ROUTES = new Set<AppRoute>([
  'dashboard',
  'vocabulary',
  'explore',
  'portuguese',
  'spanish',
  'english',
  'translate',
  'practice',
  'progress',
  'settings',
  'admin',
]);

function getRouteFromLocation(): AppRoute | null {
  if (typeof window === 'undefined') return null;

  // 1. Check URL query parameters (e.g., ?tab=practice)
  try {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab')?.trim().toLowerCase();
      if (tabParam && VALID_ROUTES.has(tabParam as AppRoute)) {
        return tabParam as AppRoute;
      }
      if (tabParam === 'culture') return 'explore';
      if (tabParam === 'learn/pt' || tabParam === 'pt') return 'portuguese';
      if (tabParam === 'learn/es' || tabParam === 'es') return 'spanish';
      if (tabParam === 'learn/en' || tabParam === 'en') return 'english';
    }
  } catch {}

  const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
  
  if (VALID_ROUTES.has(hash as AppRoute)) {
    return hash as AppRoute;
  }

  // Handle path-like aliases
  if (hash === 'culture') return 'explore';
  if (hash === 'learn/pt' || hash === 'pt') return 'portuguese';
  if (hash === 'learn/es' || hash === 'es') return 'spanish';
  if (hash === 'learn/en' || hash === 'en') return 'english';

  return null;
}

export function useAppRouter(initialRoute: AppRoute = 'dashboard') {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    return getRouteFromLocation() || initialRoute;
  });

  // Handle browser Back / Forward events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHashChange = () => {
      const route = getRouteFromLocation() || initialRoute;
      setCurrentRoute(route);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [initialRoute]);

  const navigate = useCallback((route: AppRoute) => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      const targetHash = `#${route}`;
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    }
  }, []);

  return {
    currentRoute,
    navigate,
    routeConfig: APP_ROUTES[currentRoute],
  };
}
