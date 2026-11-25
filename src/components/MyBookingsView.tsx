import React, { useState } from 'react';
import {
  Ticket,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Printer,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BookingData } from '../services/api';
import { NavTab } from './TopMenuBar';
import { APPLE_EASE, APPLE_SPRING_SNAPPY, appleStaggerItem } from '../utils/motion';

interface MyBookingsViewProps {
  bookings: BookingData[];
  onCancelBooking: (bookingId: number) => Promise<void>;
  onNavigate: (tab: NavTab) => void;
  isLoading: boolean;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  bookings,
  onCancelBooking,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BUS' | 'HOMESTAY' | 'CANCELLED'>('ALL');
  const [selectedBookingForPass, setSelectedBookingForPass] = useState<BookingData | null>(null);

  const [bookingIdToCancel, setBookingIdToCancel] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const filteredBookings = bookings.filter((b) => {
    const q = searchQuery.trim().toLowerCase();
    const isHomestay = b.bookingType === 'HOMESTAY';

    const matchesSearch =
      !q ||
      b.pnr.toLowerCase().includes(q) ||
      String(b.bookingId).includes(q) ||
      b.customer.name.toLowerCase().includes(q) ||
      b.customer.mobile.includes(q) ||
      (b.seatIds && b.seatIds.some((s) => s.toLowerCase().includes(q))) ||
      (b.from && b.from.toLowerCase().includes(q)) ||
      (b.to && b.to.toLowerCase().includes(q)) ||
      (b.stayName && b.stayName.toLowerCase().includes(q));

    let matchesFilter = true;
    if (statusFilter === 'CANCELLED') {
      matchesFilter = b.bookingStatus === 'CANCELLED';
    } else if (statusFilter === 'BUS') {
      matchesFilter = b.bookingType !== 'HOMESTAY' && b.bookingStatus !== 'CANCELLED';
    } else if (statusFilter === 'HOMESTAY') {
      matchesFilter = isHomestay && b.bookingStatus !== 'CANCELLED';
    }

    return matchesSearch && matchesFilter;
  });

  const handleConfirmCancel = async (booking: BookingData) => {
    setIsCancelling(true);
    setCancelError(null);
    try {
      await onCancelBooking(booking.bookingId);
      setCancelFeedback(
        booking.bookingType === 'HOMESTAY'
          ? `Homestay #${booking.bookingId} cancelled.`
          : `Ticket #${booking.bookingId} cancelled.`
      );
      setBookingIdToCancel(null);
    } catch (err: unknown) {
      setCancelError(err instanceof Error ? err.message : 'Cancellation failed.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-5">
      <AnimatePresence mode="wait" initial={false}>
        {selectedBookingForPass ? (
          <motion.div
            key={`pass-${selectedBookingForPass.bookingId}`}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.994 }}
            transition={{ duration: 0.32, ease: APPLE_EASE }}
            className="w-full flex flex-col gap-4"
          >
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl liquid-glass-card">
              <button
                type="button"
                onClick={() => setSelectedBookingForPass(null)}
                className="h-8 px-3 rounded-xl liquid-glass-btn-ghost inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Bookings</span>
              </button>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {selectedBookingForPass.bookingType === 'HOMESTAY' ? 'Stay voucher' : 'Boarding pass'}
              </span>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl liquid-glass-card flex flex-col gap-4 max-w-lg mx-auto w-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/[0.06]">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">PNR reference</span>
                <span className="font-mono font-semibold text-cyan-700 dark:text-cyan-300 text-base">
                  {selectedBookingForPass.pnr}
                </span>
              </div>

              {selectedBookingForPass.bookingType === 'HOMESTAY' ? (
                <div className="flex flex-col gap-2.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Property</span>
                    <span className="font-medium text-slate-900 dark:text-white text-right">
                      {selectedBookingForPass.stayName}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Location</span>
                    <span className="text-xs text-slate-700 dark:text-slate-200 text-right">
                      {selectedBookingForPass.stayLocation}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Dates</span>
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-200 text-right">
                      {selectedBookingForPass.checkInDate} &rarr; {selectedBookingForPass.checkOutDate} ({selectedBookingForPass.nights}N)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Route</span>
                    <span className="font-medium text-slate-900 dark:text-white text-right">
                      {selectedBookingForPass.from} &rarr; {selectedBookingForPass.to}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Bus</span>
                    <span className="text-xs text-slate-700 dark:text-slate-200 text-right">
                      {selectedBookingForPass.busName}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Departure</span>
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-200 text-right">
                      {selectedBookingForPass.departureTime} &middot; {selectedBookingForPass.journeyDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Seats</span>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {selectedBookingForPass.seatIds?.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md bg-cyan-600/12 dark:bg-cyan-400/15 text-cyan-800 dark:text-cyan-200 font-mono font-medium text-xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.06] flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Passenger</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {selectedBookingForPass.customer.name}{' '}
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    (+91 {selectedBookingForPass.customer.mobile})
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                <span className="text-xs text-slate-500 dark:text-slate-400">Amount paid</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white text-base">
                  ₹{selectedBookingForPass.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  transition={APPLE_SPRING_SNAPPY}
                  onClick={() => window.print()}
                  className="flex-1 h-10 rounded-xl liquid-glass-btn-secondary text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  transition={APPLE_SPRING_SNAPPY}
                  onClick={() => setSelectedBookingForPass(null)}
                  className="flex-1 h-10 rounded-xl liquid-glass-btn-primary text-white text-sm font-medium flex items-center justify-center cursor-pointer"
                >
                  Done
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="bookings-list"
            initial={{ opacity: 0, y: 10, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.994 }}
            transition={{ duration: 0.3, ease: APPLE_EASE }}
            className="flex flex-col gap-5"
          >
            {/* Header Strip */}
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl liquid-glass-card">
              <div>
                <h1 className="text-lg sm:text-xl font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">
                  My Bookings
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Active tickets, stay vouchers, and past cancellations
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  transition={APPLE_SPRING_SNAPPY}
                  onClick={() => onNavigate('ticket-booking')}
                  className="h-9 px-3.5 rounded-xl liquid-glass-btn-primary text-white text-xs sm:text-sm font-medium cursor-pointer whitespace-nowrap"
                >
                  + Bus
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  transition={APPLE_SPRING_SNAPPY}
                  onClick={() => onNavigate('homestays')}
                  className="h-9 px-3.5 rounded-xl liquid-glass-btn-secondary text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium cursor-pointer whitespace-nowrap"
                >
                  + Stay
                </motion.button>
              </div>
            </div>

            <AnimatePresence>
              {cancelFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.99 }}
                  transition={{ duration: 0.25, ease: APPLE_EASE }}
                  className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {cancelFeedback}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCancelFeedback(null)}
                    className="w-7 h-7 rounded-lg liquid-glass-btn-ghost text-emerald-700 dark:text-emerald-300 flex items-center justify-center cursor-pointer"
                    aria-label="Dismiss notification"
                  >
                    &times;
                  </button>
                </motion.div>
              )}

              {cancelError && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.99 }}
                  transition={{ duration: 0.25, ease: APPLE_EASE }}
                  className="px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-sm flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {cancelError}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCancelError(null)}
                    className="w-7 h-7 rounded-lg liquid-glass-btn-ghost text-rose-700 dark:text-rose-300 flex items-center justify-center cursor-pointer"
                    aria-label="Dismiss error"
                  >
                    &times;
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search & Filter */}
            <div className="p-3.5 sm:p-4 rounded-2xl liquid-glass-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search PNR, city, or passenger name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 liquid-glass-input rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(['ALL', 'BUS', 'HOMESTAY', 'CANCELLED'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setStatusFilter(tab)}
                    className={`h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${
                      statusFilter === tab
                        ? 'liquid-glass-btn-primary text-white'
                        : 'liquid-glass-btn-ghost text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tab === 'ALL' ? 'All' : tab === 'BUS' ? 'Buses' : tab === 'HOMESTAY' ? 'Stays' : 'Cancelled'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bookings List */}
            {filteredBookings.length > 0 ? (
              <div className="flex flex-col gap-3">
                {filteredBookings.map((b, idx) => {
                  const isHomestay = b.bookingType === 'HOMESTAY';
                  const isCancellingThis = bookingIdToCancel === b.bookingId;

                  return (
                    <motion.div
                      key={b.bookingId}
                      {...appleStaggerItem(idx, 0.05)}
                      whileHover={{ y: -1.5 }}
                      transition={APPLE_SPRING_SNAPPY}
                      className="p-4 sm:p-5 rounded-2xl liquid-glass-card flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-900 dark:text-white text-sm">
                            {b.pnr}
                          </span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">&middot;</span>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            {isHomestay ? 'Home Stay' : 'Bus Ticket'}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-medium ${
                            b.bookingStatus === 'CONFIRMED'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {b.bookingStatus === 'CONFIRMED' ? 'Confirmed' : 'Cancelled'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 py-2.5 border-t border-slate-200/60 dark:border-white/[0.06]">
                        <div className="truncate flex-1 pr-3">
                          {isHomestay ? (
                            <>
                              <h4 className="font-semibold text-slate-900 dark:text-white truncate text-sm sm:text-[15px]">
                                {b.stayName}
                              </h4>
                              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5 font-mono">
                                {b.checkInDate} &rarr; {b.checkOutDate} &middot; {b.nights}{' '}
                                {b.nights === 1 ? 'night' : 'nights'}
                              </span>
                            </>
                          ) : (
                            <>
                              <h4 className="font-semibold text-slate-900 dark:text-white truncate text-sm sm:text-[15px]">
                                {b.from} &rarr; {b.to}
                              </h4>
                              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                                Seats: <span className="font-mono text-slate-700 dark:text-slate-300">{b.seatIds?.join(', ')}</span>
                              </span>
                            </>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm sm:text-base font-semibold font-mono text-slate-900 dark:text-white">
                            ₹{b.totalAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <AnimatePresence mode="wait" initial={false}>
                        {isCancellingThis ? (
                          <motion.div
                            key="cancel-confirm"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.22, ease: APPLE_EASE }}
                            className="px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="font-medium text-rose-700 dark:text-rose-300">
                              Cancel this booking?
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setBookingIdToCancel(null)}
                                disabled={isCancelling}
                                className="h-8 px-3 rounded-lg liquid-glass-btn-secondary text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                              >
                                Keep
                              </button>
                              <button
                                type="button"
                                onClick={() => handleConfirmCancel(b)}
                                disabled={isCancelling}
                                className="h-8 px-3 rounded-lg liquid-glass-btn-danger text-xs font-medium cursor-pointer disabled:opacity-50"
                              >
                                {isCancelling ? 'Cancelling...' : 'Confirm'}
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="booking-actions"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 dark:border-white/[0.06]"
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedBookingForPass(b)}
                              className="h-8 px-3 rounded-xl liquid-glass-btn-ghost text-xs sm:text-sm font-medium text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>{isHomestay ? 'View Voucher' : 'Boarding Pass'}</span>
                            </button>

                            {b.bookingStatus === 'CONFIRMED' && (
                              <button
                                type="button"
                                onClick={() => setBookingIdToCancel(b.bookingId)}
                                className="h-8 px-3 rounded-xl liquid-glass-btn-danger text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center rounded-2xl liquid-glass-card flex flex-col items-center gap-2.5">
                <Ticket className="w-8 h-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No bookings found
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Book a bus seat or reserve a home stay to see it listed here.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
