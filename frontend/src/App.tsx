import React, { useState, useEffect } from 'react';
import { NavTab } from './components/common/Navigation';
import { AppProviders } from './app/providers/AppProviders';
import { AppLayout } from './app/layouts/AppLayout';
import { useAppRouter } from './app/router/useAppRouter';
import { DashboardPage } from './pages/DashboardPage';
import { PortuguesePage } from './pages/PortuguesePage';
import { SpanishPage } from './pages/SpanishPage';
import { EnglishPage } from './pages/EnglishPage';
import { TranslatePage } from './pages/TranslatePage';
import { PracticePage } from './pages/PracticePage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { CultureExplorePage } from './pages/CultureExplorePage';
import { VocabularyPage } from './pages/VocabularyPage';
import { StorageService } from './services/storage';
import { initializeExternalApiRegistry } from './integrations/external-apis';

export const AppContent: React.FC = () => {
  const { currentRoute, navigate } = useAppRouter('dashboard');
  const [streakDays, setStreakDays] = useState(1);

  // One-time initialization on mount (prevents repeated initialization on route changes)
  useEffect(() => {
    initializeExternalApiRegistry();
    const ptTrack = StorageService.getTrackState('pt');
    setStreakDays(Math.max(1, ptTrack.streak_days));

    // Check if onboarding was completed
    try {
      const completed =
        localStorage.getItem('lexilume_onboarding_completed') ||
        localStorage.getItem('polyglot_onboarding_completed');
      if (!completed) {
        // Will be picked up by layout or onboarding triggers
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
      streakDays={streakDays}
    >
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
      {currentRoute === 'admin' && <AdminPage onNavigateTab={handleSelectTab} />}
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
