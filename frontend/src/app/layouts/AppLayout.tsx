import React, { PropsWithChildren, useState } from 'react';
import { Navigation, NavTab } from '../../components/common/Navigation';
import { AuthModal } from '../../components/auth/AuthModal';
import { GuidedOnboardingModal } from '../../components/onboarding/GuidedOnboardingModal';
import { BRANDING } from '../../config/branding';
import type { AdminWorkbenchTab } from '../../features/admin/adminNavigation';

export interface AppLayoutProps extends PropsWithChildren {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  adminTab?: AdminWorkbenchTab;
  onSelectAdminTab?: (tab: AdminWorkbenchTab) => void;
  streakDays: number;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onSelectTab,
  adminTab,
  onSelectAdminTab,
  streakDays,
  children,
}) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-sans selection:bg-[#EADBC8] selection:text-stone-900">
      {/* Global Editorial Navigation Header */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        adminTab={adminTab}
        onSelectAdminTab={onSelectAdminTab}
        streakDays={streakDays}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-20 lg:pb-12 w-full max-w-full overflow-x-hidden">
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
        onStartLesson={() => onSelectTab('learn')}
      />

      {/* Editorial Colophon / Footer */}
      <footer className="border-t border-stone-200 bg-[#FDFBF7] py-8 text-center text-xs text-stone-500">
        <div className="max-w-5xl mx-auto px-4 space-y-2">
          <p className="font-serif text-sm font-medium text-stone-800 tracking-wide">
            {BRANDING.name} <span className="text-stone-400 font-sans mx-1.5">•</span> <span className="italic font-serif text-stone-600">{BRANDING.tagline}</span>
          </p>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            {BRANDING.shortDescription}
          </p>
          <p className="text-[11px] text-stone-400 pt-2 border-t border-stone-200/60 max-w-xs mx-auto">
            {BRANDING.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
};
