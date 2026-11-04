import React, { useState, useEffect, lazy, Suspense } from 'react';
import { NavTab } from './components/common/Navigation';
import { AppProviders } from './app/providers/AppProviders';
import { AppLayout } from './app/layouts/AppLayout';
import { useAppRouter } from './app/router/useAppRouter';
import { DashboardPage } from './pages/DashboardPage';
import { LearnPage } from './pages/LearnPage';
import { MyWordsPage } from './pages/MyWordsPage';
import { MyMistakesPage } from './pages/MyMistakesPage';
import { StorageService } from './services/storage';
import { courseService } from './services/courseService';
import { Course } from './types';
import { initializeExternalApiRegistry } from './integrations/external-apis';

// Route-level code splitting: lazy load secondary and administrative pages
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const CultureExplorePage = lazy(() => import('./pages/CultureExplorePage').then(m => ({ default: m.CultureExplorePage })));
const VocabularyPage = lazy(() => import('./pages/VocabularyPage').then(m => ({ default: m.VocabularyPage })));
const PortuguesePage = lazy(() => import('./pages/PortuguesePage').then(m => ({ default: m.PortuguesePage })));
const SpanishPage = lazy(() => import('./pages/SpanishPage').then(m => ({ default: m.SpanishPage })));
const EnglishPage = lazy(() => import('./pages/EnglishPage').then(m => ({ default: m.EnglishPage })));
const TranslatePage = lazy(() => import('./pages/TranslatePage').then(m => ({ default: m.TranslatePage })));
const PracticePage = lazy(() => import('./pages/PracticePage').then(m => ({ default: m.PracticePage })));
const ProgressPage = lazy(() => import('./pages/ProgressPage').then(m => ({ default: m.ProgressPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const RouteLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center py-24" role="status" aria-label="Loading page">
    <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
  </div>
);

export const AppContent: React.FC = () => {
  const { currentRoute, adminTab, navigate, navigateAdmin } = useAppRouter('dashboard');
  const [streakDays, setStreakDays] = useState(1);

  // One-time initialization on mount (prevents repeated initialization on route changes)
  useEffect(() => {
    initializeExternalApiRegistry();
    const ptTrack = StorageService.getTrackState('pt');
    setStreakDays(Math.max(1, ptTrack.streak_days));

    // Check if onboarding was completed or URL query params configured
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('admin') === 'true') {
          const adminProfile = {
            id: 'usr_admin_001',
            auth_user_id: 'auth_admin_001',
            email: 'admin@polyglot.dev',
            full_name: 'Lead System Administrator',
            role: 'admin',
            account_status: 'active',
            native_language: 'en',
            primary_target_language: 'pt',
            interface_language: params.get('lang') || 'en',
            explanation_language: 'en',
            theme: 'dark',
            onboarding_completed: true,
          };
          localStorage.setItem('polyglot_mock_auth_user', JSON.stringify(adminProfile));
        }
        const targetCourse = params.get('course');
        if (targetCourse) {
          const found = courseService.getCourses().find((c: Course) => c.target_language === targetCourse);
          if (found) courseService.setActiveCourse(found.id);
        }
        if (params.has('dismiss_modals')) {
          localStorage.setItem('lexilume_onboarding_completed', 'true');
          localStorage.setItem('polyglot_onboarding_completed', 'true');
        }
      }
    } catch {}
  }, []);

  const handleSelectTab = (tab: NavTab) => {
    navigate(tab);
  };

  return (
    <AppLayout
      activeTab={currentRoute}
      onSelectTab={handleSelectTab}
      adminTab={adminTab}
      onSelectAdminTab={navigateAdmin}
      streakDays={streakDays}
    >
      <Suspense fallback={<RouteLoadingFallback />}>
        {currentRoute === 'learn' && <LearnPage />}
        {currentRoute === 'words' && <MyWordsPage />}
        {currentRoute === 'mistakes' && <MyMistakesPage />}
        {currentRoute === 'dashboard' && <DashboardPage onNavigateTab={handleSelectTab} />}
        {currentRoute === 'vocabulary' && <VocabularyPage />}
        {currentRoute === 'explore' && <CultureExplorePage />}
        {currentRoute === 'portuguese' && <PortuguesePage />}
        {currentRoute === 'spanish' && <SpanishPage />}
        {currentRoute === 'english' && <EnglishPage />}
        {currentRoute === 'translate' && <TranslatePage />}
        {currentRoute === 'practice' && <PracticePage />}
        {currentRoute === 'progress' && <ProgressPage />}
        {currentRoute === 'settings' && <SettingsPage />}
        {currentRoute === 'admin' && (
          <AdminPage
            onNavigateTab={handleSelectTab}
            activeAdminTab={adminTab}
            onSelectAdminTab={navigateAdmin}
          />
        )}
      </Suspense>
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
};

export default App;
