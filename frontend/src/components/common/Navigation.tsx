import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Settings,
  Languages,
  Shield,
  LogIn,
  LogOut,
  User,
  Compass,
  Menu,
  X,
  ChevronDown,
  BookMarked,
  Bookmark,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';
import { authService, AuthState } from '../../services/auth';
import { courseService } from '../../services/courseService';
import { Logo } from './Logo';
import { InterfaceLanguageSelector } from './InterfaceLanguageSelector';
import { SyncStatusBadge } from './SyncStatusBadge';
import { BRANDING } from '../../config/branding';
import {
  getLanguageName,
  LANGUAGE_METADATA,
  LearningLanguage,
} from '../../lib/languages/languageMatrix';
import {
  ADMIN_PRIMARY_DESTINATIONS,
  AdminPrimaryDestination,
  AdminWorkbenchTab,
  DEFAULT_ADMIN_DESTINATION,
} from '../../features/admin/adminNavigation';

export type NavTab =
  | 'learn'
  | 'words'
  | 'mistakes'
  | 'dashboard'
  | 'explore'
  | 'vocabulary'
  | 'portuguese'
  | 'spanish'
  | 'english'
  | 'translate'
  | 'practice'
  | 'progress'
  | 'settings'
  | 'admin';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  adminTab?: AdminWorkbenchTab;
  onSelectAdminTab?: (tab: AdminWorkbenchTab) => void;
  streakDays?: number;
  onOpenAuth: () => void;
  onOpenOnboarding: () => void;
}

const ADMIN_DESTINATION_ICONS = {
  overview: LayoutDashboard,
  content_studio: BookOpen,
  content_import: Sparkles,
  processing_studio: TrendingUp,
  review: Shield,
  settings: Settings,
} as const;

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  adminTab,
  onSelectAdminTab,
  onOpenAuth,
  onOpenOnboarding,
}) => {
  const { t, interfaceLanguage } = useI18n();
  const [authState, setAuthState] = useState<AuthState>(authService.getState());
  const [activeCourse, setActiveCourse] = useState(() => courseService.getActiveCourse());
  const [isLearnDropdownOpen, setIsLearnDropdownOpen] = useState(false);
  const [isNotebooksDropdownOpen, setIsNotebooksDropdownOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        return new URLSearchParams(window.location.search).get('open_drawer') === 'true';
      }
    } catch {}
    return false;
  });

  const learnDropdownRef = useRef<HTMLDivElement>(null);
  const notebooksDropdownRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubAuth = authService.subscribe(setAuthState);
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const unsubCourse = courseService.subscribe((_courses, active) => {
      setActiveCourse(active);
    });
    return () => unsubCourse();
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('polyglot_font_size');
      const root = document.documentElement;
      if (saved === 'large') root.style.fontSize = '17px';
      else if (saved === 'xlarge') root.style.fontSize = '18.5px';
      else root.style.fontSize = '16px';
    } catch {}

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (learnDropdownRef.current && !learnDropdownRef.current.contains(target)) {
        setIsLearnDropdownOpen(false);
      }
      if (notebooksDropdownRef.current && !notebooksDropdownRef.current.contains(target)) {
        setIsNotebooksDropdownOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(target)) {
        setIsAdminMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLearnDropdownOpen(false);
        setIsNotebooksDropdownOpen(false);
        setIsProfileMenuOpen(false);
        setIsMobileDrawerOpen(false);
        setIsAdminMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isMobileDrawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isMobileDrawerOpen]);

  const handleSelectNavTab = (tab: NavTab) => {
    onSelectTab(tab);
    setIsLearnDropdownOpen(false);
    setIsNotebooksDropdownOpen(false);
    setIsProfileMenuOpen(false);
    setIsMobileDrawerOpen(false);
  };

  const getActiveCourseTab = (): NavTab => {
    try {
      const lang = courseService.getActiveCourse()?.target_language;
      if (lang === 'pt') return 'portuguese';
      if (lang === 'es') return 'spanish';
      if (lang === 'en') return 'english';
      return 'learn';
    } catch {
      return 'learn';
    }
  };

  // Four-way decoupling: language labels localized strictly by interfaceLanguage
  const targetLanguage = (activeCourse?.target_language || 'pt') as LearningLanguage;
  const targetLanguageName = getLanguageName(targetLanguage, interfaceLanguage as any);
  const explanationLanguageName = getLanguageName(
    (activeCourse?.explanation_language || 'en') as LearningLanguage,
    interfaceLanguage as any
  );
  const targetLanguageFlag = LANGUAGE_METADATA[targetLanguage]?.flag || '🌐';

  const languageContext = (
    <span
      className="inline-flex items-center gap-1 min-w-0"
      title={`${targetLanguageName} · ${t('dashboard:explanations_in', 'Explanations in')} ${explanationLanguageName}`}
    >
      <span aria-hidden="true">{targetLanguageFlag}</span>
      <span className="truncate">{targetLanguageName}</span>
      <span className="hidden xl:inline text-stone-400" aria-hidden="true">·</span>
      <span className="hidden xl:inline truncate">
        {t('dashboard:explanations_in', 'Explanations in')} {explanationLanguageName}
      </span>
    </span>
  );

  const isLearnActive = [
    'portuguese',
    'spanish',
    'english',
    'vocabulary',
    'translate',
    'explore',
  ].includes(activeTab);

  const isNotebooksActive = activeTab === 'words' || activeTab === 'mistakes';

  const trackRoutes: Record<'pt' | 'es' | 'en', NavTab> = {
    pt: 'portuguese',
    es: 'spanish',
    en: 'english',
  };

  const curriculumTracks = (['pt', 'es', 'en'] as const).map(code => ({
    id: trackRoutes[code],
    label: getLanguageName(code, interfaceLanguage as any),
    desc: t(`navigation:track_${code}_desc`, 'Immersive Track'),
    badge: code.toUpperCase(),
    flag: LANGUAGE_METADATA[code].flag,
    isCurrent: targetLanguage === code,
  }));

  const studyTools = [
    {
      id: 'vocabulary' as NavTab,
      label: t('nav_vocabulary'),
      desc: t('tool_vocabulary_desc', 'Top 200 & Everyday Phrases'),
      badge: 'VOCAB',
      icon: BookMarked,
    },
    {
      id: 'translate' as NavTab,
      label: t('nav_translate'),
      desc: t('tool_translate_desc', 'Bilingual Dictionary & Translation'),
      badge: 'DICT',
      icon: Languages,
    },
    {
      id: 'explore' as NavTab,
      label: t('nav_explore'),
      desc: t('tool_explore_desc', 'Cultural Immersion & Global Readings'),
      badge: 'WORLD',
      icon: Compass,
    },
  ];

  const notebookItems = [
    {
      id: 'words' as NavTab,
      label: t('navigation:nav_words', 'My Words'),
      desc: t('navigation:tool_words_desc', 'Saved vocabulary & SM-2 cards'),
      icon: Bookmark,
      accentClass: 'text-amber-600',
    },
    {
      id: 'mistakes' as NavTab,
      label: t('navigation:nav_mistakes', 'My Mistakes'),
      desc: t('navigation:tool_mistakes_desc', 'Error review & targeted practice'),
      icon: AlertTriangle,
      accentClass: 'text-rose-600',
    },
  ];

  const handleMobileLearnClick = () => {
    if (isLearnActive) {
      setIsMobileDrawerOpen(true);
    } else {
      handleSelectNavTab(getActiveCourseTab());
    }
  };

  const desktopItemClass = (active: boolean) =>
    `relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors duration-150 min-h-[44px] cursor-pointer whitespace-nowrap rounded-lg ${
      active
        ? 'text-stone-900 font-semibold'
        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
    }`;

  const activeUnderline = (active: boolean) =>
    active ? (
      <span
        className="absolute inset-x-2.5 bottom-0.5 h-[2px] rounded-full bg-amber-600"
        aria-hidden="true"
      />
    ) : null;

  const currentAdminTab: AdminWorkbenchTab = adminTab ?? DEFAULT_ADMIN_DESTINATION;
  const currentAdminDestination =
    ADMIN_PRIMARY_DESTINATIONS.find(destination => destination.id === currentAdminTab) ||
    ADMIN_PRIMARY_DESTINATIONS[0];

  const adminDestinationLabel = (destination: AdminPrimaryDestination) => {
    const fallback =
      ADMIN_PRIMARY_DESTINATIONS.find(item => item.id === destination)?.label || destination;
    return t(`navigation:admin_destination_${destination}`, fallback);
  };

  const handleSelectAdminDestination = (destination: AdminPrimaryDestination) => {
    setIsAdminMenuOpen(false);
    if (onSelectAdminTab) {
      onSelectAdminTab(destination);
    } else {
      onSelectTab('admin');
    }
  };

  // Dedicated Admin Navigation Header when viewing AdminDesk
  if (activeTab === 'admin' && authState.role === 'admin') {
    return (
      <header className="bg-[#FDFBF7]/95 border-b border-stone-200 sticky top-0 z-40 backdrop-blur-md w-full shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 w-full gap-2">
            {/* Left: Admin Logo & Exit to Learner App */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div
                role="button"
                tabIndex={0}
                className="flex items-center gap-2 cursor-pointer shrink-0 select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 rounded-xl"
                onClick={() => handleSelectAdminDestination(DEFAULT_ADMIN_DESTINATION)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSelectAdminDestination(DEFAULT_ADMIN_DESTINATION);
                  }
                }}
                aria-label={`${BRANDING.name} ${t('navigation:admin_desk', 'Admin Desk')}`}
              >
                <Logo size="md" />
                <span className="hidden 2xl:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-300 uppercase tracking-wider">
                  {t('navigation:admin_desk', 'Admin Desk')}
                </span>
              </div>

              <button
                onClick={() => handleSelectNavTab('dashboard')}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer border border-stone-200 shrink-0 min-h-[38px]"
                aria-label={t('navigation:admin_return_learner', 'Return to Learner View')}
                title={t('navigation:admin_return_learner', 'Return to Learner View')}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">
                  {t('navigation:admin_learner_app', 'Learner App')}
                </span>
              </button>
            </div>

            {/* Center: Desktop Admin Primary Destinations */}
            <nav className="hidden xl:flex items-center gap-1 mx-auto shrink-0" aria-label="Admin Destinations">
              {ADMIN_PRIMARY_DESTINATIONS.map((item) => {
                const Icon = ADMIN_DESTINATION_ICONS[item.id];
                const isActive = currentAdminTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectAdminDestination(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={adminDestinationLabel(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[38px] ${
                      isActive
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-stone-500'}`} />
                    <span className="whitespace-nowrap">{adminDestinationLabel(item.id)}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right: Sync Status + Language + Sign Out */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="hidden 2xl:block">
                <SyncStatusBadge />
              </div>
              <InterfaceLanguageSelector />
              <button
                onClick={() => {
                  authService.signOut();
                  handleSelectNavTab('dashboard');
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 text-xs font-bold text-rose-700 transition cursor-pointer min-h-[38px]"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('nav_sign_out')}</span>
              </button>
            </div>
          </div>

          {/* Tablet & Mobile: Current destination with an accessible selector */}
          <div className="xl:hidden border-t border-stone-200 py-1.5" ref={adminMenuRef}>
            <button
              onClick={() => setIsAdminMenuOpen(open => !open)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-800 hover:bg-stone-100 transition cursor-pointer min-h-[44px]"
              aria-label="Admin navigation menu"
              aria-expanded={isAdminMenuOpen}
              aria-haspopup="true"
            >
              <span className="flex items-center gap-2">
                {(() => {
                  const CurrentIcon = ADMIN_DESTINATION_ICONS[currentAdminDestination.id];
                  return <CurrentIcon className="w-4 h-4 text-stone-600" />;
                })()}
                <span>{adminDestinationLabel(currentAdminDestination.id)}</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-stone-500 transition-transform ${
                  isAdminMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isAdminMenuOpen && (
              <nav
                aria-label="Admin Destinations Mobile"
                className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1.5 bg-[#FDFBF7] border border-stone-200 rounded-xl shadow-lg"
              >
                {ADMIN_PRIMARY_DESTINATIONS.map((item) => {
                  const Icon = ADMIN_DESTINATION_ICONS[item.id];
                  const isActive = currentAdminTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectAdminDestination(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer min-h-[44px] ${
                        isActive
                          ? 'bg-stone-900 text-white'
                          : 'text-stone-800 hover:bg-stone-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-stone-500'}`} />
                      <span>{adminDestinationLabel(item.id)}</span>
                    </button>
                  );
                })}
              </nav>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Top Header Navbar */}
      <header className="bg-[#FDFBF7]/95 border-b border-stone-200 sticky top-0 z-40 backdrop-blur-md w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 w-full gap-3">
            {/* LEFT: Brand Identity & Quiet Linguistic Context */}
            <div
              role="button"
              tabIndex={0}
              className="flex items-center gap-2 cursor-pointer shrink-0 select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 rounded-xl"
              onClick={() => handleSelectNavTab('dashboard')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleSelectNavTab('dashboard');
              }}
              aria-label={`${BRANDING.name} ${t('nav_home')}`}
            >
              <Logo size="md" subtitle={languageContext} />
            </div>

            {/* CENTER: Calm 5-Destination Desktop Navigation (Home, Learn, Practice, Notebooks, Progress) */}
            <nav
              className="hidden lg:flex items-center gap-1 mx-auto"
              aria-label={t('navigation:menu_title', 'Navigation Menu')}
            >
              {/* 1. Home / Dashboard */}
              <button
                onClick={() => handleSelectNavTab('dashboard')}
                aria-current={activeTab === 'dashboard' ? 'page' : undefined}
                className={desktopItemClass(activeTab === 'dashboard')}
              >
                <span>{t('nav_home')}</span>
                {activeUnderline(activeTab === 'dashboard')}
              </button>

              {/* 2. Learn Hub (Reading Room + Track Switcher + Study Tools) */}
              <div className="relative" ref={learnDropdownRef}>
                <div className="relative flex items-center">
                  <button
                    onClick={() => handleSelectNavTab('learn')}
                    aria-label="Content Library"
                    aria-current={activeTab === 'learn' ? 'page' : undefined}
                    className={desktopItemClass(activeTab === 'learn' || isLearnActive)}
                  >
                    <span>{t('nav_learn')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsLearnDropdownOpen(prev => !prev);
                      setIsNotebooksDropdownOpen(false);
                    }}
                    className={`relative flex items-center justify-center px-1.5 py-2 min-h-[44px] rounded-lg cursor-pointer transition-colors ${
                      activeTab === 'learn' || isLearnActive
                        ? 'text-stone-900'
                        : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100/70'
                    }`}
                    aria-expanded={isLearnDropdownOpen}
                    aria-haspopup="true"
                    aria-label={`${t('nav_learn')} menu`}
                    title={`${t('nav_learn')} menu`}
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isLearnDropdownOpen ? 'rotate-180 text-stone-900' : 'text-stone-500'
                      }`}
                    />
                  </button>
                  {activeUnderline(activeTab === 'learn' || isLearnActive)}
                </div>

                {isLearnDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-[#FDFBF7] border border-stone-200 rounded-2xl shadow-xl p-2.5 z-50 animate-fadeIn space-y-2.5">
                    <div>
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        {t('navigation:curriculum_tracks_header', 'Language Tracks (CEFR)')}
                      </div>
                      <div className="space-y-1 mt-0.5">
                        {curriculumTracks.map((sub) => {
                          const isSelected = activeTab === sub.id;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => handleSelectNavTab(sub.id)}
                              aria-current={isSelected ? 'page' : undefined}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer min-h-[42px] ${
                                isSelected
                                  ? 'bg-stone-900 text-white'
                                  : 'hover:bg-amber-50/70 text-stone-800 hover:text-stone-900'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-lg leading-none shrink-0">{sub.flag}</span>
                                <div className="min-w-0">
                                  <div className={`font-semibold text-xs truncate ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                                    {sub.label}
                                  </div>
                                  <div className={`text-[10px] truncate ${isSelected ? 'text-stone-300' : 'text-stone-600'}`}>
                                    {sub.desc}
                                  </div>
                                </div>
                              </div>
                              <span className="flex items-center gap-1.5 shrink-0 ml-2">
                                {sub.isCurrent && (
                                  <span
                                    className="w-1.5 h-1.5 rounded-full bg-amber-500"
                                    title={t('dashboard:active_badge', 'Active')}
                                    aria-label={t('dashboard:active_badge', 'Active')}
                                  />
                                )}
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                    isSelected
                                      ? 'bg-amber-600 text-white border-amber-600'
                                      : 'bg-stone-100 text-stone-800 border-stone-300'
                                  }`}
                                >
                                  {sub.badge}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-stone-200" />

                    <div>
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        {t('navigation:study_tools_header', 'Study Tools')}
                      </div>
                      <div className="space-y-1 mt-0.5">
                        {studyTools.map((tool) => {
                          const isSelected = activeTab === tool.id;
                          return (
                            <button
                              key={tool.id}
                              onClick={() => handleSelectNavTab(tool.id)}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer min-h-[42px] ${
                                isSelected
                                  ? 'bg-stone-900 text-white'
                                  : 'hover:bg-amber-50/70 text-stone-800 hover:text-stone-900'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className={`font-semibold text-xs truncate ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                                  {tool.label}
                                </div>
                                <div className={`text-[10px] truncate ${isSelected ? 'text-stone-300' : 'text-stone-600'}`}>
                                  {tool.desc}
                                </div>
                              </div>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${
                                  isSelected
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-stone-100 text-stone-600 border-stone-300'
                                }`}
                              >
                                {tool.badge}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Practice */}
              <button
                onClick={() => handleSelectNavTab('practice')}
                aria-current={activeTab === 'practice' ? 'page' : undefined}
                className={desktopItemClass(activeTab === 'practice')}
              >
                <span>{t('nav_practice')}</span>
                {activeUnderline(activeTab === 'practice')}
              </button>

              {/* 4. Personal Notebooks (My Words + My Mistakes) */}
              <div className="relative" ref={notebooksDropdownRef}>
                <button
                  onClick={() => {
                    setIsNotebooksDropdownOpen(prev => !prev);
                    setIsLearnDropdownOpen(false);
                  }}
                  aria-expanded={isNotebooksDropdownOpen}
                  aria-haspopup="true"
                  className={desktopItemClass(isNotebooksActive)}
                >
                  <span>{t('navigation:nav_notebooks', 'Notebooks')}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isNotebooksDropdownOpen ? 'rotate-180 text-stone-900' : 'text-stone-500'
                    }`}
                  />
                  {activeUnderline(isNotebooksActive)}
                </button>

                {isNotebooksDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-[#FDFBF7] border border-stone-200 rounded-2xl shadow-xl p-2 z-50 animate-fadeIn space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      {t('navigation:notebooks_header', 'Personal Notebooks')}
                    </div>
                    {notebookItems.map(nb => {
                      const Icon = nb.icon;
                      const isSelected = activeTab === nb.id;
                      return (
                        <button
                          key={nb.id}
                          onClick={() => handleSelectNavTab(nb.id)}
                          aria-current={isSelected ? 'page' : undefined}
                          className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition cursor-pointer min-h-[44px] ${
                            isSelected
                              ? 'bg-stone-900 text-white'
                              : 'hover:bg-amber-50/70 text-stone-800 hover:text-stone-900'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-300' : nb.accentClass}`} />
                          <div className="min-w-0">
                            <div className={`font-semibold text-xs ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                              {nb.label}
                            </div>
                            <div className={`text-[10px] ${isSelected ? 'text-stone-300' : 'text-stone-600'}`}>
                              {nb.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 5. Progress */}
              <button
                onClick={() => handleSelectNavTab('progress')}
                aria-current={activeTab === 'progress' ? 'page' : undefined}
                className={desktopItemClass(activeTab === 'progress')}
              >
                <span>{t('nav_progress')}</span>
                {activeUnderline(activeTab === 'progress')}
              </button>
            </nav>

            {/* RIGHT: Interface Language, Auth & Profile/Settings */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <InterfaceLanguageSelector />

              {authState.isGuest && (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center justify-center gap-1.5 p-2 sm:px-3.5 sm:py-2 rounded-lg bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-xs font-semibold cursor-pointer transition-all duration-150 shadow-xs min-h-[38px] min-w-[38px] shrink-0"
                  aria-label={t('nav_sign_in')}
                  title={t('nav_sign_in')}
                >
                  <LogIn className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{t('nav_sign_in')}</span>
                </button>
              )}

              {/* User Account / Profile Menu Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-xs text-stone-900 transition cursor-pointer min-h-[38px]"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="true"
                  aria-label={t('navigation:profile_menu_aria', 'Profile and Settings Menu')}
                  title={t('navigation:profile_menu_aria', 'Profile and Settings Menu')}
                >
                  <div className="w-6 h-6 rounded-full bg-stone-900 text-amber-300 flex items-center justify-center text-[11px] font-bold shrink-0">
                    {authState.user?.full_name ? (
                      authState.user.full_name.charAt(0).toUpperCase()
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="hidden md:inline font-semibold max-w-[90px] truncate text-stone-800">
                    {authState.user?.full_name?.split(' ')[0] ||
                      (authState.isGuest
                        ? t('navigation:guest_mode', 'Guest')
                        : t('navigation:account', 'Account'))}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 ${
                      isProfileMenuOpen ? 'rotate-180 text-stone-900' : ''
                    }`}
                  />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-[#FDFBF7] border border-stone-200 rounded-2xl shadow-xl p-2 z-50 animate-fadeIn space-y-1">
                    {/* User Identity & Sync Health */}
                    <div className="px-3 py-2.5 border-b border-stone-200 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-xs text-stone-900 truncate">
                          {authState.user?.full_name || t('navigation:guest_mode', 'Guest Mode')}
                        </p>
                        {authState.isGuest && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase shrink-0">
                            {t('nav_guest_mode')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 truncate">
                        {authState.user?.email || t('common:offline', 'Offline Storage')}
                      </p>
                      <div className="pt-1">
                        <SyncStatusBadge />
                      </div>
                    </div>

                    {/* Unified Profile & Settings */}
                    <button
                      onClick={() => handleSelectNavTab('settings')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition cursor-pointer min-h-[42px] ${
                        activeTab === 'settings'
                          ? 'bg-stone-900 text-white'
                          : 'text-stone-800 hover:bg-stone-100'
                      }`}
                    >
                      <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-amber-300' : 'text-stone-500'}`} />
                      <div className="min-w-0">
                        <div className={activeTab === 'settings' ? 'text-white' : 'text-stone-900'}>
                          {t('navigation:my_profile_track', 'My Profile & Track')}
                        </div>
                        <div className={`text-[10px] font-normal ${activeTab === 'settings' ? 'text-stone-300' : 'text-stone-500'}`}>
                          {t('navigation:settings_sync_status', 'Language Matrix, Goals & Preferences')}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenOnboarding();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-stone-800 hover:bg-stone-100 transition cursor-pointer min-h-[40px]"
                    >
                      <GraduationCap className="w-4 h-4 text-amber-600" />
                      <span>{t('navigation:onboarding_guide', 'Welcome Guide')}</span>
                    </button>

                    {authState.role === 'admin' && (
                      <button
                        onClick={() => handleSelectNavTab('admin')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 transition cursor-pointer min-h-[40px]"
                      >
                        <Shield className="w-4 h-4 text-amber-700" />
                        <span>{t('navigation:admin_panel', 'Governance Panel')}</span>
                      </button>
                    )}

                    <div className="border-t border-stone-200 my-1" />

                    {authState.isGuest ? (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenAuth();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-stone-900 hover:bg-stone-100 transition cursor-pointer min-h-[40px]"
                      >
                        <LogIn className="w-4 h-4 text-stone-700" />
                        <span>{t('nav_sign_in')}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          authService.signOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-700 hover:bg-rose-50 transition cursor-pointer min-h-[40px]"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('nav_sign_out')}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Drawer Hamburger Button */}
              <button
                onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
                className="lg:hidden p-2 rounded-xl text-stone-800 hover:bg-stone-100 border border-stone-200 bg-white transition min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer shrink-0 z-10"
                aria-label={isMobileDrawerOpen ? t('navigation:close_menu', 'Close Menu') : t('navigation:open_menu', 'Open Navigation Menu')}
                aria-expanded={isMobileDrawerOpen}
              >
                {isMobileDrawerOpen ? <X className="w-5 h-5 text-stone-900" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Accessible Mobile Bottom Navigation Dock (< 1024px) */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-xl border-t border-stone-200 flex items-center justify-around py-1 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg"
        aria-label={t('navigation:mobile_nav_aria', 'Mobile Navigation')}
      >
        {[
          {
            id: 'dashboard',
            active: activeTab === 'dashboard',
            icon: LayoutDashboard,
            label: t('nav_home'),
            onClick: () => handleSelectNavTab('dashboard'),
          },
          {
            id: 'learn',
            active: isLearnActive || activeTab === 'learn',
            icon: BookOpen,
            label: t('nav_learn'),
            onClick: handleMobileLearnClick,
          },
          {
            id: 'practice',
            active: activeTab === 'practice',
            icon: Sparkles,
            label: t('nav_practice'),
            onClick: () => handleSelectNavTab('practice'),
          },
          {
            id: 'progress',
            active: activeTab === 'progress',
            icon: TrendingUp,
            label: t('nav_progress'),
            onClick: () => handleSelectNavTab('progress'),
          },
          {
            id: 'more',
            active: isMobileDrawerOpen || ['words', 'mistakes', 'settings'].includes(activeTab),
            icon: Menu,
            label: t('navigation:more', 'More'),
            ariaLabel: t('navigation:more_menu_aria', 'More menu'),
            onClick: () => setIsMobileDrawerOpen(true),
          },
        ].map(dockItem => {
          const DockIcon = dockItem.icon;
          return (
            <button
              key={dockItem.id}
              onClick={dockItem.onClick}
              aria-label={dockItem.ariaLabel || dockItem.label}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition cursor-pointer min-h-[44px] ${
                dockItem.active ? 'text-stone-900 font-semibold' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              {dockItem.active && (
                <span className="w-5 h-0.5 rounded-full bg-amber-600 mb-1" aria-hidden="true" />
              )}
              <DockIcon className={`w-5 h-5 ${dockItem.active ? 'mb-0.5 text-stone-900' : 'mb-0.5'}`} />
              <span className="text-[10px] tracking-tight leading-none">{dockItem.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Accessible Mobile Slide-out Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          <div
            className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-[#FDFBF7] border-l border-stone-200 shadow-2xl p-5 flex flex-col justify-between overflow-y-auto animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-5">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div>
                  <Logo size="sm" subtitle={languageContext} />
                  <p className="text-[10px] text-stone-500 mt-1">{t('navigation:full_navigation', 'Full Navigation')}</p>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 cursor-pointer transition min-h-[38px] min-w-[38px] flex items-center justify-center"
                  aria-label={t('navigation:close_menu', 'Close Menu')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Interface Language Picker */}
              <div className="bg-stone-100/70 p-2.5 rounded-xl border border-stone-200">
                <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider mb-1.5 px-1">
                  {t('settings:interface_language', 'Interface Language')}
                </div>
                <InterfaceLanguageSelector className="w-full" />
              </div>

              {/* Section 1: Reading Room & Notebooks */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider px-2">
                  {t('navigation:notebooks_header', 'Personal Notebooks')}
                </span>

                <button
                  onClick={() => handleSelectNavTab('learn')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[44px] ${
                    activeTab === 'learn' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className={`w-4 h-4 ${activeTab === 'learn' ? 'text-amber-300' : 'text-emerald-700'}`} />
                    <div className="text-left">
                      <div className={activeTab === 'learn' ? 'text-white font-semibold' : 'text-stone-900 font-semibold'}>
                        {t('navigation:reading_room_title', 'The Reading Room')}
                      </div>
                      <div className={`text-[10px] font-normal ${activeTab === 'learn' ? 'text-stone-300' : 'text-stone-500'}`}>
                        {t('navigation:reading_room_desc', 'Authentic texts, stories & dialogues')}
                      </div>
                    </div>
                  </div>
                </button>

                {notebookItems.map(nb => {
                  const Icon = nb.icon;
                  const isSelected = activeTab === nb.id;
                  return (
                    <button
                      key={nb.id}
                      onClick={() => handleSelectNavTab(nb.id)}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[44px] ${
                        isSelected ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-800 hover:bg-stone-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-300' : nb.accentClass}`} />
                      <div className="text-left">
                        <div className={isSelected ? 'text-white font-semibold' : 'text-stone-900 font-semibold'}>
                          {nb.label}
                        </div>
                        <div className={`text-[10px] font-normal ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                          {nb.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Section 2: Language Tracks */}
              <div className="space-y-1 pt-2 border-t border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider px-2">
                  {t('navigation:curriculum_tracks_header', 'Language Tracks (CEFR)')}
                </span>
                {curriculumTracks.map((item) => {
                  const isSelected = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectNavTab(item.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[44px] ${
                        isSelected
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'text-stone-800 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base leading-none">{item.flag}</span>
                        <div className="text-left">
                          <div className={isSelected ? 'text-white font-semibold' : 'text-stone-900 font-semibold'}>
                            {item.label}
                          </div>
                          <div className={`text-[10px] font-normal ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                            {item.desc}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-stone-100 text-stone-800 border-stone-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Section 3: Study Tools */}
              <div className="space-y-1 pt-2 border-t border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider px-2">
                  {t('navigation:study_tools_header', 'Study Tools')}
                </span>
                {studyTools.map((tool) => {
                  const ToolIcon = tool.icon;
                  const isSelected = activeTab === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleSelectNavTab(tool.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[44px] ${
                        isSelected
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'text-stone-800 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ToolIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-300' : 'text-stone-600'}`} />
                        <div className="text-left min-w-0">
                          <div className={`truncate ${isSelected ? 'text-white font-semibold' : 'text-stone-900 font-semibold'}`}>
                            {tool.label}
                          </div>
                          <div className={`text-[10px] font-normal truncate ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                            {tool.desc}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold border shrink-0 ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-stone-100 text-stone-600 border-stone-300'
                        }`}
                      >
                        {tool.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Section 4: Account & Preferences */}
              <div className="space-y-1 pt-2 border-t border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider px-2">
                  {t('navigation:account_preferences_header', 'Account & Preferences')}
                </span>
                <button
                  onClick={() => handleSelectNavTab('settings')}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[44px] ${
                    activeTab === 'settings'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-amber-300' : 'text-stone-600'}`} />
                  <span>{t('nav_settings')}</span>
                </button>

                {authState.role === 'admin' && (
                  <button
                    onClick={() => handleSelectNavTab('admin')}
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[44px] ${
                      activeTab === 'admin'
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>{t('navigation:admin_panel', 'Governance Panel')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Drawer Actions */}
            <div className="border-t border-stone-200 pt-4 mt-6 space-y-2.5">
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  onOpenOnboarding();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-xs font-semibold text-stone-800 border border-stone-200 transition cursor-pointer min-h-[44px]"
              >
                <Compass className="w-4 h-4 text-amber-600" />
                <span>{t('navigation:onboarding_guide', 'Welcome Guide')}</span>
              </button>

              {authState.isGuest ? (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-xs font-bold text-white transition shadow-xs cursor-pointer min-h-[44px]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t('nav_sign_in')}</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    authService.signOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 border border-rose-200 transition cursor-pointer min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('nav_sign_out')}</span>
                </button>
              )}

              <div className="text-[11px] text-stone-500 text-center">
                {BRANDING.name} • {BRANDING.tagline}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
