/**
 * Client-Side Router Hook with URL Hash Synchronization & Browser History Support
 *
 * Provides:
 * 1. Synchronous navigation with browser Back / Forward button support.
 * 2. Hash-based deep-linking (#learn/pt, #practice, #vocabulary, #admin/content_studio).
 * 3. Fallback to 'dashboard' if an unrecognized hash is encountered.
 * 4. Zero external dependencies.
 */

import { useState, useEffect, useCallback } from 'react';
import { AppRoute, APP_ROUTES } from './routes';
import {
  AdminWorkbenchTab,
  DEFAULT_ADMIN_DESTINATION,
  isAdminWorkbenchTab,
} from '../../features/admin/adminNavigation';

const VALID_ROUTES = new Set<AppRoute>([
  'learn',
  'words',
  'mistakes',
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

interface LocationState {
  route: AppRoute | null;
  adminTab: AdminWorkbenchTab;
}

const parseAdminTab = (value: string | null | undefined): AdminWorkbenchTab =>
  isAdminWorkbenchTab(value) ? value : DEFAULT_ADMIN_DESTINATION;

function getStateFromLocation(): LocationState {
  if (typeof window === 'undefined') {
    return { route: null, adminTab: DEFAULT_ADMIN_DESTINATION };
  }

  // 1. Check URL query parameters (e.g., ?tab=practice, ?tab=admin&adminTab=review)
  try {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const adminTab = parseAdminTab(params.get('adminTab') || params.get('admin_tab'));
      const tabParam = params.get('tab')?.trim().toLowerCase();
      if (tabParam && VALID_ROUTES.has(tabParam as AppRoute)) {
        return { route: tabParam as AppRoute, adminTab };
      }
      if (tabParam === 'culture') return { route: 'explore', adminTab };
      if (tabParam === 'learn/pt' || tabParam === 'pt') return { route: 'portuguese', adminTab };
      if (tabParam === 'learn/es' || tabParam === 'es') return { route: 'spanish', adminTab };
      if (tabParam === 'learn/en' || tabParam === 'en') return { route: 'english', adminTab };
    }
  } catch {}

  const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();

  // Admin destinations are encoded as #admin/<destination>.
  const [routeSegment, adminSegment] = hash.split('/');
  if (routeSegment === 'admin') {
    return { route: 'admin', adminTab: parseAdminTab(adminSegment) };
  }

  if (VALID_ROUTES.has(routeSegment as AppRoute)) {
    return {
      route: routeSegment as AppRoute,
      adminTab: DEFAULT_ADMIN_DESTINATION,
    };
  }

  // Handle path-like aliases
  if (routeSegment === 'culture') return { route: 'explore', adminTab: DEFAULT_ADMIN_DESTINATION };
  if (routeSegment === 'learn' && adminSegment === 'pt') return { route: 'portuguese', adminTab: DEFAULT_ADMIN_DESTINATION };
  if (routeSegment === 'learn' && adminSegment === 'es') return { route: 'spanish', adminTab: DEFAULT_ADMIN_DESTINATION };
  if (routeSegment === 'learn' && adminSegment === 'en') return { route: 'english', adminTab: DEFAULT_ADMIN_DESTINATION };
  if (routeSegment === 'pt') return { route: 'portuguese', adminTab: DEFAULT_ADMIN_DESTINATION };
  if (routeSegment === 'es') return { route: 'spanish', adminTab: DEFAULT_ADMIN_DESTINATION };
  if (routeSegment === 'en') return { route: 'english', adminTab: DEFAULT_ADMIN_DESTINATION };

  return { route: null, adminTab: DEFAULT_ADMIN_DESTINATION };
}

export function useAppRouter(initialRoute: AppRoute = 'dashboard') {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    return getStateFromLocation().route || initialRoute;
  });
  const [adminTab, setAdminTab] = useState<AdminWorkbenchTab>(() => {
    return getStateFromLocation().adminTab;
  });

  // Handle browser Back / Forward events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHashChange = () => {
      const locationState = getStateFromLocation();
      setCurrentRoute(locationState.route || initialRoute);
      setAdminTab(locationState.adminTab);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [initialRoute]);

  const navigate = useCallback((route: AppRoute) => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      const targetHash = route === 'admin'
        ? `#admin/${DEFAULT_ADMIN_DESTINATION}`
        : `#${route}`;
      if (route === 'admin') setAdminTab(DEFAULT_ADMIN_DESTINATION);
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    }
  }, []);

  const navigateAdmin = useCallback((destination: AdminWorkbenchTab) => {
    const nextTab = isAdminWorkbenchTab(destination) ? destination : DEFAULT_ADMIN_DESTINATION;
    setCurrentRoute('admin');
    setAdminTab(nextTab);
    if (typeof window !== 'undefined') {
      const targetHash = `#admin/${nextTab}`;
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    }
  }, []);

  return {
    currentRoute,
    adminTab,
    navigate,
    navigateAdmin,
    routeConfig: APP_ROUTES[currentRoute],
  };
}
