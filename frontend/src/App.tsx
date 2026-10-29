import React, { useState, useEffect } from 'react';
import { Navigation, NavTab } from './components/common/Navigation';
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
import { AuthModal } from './components/auth/AuthModal';
import { GuidedOnboardingModal } from './components/onboarding/GuidedOnboardingModal';
import { I18nProvider } from './i18n/i18nContext';
import { StorageService } from './services/storage';
import { initializeExternalApiRegistry } from './integrations/external-apis';
import { BRANDING } from './config/branding';
import { Toaster } from 'sonner';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [streakDays, setStreakDays] = useState(1);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  useEffect(() => {
    initializeExternalApiRegistry();
    const ptTrack = StorageService.getTrackState('pt');
    setStreakDays(Math.max(1, ptTrack.streak_days));

    // Check if onboarding was completed
    try {
      const completed = localStorage.getItem('lexilume_onboarding_completed') || localStorage.getItem('polyglot_onboarding_completed');
      if (!completed) {
        setIsOnboardingModalOpen(true);
      }
    } catch {}
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Global Navigation Header */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        streakDays={streakDays}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
      />
      <Toaster richColors position="top-right" theme="dark" closeButton />

      {/* Main Content Viewport with Safe Bottom Area for Mobile Nav */}
      <main className="flex-1 pb-24 lg:pb-8 w-full max-w-full overflow-x-hidden">
        {activeTab === 'dashboard' && <DashboardPage onNavigateTab={(tab) => setActiveTab(tab)} />}
        {activeTab === 'vocabulary' && <VocabularyPage />}
        {activeTab === 'explore' && <CultureExplorePage />}
        {activeTab === 'portuguese' && <PortuguesePage />}
        {activeTab === 'spanish' && <SpanishPage />}
        {activeTab === 'english' && <EnglishPage />}
        {activeTab === 'translate' && <TranslatePage />}
        {activeTab === 'practice' && <PracticePage />}
        {activeTab === 'progress' && <ProgressPage />}
        {activeTab === 'settings' && <SettingsPage />}
        {activeTab === 'admin' && <AdminPage onNavigateTab={(tab) => setActiveTab(tab)} />}
      </main>

      {/* Auth & Onboarding Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <GuidedOnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        onStartLesson={() => setActiveTab('portuguese')}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="font-semibold text-slate-300">
            {BRANDING.name} — {BRANDING.tagline}
          </p>
          <p className="text-[11px] text-slate-400">
            {BRANDING.shortDescription}
          </p>
          <p className="text-[10px] text-slate-600">
            {BRANDING.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
};

export default App;
