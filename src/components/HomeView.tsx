import React from 'react';
import {
  Armchair,
  Star,
  Bus,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { POPULAR_ROUTES, PopularRoute, SAMPLE_HOMESTAYS } from '../services/api';
import { NavTab } from './TopMenuBar';
import { APPLE_EASE, APPLE_SPRING_SNAPPY, appleStaggerItem } from '../utils/motion';

interface HomeViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenSearch?: () => void;
  onSelectRoute?: (from: string, to: string, routeId?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onSelectRoute,
}) => {
  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-6 sm:gap-7">
      {/* Intro Hero Strip: Refined Minimal Frosted Card */}
      <motion.section
        initial={{ opacity: 0, y: 10, scale: 0.992 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.38, ease: APPLE_EASE }}
        className="rounded-2xl liquid-glass-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-slate-900 dark:text-white leading-snug">
            Book Bus Tickets &amp; Local Stays
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
            Intercity routes with live seat selection and curated home stays.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={APPLE_SPRING_SNAPPY}
            onClick={() => onNavigate('ticket-booking')}
            className="flex-1 sm:flex-initial h-10 px-4 rounded-xl liquid-glass-btn-primary text-white font-medium text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Bus className="w-4 h-4 stroke-[1.9]" />
            <span>Book Bus</span>
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={APPLE_SPRING_SNAPPY}
            onClick={() => onNavigate('homestays')}
            className="flex-1 sm:flex-initial h-10 px-4 rounded-xl liquid-glass-btn-secondary text-slate-800 dark:text-slate-100 font-medium text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Building2 className="w-4 h-4 stroke-[1.9] text-emerald-600 dark:text-emerald-400" />
            <span>Home Stays</span>
          </motion.button>
        </div>
      </motion.section>

      {/* Popular Routes */}
      <section className="flex flex-col gap-3">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.06, ease: APPLE_EASE }}
          className="flex items-center justify-between px-0.5"
        >
          <h2 className="text-base font-semibold tracking-[-0.015em] text-slate-900 dark:text-white">
            Popular Routes
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('ticket-booking')}
            className="h-8 px-3 rounded-xl liquid-glass-btn-ghost text-xs sm:text-sm font-medium text-cyan-700 dark:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        <div className="flex flex-col gap-2.5">
          {POPULAR_ROUTES.map((route: PopularRoute, idx) => (
            <motion.div
              key={route.id}
              {...appleStaggerItem(idx, 0.08)}
              whileHover={{ y: -1.5 }}
              transition={APPLE_SPRING_SNAPPY}
              className="p-4 sm:px-5 sm:py-4 rounded-2xl liquid-glass-card flex flex-row items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1 flex flex-col gap-1">
                <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-[15px] tracking-[-0.01em] truncate">
                  {route.from} &rarr; {route.to}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-normal">
                  <span className="truncate">{route.operator}</span>
                  <span aria-hidden="true">&middot;</span>
                  <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium shrink-0">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-mono">{route.rating}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-sm sm:text-base font-semibold font-mono text-slate-900 dark:text-white block leading-tight">
                    ₹{route.pricePerSeat}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                    per seat
                  </span>
                </div>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  transition={APPLE_SPRING_SNAPPY}
                  onClick={() => {
                    if (onSelectRoute) {
                      onSelectRoute(route.from, route.to, route.id);
                    } else {
                      onNavigate('ticket-booking');
                    }
                  }}
                  className="h-9 px-3.5 rounded-xl liquid-glass-btn-primary text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Armchair className="w-3.5 h-3.5" />
                  <span>Select</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Home Stays */}
      <section className="flex flex-col gap-3">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.16, ease: APPLE_EASE }}
          className="flex items-center justify-between px-0.5"
        >
          <h2 className="text-base font-semibold tracking-[-0.015em] text-slate-900 dark:text-white">
            Curated Home Stays
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('homestays')}
            className="h-8 px-3 rounded-xl liquid-glass-btn-ghost text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5 cursor-pointer"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        <div className="flex flex-col gap-2.5">
          {SAMPLE_HOMESTAYS.slice(0, 3).map((stay, idx) => (
            <motion.div
              key={stay.id}
              {...appleStaggerItem(idx, 0.2)}
              whileHover={{ y: -1.5 }}
              transition={APPLE_SPRING_SNAPPY}
              className="p-3.5 sm:p-4 rounded-2xl liquid-glass-card flex flex-row items-center gap-3.5 sm:gap-4"
            >
              <div className="relative w-20 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/70 dark:border-white/10">
                <img
                  src={stay.imageUrl}
                  alt={stay.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105"
                  loading="lazy"
                />
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm sm:text-[15px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-white truncate">
                      {stay.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-mono">{stay.rating.toFixed(1)}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {stay.city} &middot; {stay.stayType}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm sm:text-[15px] font-semibold font-mono text-slate-900 dark:text-white">
                      ₹{stay.pricePerNight.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                      / night
                    </span>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    transition={APPLE_SPRING_SNAPPY}
                    onClick={() => onNavigate('homestays')}
                    className="h-8 sm:h-9 px-3.5 rounded-xl liquid-glass-btn-emerald text-xs sm:text-sm font-medium flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <span>Reserve</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
