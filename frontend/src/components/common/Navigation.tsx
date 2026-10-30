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
  Library,
  BookMarked,
} from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';
import { InterfaceLanguage } from '../../i18n/translations';
import { authService, AuthState } from '../../services/auth';
import { courseService } from '../../services/courseService';
import { Logo } from './Logo';
import { InterfaceLanguageSelector } from './InterfaceLanguageSelector';
import { BRANDING } from '../../config/branding';

export type NavTab =
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
  streakDays?: number;
  onOpenAuth: () => void;
  onOpenOnboarding: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenAuth,
  onOpenOnboarding,
}) => {
  const { t, interfaceLanguage, setInterfaceLanguage } = useI18n();
  const [authState, setAuthState] = useState<AuthState>(authService.getState());
  const [isLearnDropdownOpen, setIsLearnDropdownOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const learnDropdownRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubAuth = authService.subscribe(setAuthState);
    return () => {
      unsubAuth();
    };
  }, []);

  useEffect(() => {
    // Apply saved font size if previously set in settings/localStorage
    try {
      const saved = localStorage.getItem('polyglot_font_size');
      const root = document.documentElement;
      if (saved === 'large') {
        root.style.fontSize = '17px';
      } else if (saved === 'xlarge') {
        root.style.fontSize = '18.5px';
      } else {
        root.style.fontSize = '16px';
      }
    } catch {}

    const handleClickOutside = (e: MouseEvent) => {
      if (learnDropdownRef.current && !learnDropdownRef.current.contains(e.target as Node)) {
        setIsLearnDropdownOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLearnDropdownOpen(false);
        setIsProfileMenuOpen(false);
        setIsMobileDrawerOpen(false);
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
    setIsProfileMenuOpen(false);
    setIsMobileDrawerOpen(false);
  };

  // Determine active course track for smart mobile navigation
  const getActiveCourseTab = (): NavTab => {
    try {
      const activeCourse = courseService.getActiveCourse();
      if (activeCourse?.target_language === 'es') return 'spanish';
      if (activeCourse?.target_language === 'en') return 'english';
      return 'portuguese';
    } catch {
      return 'portuguese';
    }
  };

  const isLearnActive = [
    'portuguese',
    'spanish',
    'english',
    'vocabulary',
    'translate',
    'explore',
  ].includes(activeTab);

  const curriculumTracks = [
    {
      id: 'portuguese' as NavTab,
      label: t('nav_portuguese'),
      desc: t('track_portuguese_desc', 'Trilha Imersiva C1 / B2'),
      badge: 'PT',
      flag: '🇵🇹',
    },
    {
      id: 'spanish' as NavTab,
      label: t('nav_spanish'),
      desc: t('track_spanish_desc', 'Trilha Imersiva C1 / B2'),
      badge: 'ES',
      flag: '🇪🇸',
    },
    {
      id: 'english' as NavTab,
      label: t('nav_english'),
      desc: t('track_english_desc', 'Trilha para Falantes PT/ES'),
      badge: 'EN',
      flag: '🇬🇧',
    },
  ];

  const studyTools = [
    {
      id: 'vocabulary' as NavTab,
      label: t('nav_vocabulary'),
      desc: t('tool_vocabulary_desc', 'Top 200 & Frases do Cotidiano'),
      badge: 'VOCAB',
      icon: BookMarked,
    },
    {
      id: 'translate' as NavTab,
      label: t('nav_translate'),
      desc: t('tool_translate_desc', 'Dicionário Bilíngue & Tradução'),
      badge: 'DICT',
      icon: Languages,
    },
    {
      id: 'explore' as NavTab,
      label: t('nav_explore'),
      desc: t('tool_explore_desc', 'Imersão Cultural & Leituras Globais'),
      badge: 'CULTURE',
      icon: Compass,
    },
  ];

  const handleMobileLearnClick = () => {
    if (isLearnActive) {
      // If user is already on a learning tab, open the drawer for quick course switching
      setIsMobileDrawerOpen(true);
    } else {
      handleSelectNavTab(getActiveCourseTab());
    }
  };

  return (
    <>
      {/* Top Header Navbar */}
      <header className="bg-slate-900/95 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md w-full shadow-sm">
        <div className="w-full px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 w-full">
            {/* LEFT CORNER ALWAYS: Brand Logo & Title */}
            <div
              role="button"
              tabIndex={0}
              className="flex items-center gap-2 cursor-pointer shrink-0 select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
              onClick={() => handleSelectNavTab('dashboard')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleSelectNavTab('dashboard');
              }}
              aria-label={`${BRANDING.name} Início`}
            >
              <Logo size="md" />
              {authState.isGuest && (
                <span className="hidden xl:inline-flex items-center ml-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80 uppercase tracking-wide">
                  {t('nav_guest_mode')}
                </span>
              )}
            </div>

            {/* CENTER: Desktop Navigation Menu */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 mx-auto" aria-label="Navegação Principal">
              {/* 1. Home / Dashboard */}
              <button
                onClick={() => handleSelectNavTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[42px] cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-800 text-indigo-300 shadow-sm border border-slate-700/80 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                <span>{t('nav_home')}</span>
              </button>

              {/* 2. Learn Dropdown (PT, ES, EN, Vocab, Dictionary) */}
              <div className="relative" ref={learnDropdownRef}>
                <button
                  onClick={() => setIsLearnDropdownOpen(!isLearnDropdownOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[42px] cursor-pointer ${
                    isLearnActive
                      ? 'bg-slate-800 text-emerald-300 shadow-sm border border-slate-700/80 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  aria-expanded={isLearnDropdownOpen}
                  aria-haspopup="true"
                  aria-label={`${t('nav_learn')} menu`}
                >
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>{t('nav_learn')}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isLearnDropdownOpen ? 'rotate-180 text-emerald-300' : 'text-slate-500'
                    }`}
                  />
                </button>

                {/* Dropdown Menu Panel */}
                {isLearnDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn space-y-2 backdrop-blur-md">
                    {/* Curriculum Tracks Section */}
                    <div>
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Trilhas de Idiomas (CEFR)
                      </div>
                      <div className="space-y-1 mt-0.5">
                        {curriculumTracks.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => handleSelectNavTab(sub.id)}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer min-h-[42px] ${
                              activeTab === sub.id
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg leading-none">{sub.flag}</span>
                              <div>
                                <div className="font-semibold text-xs text-slate-100">{sub.label}</div>
                                <div className="text-[10px] text-slate-400">{sub.desc}</div>
                              </div>
                            </div>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                activeTab === sub.id
                                  ? 'bg-indigo-700/80 text-indigo-100 border-indigo-500'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {sub.badge}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-800/80 my-1" />

                    {/* Reference & Practice Tools Section */}
                    <div>
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Ferramentas de Estudo
                      </div>
                      <div className="space-y-1 mt-0.5">
                        {studyTools.map((tool) => {
                          const IconComp = tool.icon;
                          return (
                            <button
                              key={tool.id}
                              onClick={() => handleSelectNavTab(tool.id)}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer min-h-[42px] ${
                                activeTab === tool.id
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                    activeTab === tool.id ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-indigo-400'
                                  }`}
                                >
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-semibold text-xs text-slate-100">{tool.label}</div>
                                  <div className="text-[10px] text-slate-400">{tool.desc}</div>
                                </div>
                              </div>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                  activeTab === tool.id
                                    ? 'bg-indigo-700/80 text-indigo-100 border-indigo-500'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
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
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[42px] cursor-pointer ${
                  activeTab === 'practice'
                    ? 'bg-slate-800 text-amber-300 shadow-sm border border-slate-700/80 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{t('nav_practice')}</span>
              </button>

              {/* 4. Progress */}
              <button
                onClick={() => handleSelectNavTab('progress')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[42px] cursor-pointer ${
                  activeTab === 'progress'
                    ? 'bg-slate-800 text-indigo-300 shadow-sm border border-slate-700/80 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>{t('nav_progress')}</span>
              </button>
            </nav>

            {/* RIGHT CORNER ALWAYS: Language Switcher, Sign In Button & Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Centralized Accessible 15-Locale Interface Language Selector */}
              <InterfaceLanguageSelector />

              {/* Sign In CTA Button (Guests) */}
              {authState.isGuest && (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center justify-center gap-1.5 p-2 sm:px-4 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs sm:text-sm font-bold cursor-pointer transition-all duration-150 shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/40 min-h-[38px] min-w-[38px] shrink-0"
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
                  className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 hover:text-white transition cursor-pointer min-h-[38px]"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="true"
                  aria-label={t('navigation:profile_menu_aria', 'Menu do Perfil e Configurações')}
                  title={t('navigation:profile_menu_aria', 'Menu do Perfil e Configurações')}
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold shadow-inner shrink-0">
                    {authState.user?.full_name ? (
                      authState.user.full_name.charAt(0).toUpperCase()
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="hidden md:inline font-semibold max-w-[90px] truncate">
                    {authState.user?.full_name?.split(' ')[0] || (authState.isGuest ? t('navigation:guest_mode', 'Convidado') : t('navigation:account', 'Conta'))}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      isProfileMenuOpen ? 'rotate-180 text-indigo-400' : ''
                    }`}
                  />
                </button>

                {/* Profile Menu Dropdown Panel */}
                {isProfileMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn space-y-1 backdrop-blur-md">
                    {/* User Info Header */}
                    <div className="px-3 py-2 border-b border-slate-800/80">
                      <p className="font-bold text-xs text-white truncate">
                        {authState.user?.full_name || t('navigation:guest_mode', 'Modo Convidado')}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {authState.user?.email || t('common:offline', 'Armazenamento Local Offline')}
                      </p>
                    </div>

                    {/* Profile & Settings Navigation */}
                    <button
                      onClick={() => handleSelectNavTab('settings')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    >
                      <User className="w-4 h-4 text-indigo-400" />
                      <span>{t('navigation:my_profile_track', 'Meu Perfil & Metas')}</span>
                    </button>

                    <button
                      onClick={() => handleSelectNavTab('settings')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>{t('nav_settings')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenOnboarding();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    >
                      <GraduationCap className="w-4 h-4 text-amber-400" />
                      <span>{t('navigation:onboarding_guide', 'Guia de Boas-Vindas')}</span>
                    </button>

                    {/* Admin Item if Admin */}
                    {authState.role === 'admin' && (
                      <button
                        onClick={() => handleSelectNavTab('admin')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-purple-300 hover:text-purple-100 hover:bg-purple-950/60 border border-purple-900/60 transition cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-purple-400" />
                        <span>{t('navigation:admin_panel', 'Console Admin')}</span>
                      </button>
                    )}

                    <div className="border-t border-slate-800/80 my-1" />

                    {/* Sign in / Sign out */}
                    {authState.isGuest ? (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenAuth();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 transition cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>{t('nav_sign_in')}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          authService.signOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition cursor-pointer"
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
                className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/70 transition min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer shrink-0 z-10"
                aria-label={isMobileDrawerOpen ? 'Fechar Menu de Navegação' : 'Abrir Menu de Navegação'}
                aria-expanded={isMobileDrawerOpen}
              >
                {isMobileDrawerOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Accessible Mobile Bottom Navigation Dock (< 1024px) */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 flex items-center justify-around py-1.5 px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl"
        aria-label="Navegação Principal Móvel"
      >
        {/* 1. Home */}
        <button
          onClick={() => handleSelectNavTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition cursor-pointer min-h-[44px] ${
            activeTab === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight leading-none">{t('nav_home')}</span>
        </button>

        {/* 2. Learn (Course-aware: Navigates to active course or opens drawer if already in learn) */}
        <button
          onClick={handleMobileLearnClick}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition cursor-pointer min-h-[44px] ${
            isLearnActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label={t('nav_learn')}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight leading-none">{t('nav_learn')}</span>
        </button>

        {/* 3. Practice */}
        <button
          onClick={() => handleSelectNavTab('practice')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition cursor-pointer min-h-[44px] ${
            activeTab === 'practice' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight leading-none">{t('nav_practice')}</span>
        </button>

        {/* 4. Progress */}
        <button
          onClick={() => handleSelectNavTab('progress')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition cursor-pointer min-h-[44px] ${
            activeTab === 'progress' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight leading-none">{t('nav_progress')}</span>
        </button>
      </nav>

      {/* Accessible Mobile Slide-out Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          <div
            className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-slate-900 border-l border-slate-800/90 shadow-2xl p-5 flex flex-col justify-between overflow-y-auto animate-slideLeft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-5">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <Logo size="sm" />
                  <p className="text-[10px] text-slate-400 mt-1">Navegação Completa</p>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition"
                  aria-label="Fechar Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Interface Language Dropdown in Drawer */}
              <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 px-1">
                  {t('settings:interface_lang_label', 'Idioma da Interface')}
                </div>
                <InterfaceLanguageSelector className="w-full" />
              </div>

              {/* Subsection 1: Trilhas de Idiomas */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-2">
                  {t('learning:curriculum_tracks', 'Trilhas de Aprendizado (CEFR)')}
                </span>
                {curriculumTracks.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNavTab(item.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[44px] ${
                      activeTab === item.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base leading-none">{item.flag}</span>
                      <div className="text-left">
                        <div className="text-slate-100 font-semibold">{item.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{item.desc}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        activeTab === item.id
                          ? 'bg-indigo-700/80 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </button>
                ))}
              </div>

              {/* Subsection 2: Ferramentas & Vocabulário */}
              <div className="space-y-1 pt-2 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-2">
                  {t('learning:study_tools', 'Ferramentas & Consulta')}
                </span>
                {studyTools.map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleSelectNavTab(tool.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[44px] ${
                        activeTab === tool.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ToolIcon className="w-4 h-4 text-indigo-400" />
                        <div className="text-left">
                          <div className="text-slate-100 font-semibold">{tool.label}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{tool.desc}</div>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                          activeTab === tool.id
                            ? 'bg-indigo-700/80 text-white border-indigo-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {tool.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Subsection 3: Preferências & Admin */}
              <div className="space-y-1 pt-2 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-2">
                  {t('settings:title', 'Sistema & Preferências')}
                </span>
                <button
                  onClick={() => handleSelectNavTab('settings')}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[44px] ${
                    activeTab === 'settings'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>{t('nav_settings')}</span>
                </button>

                {authState.role === 'admin' && (
                  <button
                    onClick={() => handleSelectNavTab('admin')}
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[44px] ${
                      activeTab === 'admin'
                        ? 'bg-purple-900 text-white shadow-sm'
                        : 'text-purple-400 hover:bg-slate-800'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>{t('navigation:admin_panel', 'Painel Administrativo')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Drawer Actions */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  onOpenOnboarding();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer min-h-[44px]"
              >
                <Compass className="w-4 h-4 text-sky-400" />
                <span>{t('navigation:onboarding_guide', 'Reiniciar Guia de Onboarding')}</span>
              </button>

              {/* Sign in / Sign out button in drawer */}
              {authState.isGuest ? (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-sm cursor-pointer min-h-[44px]"
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
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-xs font-bold text-rose-300 border border-slate-700/80 hover:border-rose-800 transition cursor-pointer min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('nav_sign_out')}</span>
                </button>
              )}

              <div className="text-[11px] text-slate-500 text-center">
                {BRANDING.name} • {BRANDING.tagline}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
