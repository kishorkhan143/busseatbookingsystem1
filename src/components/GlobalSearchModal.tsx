import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Ticket, Bus, Building2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BookingData, POPULAR_ROUTES, SAMPLE_HOMESTAYS } from '../services/api';
import { NavTab } from './TopMenuBar';
import { APPLE_EASE, appleStaggerItem } from '../utils/motion';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingData[];
  onNavigate: (tab: NavTab) => void;
  onSelectBooking: (booking: BookingData) => void;
  onSelectRoute?: (from: string, to: string, routeId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  bookings,
  onNavigate,
  onSelectBooking,
  onSelectRoute,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 90);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const q = query.trim().toLowerCase();

  const matchingBookings = q
    ? bookings.filter(
        (b) =>
          b.pnr.toLowerCase().includes(q) ||
          String(b.bookingId).includes(q) ||
          b.customer.name.toLowerCase().includes(q) ||
          (b.from && b.from.toLowerCase().includes(q)) ||
          (b.to && b.to.toLowerCase().includes(q)) ||
          (b.stayName && b.stayName.toLowerCase().includes(q))
      )
    : [];

  const matchingRoutes = q
    ? POPULAR_ROUTES.filter(
        (r) =>
          r.from.toLowerCase().includes(q) ||
          r.to.toLowerCase().includes(q) ||
          r.operator.toLowerCase().includes(q)
      )
    : POPULAR_ROUTES.slice(0, 2);

  const matchingStays = q
    ? SAMPLE_HOMESTAYS.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q)
      )
    : SAMPLE_HOMESTAYS.slice(0, 2);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="global-search-drawer"
          initial={{ opacity: 0, y: -12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.985 }}
          transition={{ duration: 0.28, ease: APPLE_EASE }}
          className="fixed top-[80px] sm:top-[88px] inset-x-0 z-40 px-3 sm:px-6 lg:px-8"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-5 py-4 rounded-2xl liquid-glass-nav border border-slate-200/80 dark:border-white/10 flex flex-col gap-3.5">
            <div className="relative flex items-center">
              <Search className="w-[18px] h-[18px] text-slate-400 dark:text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search bookings, routes, home stays, or PNR..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 liquid-glass-input rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-normal"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="absolute right-2 w-8 h-8 rounded-lg liquid-glass-btn-ghost flex items-center justify-center text-slate-500 dark:text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto flex flex-col gap-3 pb-1 text-sm">
              {matchingBookings.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-1">
                    Bookings
                  </span>
                  {matchingBookings.map((b, idx) => (
                    <motion.button
                      key={b.bookingId}
                      type="button"
                      {...appleStaggerItem(idx, 0.02)}
                      onClick={() => {
                        onSelectBooking(b);
                        onNavigate('my-bookings');
                        onClose();
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl liquid-glass-btn-secondary flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {b.bookingType === 'HOMESTAY' ? (
                          <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <Ticket className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        )}
                        <span className="font-mono font-medium text-slate-900 dark:text-white shrink-0">
                          {b.pnr}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 truncate">
                          {b.stayName || `${b.from} → ${b.to}`}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white shrink-0">
                        ₹{b.totalAmount}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}

              {matchingRoutes.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-1">
                    Routes
                  </span>
                  {matchingRoutes.map((r, idx) => (
                    <motion.button
                      key={r.id}
                      type="button"
                      {...appleStaggerItem(idx, 0.04)}
                      onClick={() => {
                        if (onSelectRoute) {
                          onSelectRoute(r.from, r.to, r.id);
                        } else {
                          onNavigate('ticket-booking');
                        }
                        onClose();
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl liquid-glass-btn-secondary flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Bus className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span className="font-medium text-slate-900 dark:text-white truncate">
                          {r.from} &rarr; {r.to}
                        </span>
                        <span className="hidden sm:inline text-slate-500 dark:text-slate-400 text-xs truncate">
                          &middot; {r.operator}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white shrink-0">
                        ₹{r.pricePerSeat}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}

              {matchingStays.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-1">
                    Home Stays
                  </span>
                  {matchingStays.map((s, idx) => (
                    <motion.button
                      key={s.id}
                      type="button"
                      {...appleStaggerItem(idx, 0.08)}
                      onClick={() => {
                        onNavigate('homestays');
                        onClose();
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl liquid-glass-btn-secondary flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-medium text-slate-900 dark:text-white truncate">
                          {s.name}
                        </span>
                        <span className="hidden sm:inline text-slate-500 dark:text-slate-400 text-xs shrink-0">
                          &middot; {s.city}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white shrink-0">
                        ₹{s.pricePerNight.toLocaleString('en-IN')}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}

              {q && matchingBookings.length === 0 && matchingRoutes.length === 0 && matchingStays.length === 0 && (
                <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  No matches found for &ldquo;{query}&rdquo;
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
