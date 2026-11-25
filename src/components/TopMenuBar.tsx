import React, { useEffect, useRef } from 'react';
import { Bus, Search, Sun, Moon, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { useLiquidGlass } from '../context/LiquidGlassContext';
import { APPLE_EASE, APPLE_SPRING_SNAPPY } from '../utils/motion';

export type NavTab = 'home' | 'ticket-booking' | 'homestays' | 'my-bookings' | 'profile';

interface TopMenuBarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenSearch: () => void;
  availableSeatsCount?: number;
  totalBookingsCount?: number;
  userName?: string;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  userName = 'Kishor Khan',
}) => {
  const { theme, toggleTheme } = useTheme();
  const { neonEnabled, toggleNeon, webglActive, registerPanel } = useLiquidGlass();
  const headerRef = useRef<HTMLElement>(null);
  const neonBtnRef = useRef<HTMLButtonElement>(null);
  const themeBtnRef = useRef<HTMLButtonElement>(null);
  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const accountBtnRef = useRef<HTMLButtonElement>(null);
  const isProfileActive = activeTab === 'profile';

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    cleanups.push(
      registerPanel('header', () => {
        const el = headerRef.current;
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          w: rect.width,
          h: rect.height,
          cornerRadius: window.innerWidth >= 640 ? 20 : 16,
          shadowOpacity: 0,
        };
      })
    );

    const registerBtn = (
      id: 'hdr-neon' | 'hdr-theme' | 'hdr-search' | 'hdr-account',
      ref: React.RefObject<HTMLButtonElement | null>,
      accentActive = false
    ) => {
      cleanups.push(
        registerPanel(id, () => {
          const el = ref.current;
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return null;
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            w: rect.width,
            h: rect.height,
            cornerRadius: 12,
            zRadius: 16,
            refraction: 0.69,
            shadowOpacity: 0,
            ...(accentActive
              ? {
                  tintCol: [0.08, 0.72, 0.85] as [number, number, number],
                  tintAlpha: 0.22,
                }
              : {}),
          };
        })
      );
    };

    registerBtn('hdr-neon', neonBtnRef, neonEnabled);
    registerBtn('hdr-theme', themeBtnRef, false);
    registerBtn('hdr-search', searchBtnRef, false);
    registerBtn('hdr-account', accountBtnRef, isProfileActive);

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [registerPanel, neonEnabled, isProfileActive]);

  const initials =
    userName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'U';

  const headerBtnGlassClass = webglActive
    ? 'bg-transparent border border-slate-900/[0.08] dark:border-white/[0.14] hover:bg-white/25 dark:hover:bg-white/[0.08]'
    : 'liquid-glass-btn-secondary';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: APPLE_EASE }}
      className="fixed top-0 inset-x-0 z-30 px-3 sm:px-6 lg:px-8 pt-2.5 sm:pt-3.5 pointer-events-none select-none"
    >
      <header
        ref={headerRef}
        className={`pointer-events-auto max-w-[1280px] mx-auto w-full h-16 sm:h-[68px] px-3 sm:px-4 rounded-2xl sm:rounded-[20px] flex items-center justify-between gap-2 sm:gap-4 transition-colors duration-300 ${
          webglActive
            ? 'bg-transparent border border-slate-900/[0.06] dark:border-white/[0.1]'
            : 'liquid-glass-nav border border-slate-200/80 dark:border-white/10'
        }`}
      >
        {/* Left: Brand Identity */}
        <motion.button
          type="button"
          onClick={() => setActiveTab('home')}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.97 }}
          transition={APPLE_SPRING_SNAPPY}
          className="group flex items-center gap-2.5 sm:gap-3 cursor-pointer rounded-xl px-2 py-1.5 hover:bg-white/30 dark:hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 transition-colors duration-200 whitespace-nowrap shrink-0"
          aria-label="SeatEase Home"
        >
          <motion.div
            whileHover={{ rotate: -4, scale: 1.04 }}
            transition={APPLE_SPRING_SNAPPY}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl liquid-glass-btn-primary flex items-center justify-center text-white dark:text-slate-950 transition-colors duration-300"
          >
            <Bus className="w-[18px] h-[18px] sm:w-5 sm:h-5 stroke-[2]" />
          </motion.div>
          <span className="text-[17px] sm:text-[19px] font-semibold tracking-[-0.02em] text-slate-900 dark:text-white leading-none transition-colors duration-300">
            Seat<span className="text-cyan-700 dark:text-cyan-400">Ease</span>
          </span>
        </motion.button>

        {/* Right: Unified Utility Controls (Neon Glass, Theme, Search, Account) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Neon Optical Rim Toggle */}
          <motion.button
            ref={neonBtnRef}
            type="button"
            onClick={toggleNeon}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            transition={APPLE_SPRING_SNAPPY}
            aria-pressed={neonEnabled}
            aria-label={neonEnabled ? 'Disable neon glass glow' : 'Enable neon glass glow'}
            title={neonEnabled ? 'Neon Glass: On' : 'Neon Glass: Off'}
            className={`h-10 sm:h-11 px-2.5 sm:px-3.5 min-w-[40px] sm:min-w-[44px] rounded-xl text-sm font-medium inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
              neonEnabled
                ? 'bg-cyan-500/12 dark:bg-cyan-400/15 border border-cyan-500/55 dark:border-cyan-400/55 text-cyan-800 dark:text-cyan-200'
                : `${headerBtnGlassClass} text-slate-700 dark:text-slate-200`
            }`}
          >
            <Sparkles
              className={`w-[18px] h-[18px] stroke-[1.9] transition-colors duration-300 ${
                neonEnabled
                  ? 'text-cyan-600 dark:text-cyan-300'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            />
            <span className="hidden lg:inline text-[13px] font-medium">Neon</span>
          </motion.button>

          {/* Theme Changer with Smooth Morphing Icon */}
          <motion.button
            ref={themeBtnRef}
            type="button"
            onClick={toggleTheme}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            transition={APPLE_SPRING_SNAPPY}
            className={`h-10 sm:h-11 px-2.5 sm:px-3.5 min-w-[40px] sm:min-w-[44px] rounded-xl ${headerBtnGlassClass} text-slate-700 dark:text-slate-200 text-sm font-medium inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="relative w-[18px] h-[18px] flex items-center justify-center">
              <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                  <motion.span
                    key="sun"
                    initial={{ opacity: 0, rotate: -75, scale: 0.65 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 75, scale: 0.65 }}
                    transition={{ duration: 0.24, ease: APPLE_EASE }}
                    className="inline-flex items-center justify-center"
                  >
                    <Sun className="w-[18px] h-[18px] text-amber-400 stroke-[1.9]" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="moon"
                    initial={{ opacity: 0, rotate: 75, scale: 0.65 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: -75, scale: 0.65 }}
                    transition={{ duration: 0.24, ease: APPLE_EASE }}
                    className="inline-flex items-center justify-center"
                  >
                    <Moon className="w-[18px] h-[18px] text-slate-600 stroke-[1.9]" />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <span className="hidden md:inline text-[13px] font-medium text-slate-700 dark:text-slate-200 transition-colors duration-200">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </motion.button>

          {/* Search Button */}
          <motion.button
            ref={searchBtnRef}
            type="button"
            onClick={onOpenSearch}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            transition={APPLE_SPRING_SNAPPY}
            className={`h-10 sm:h-11 px-2.5 sm:px-4 min-w-[40px] sm:min-w-[44px] rounded-xl ${headerBtnGlassClass} text-slate-700 dark:text-slate-200 text-sm font-medium inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50`}
            aria-label="Search routes, bookings, and stays"
            title="Search"
          >
            <Search className="w-[18px] h-[18px] text-slate-600 dark:text-slate-300 stroke-[1.9]" />
            <span className="hidden sm:inline text-[13px] font-medium">Search</span>
          </motion.button>

          {/* Account / Profile Control */}
          <motion.button
            ref={accountBtnRef}
            type="button"
            onClick={() => setActiveTab('profile')}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={APPLE_SPRING_SNAPPY}
            className={`h-10 sm:h-11 px-2 sm:pl-2 sm:pr-3.5 min-w-[40px] sm:min-w-[44px] rounded-xl inline-flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
              isProfileActive
                ? 'bg-cyan-600/12 dark:bg-cyan-400/18 border border-cyan-600/35 dark:border-cyan-400/35 text-cyan-800 dark:text-cyan-200'
                : `${headerBtnGlassClass} text-slate-800 dark:text-slate-100`
            }`}
            title={`Account: ${userName}`}
            aria-label={`Account profile for ${userName}`}
            aria-current={isProfileActive ? 'page' : undefined}
          >
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold tracking-tight shrink-0 transition-colors duration-300 ${
                isProfileActive
                  ? 'bg-cyan-700 dark:bg-cyan-400 text-white dark:text-slate-950'
                  : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
              }`}
            >
              {initials}
            </span>
            <span className="hidden sm:inline text-[13px] font-medium max-w-[132px] truncate">
              {userName}
            </span>
          </motion.button>
        </div>
      </header>
    </motion.div>
  );
};
