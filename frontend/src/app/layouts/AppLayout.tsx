/**
 * Main Application Shell & Layout
 * 
 * Separates navigation chrome, footer, and modal containers from route views.
 */

import React, { PropsWithChildren, useState } from 'react';
import { Navigation, NavTab } from '../../components/common/Navigation';
import { AuthModal } from '../../components/auth/AuthModal';
import { GuidedOnboardingModal } from '../../components/onboarding/GuidedOnboardingModal';
import { BRANDING } from '../../config/branding';

export interface AppLayoutProps extends PropsWithChildren {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  streakDays: number;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onSelectTab,
  streakDays,
  children,
}) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Global Navigation Header */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        streakDays={streakDays}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
      />

      {/* Main Content Viewport with Safe Bottom Area for Mobile Nav */}
      <main className="flex-1 pb-24 lg:pb-8 w-full max-w-full overflow-x-hidden">
        {children}
      </main>

      {/* Auth & Onboarding Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <GuidedOnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        onStartLesson={() => onSelectTab('portuguese')}
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
