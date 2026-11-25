import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Star,
  Users,
  Calendar,
  CheckCircle2,
  Search,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Printer,
  ChevronRight,
  Compass,
  Phone,
  User as UserIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  HomeStayItem,
  SAMPLE_HOMESTAYS,
  createHomestayBooking,
  BookingData,
  UserProfile,
} from '../services/api';
import { NavTab } from './TopMenuBar';
import { APPLE_EASE, APPLE_SPRING_SNAPPY, appleStaggerItem } from '../utils/motion';

interface HomeStaysViewProps {
  userProfile: UserProfile;
  onViewBookings: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const HomeStaysView: React.FC<HomeStaysViewProps> = ({
  userProfile,
  onViewBookings,
  onNavigate,
}) => {
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'RECOMMENDED' | 'PRICE_ASC' | 'PRICE_DESC' | 'RATING'>('RECOMMENDED');

  const [selectedStay, setSelectedStay] = useState<HomeStayItem | null>(null);
  const [checkInDate, setCheckInDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [checkOutDate, setCheckOutDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [guestCount, setGuestCount] = useState<number>(2);
  const [guestName, setGuestName] = useState<string>(userProfile.name);
  const [guestMobile, setGuestMobile] = useState<string>(userProfile.mobile);
  const [guestEmail, setGuestEmail] = useState<string>(userProfile.email || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingData | null>(null);

  const availableCities = useMemo(() => {
    const set = new Set(SAMPLE_HOMESTAYS.map((s) => s.city));
    return Array.from(set);
  }, []);

  const calculateNights = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const currentNights = useMemo(
    () => calculateNights(checkInDate, checkOutDate),
    [checkInDate, checkOutDate]
  );

  const filteredStays = useMemo(() => {
    let result = SAMPLE_HOMESTAYS.filter((stay) => {
      const matchesCity = selectedCity === 'ALL' || stay.city.toLowerCase() === selectedCity.toLowerCase();
      const matchesType = selectedType === 'ALL' || stay.stayType === selectedType;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        stay.name.toLowerCase().includes(q) ||
        stay.location.toLowerCase().includes(q) ||
        stay.city.toLowerCase().includes(q);

      return matchesCity && matchesType && matchesSearch;
    });

    if (sortBy === 'PRICE_ASC') {
      result = [...result].sort((a, b) => a.pricePerNight - b.pricePerNight);
    } else if (sortBy === 'PRICE_DESC') {
      result = [...result].sort((a, b) => b.pricePerNight - a.pricePerNight);
    } else if (sortBy === 'RATING') {
      result = [...result].sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [selectedCity, selectedType, searchQuery, sortBy]);

  const handleStartBooking = (stay: HomeStayItem) => {
    setSelectedStay(stay);
    setGuestName(userProfile.name);
    setGuestMobile(userProfile.mobile);
    setGuestEmail(userProfile.email || '');
    setGuestCount(Math.min(2, stay.maxGuests));
    setBookingError(null);
    setConfirmedBooking(null);
  };

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStay) return;
    setBookingError(null);
    setIsSubmitting(true);

    try {
      const resp = await createHomestayBooking({
        stayId: selectedStay.id,
        stayName: selectedStay.name,
        stayLocation: selectedStay.location,
        stayImageUrl: selectedStay.imageUrl,
        hostName: selectedStay.hostName,
        pricePerNight: selectedStay.pricePerNight,
        name: guestName,
        mobile: guestMobile,
        email: guestEmail,
        checkInDate,
        checkOutDate,
        nights: currentNights,
        guestsCount: guestCount,
      });

      setConfirmedBooking(resp.data);
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : 'Reservation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewStateKey = selectedStay
    ? confirmedBooking
      ? 'stay-confirmed'
      : `stay-form-${selectedStay.id}`
    : 'stays-catalog';

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-5">
      <AnimatePresence mode="wait" initial={false}>
        {selectedStay ? (
          <motion.div
            key={viewStateKey}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.994 }}
            transition={{ duration: 0.32, ease: APPLE_EASE }}
            className="w-full flex flex-col gap-4"
          >
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl liquid-glass-card">
              <button
                type="button"
                onClick={() => {
                  setSelectedStay(null);
                  setConfirmedBooking(null);
                }}
                className="h-8 px-3 rounded-xl liquid-glass-btn-ghost inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Stays</span>
              </button>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {confirmedBooking ? 'Reservation confirmed' : 'Complete reservation'}
              </span>
            </div>

            {confirmedBooking ? (
              <div className="p-5 sm:p-6 rounded-2xl liquid-glass-card flex flex-col gap-4 max-w-lg mx-auto w-full">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...APPLE_SPRING_SNAPPY, delay: 0.08 }}
                    className="w-10 h-10 rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </motion.div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-[-0.015em]">
                      Homestay Reserved
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      PNR <span className="font-mono font-medium text-cyan-700 dark:text-cyan-300">{confirmedBooking.pnr}</span>
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl liquid-glass text-sm flex flex-col gap-2.5">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Property</span>
                    <span className="font-medium text-slate-900 dark:text-white text-right">{selectedStay.name}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Dates</span>
                    <span className="font-mono text-xs text-slate-800 dark:text-slate-200 text-right">
                      {confirmedBooking.checkInDate} &rarr; {confirmedBooking.checkOutDate} ({confirmedBooking.nights}N)
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Guest</span>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 text-right">
                      {confirmedBooking.customer.name} &middot; {confirmedBooking.guestsCount} guests
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/60 dark:border-white/[0.06]">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total fare</span>
                    <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 text-base">
                      ₹{confirmedBooking.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-1">
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
                    onClick={() => {
                      setSelectedStay(null);
                      onViewBookings();
                    }}
                    className="flex-1 h-10 rounded-xl liquid-glass-btn-primary text-white text-sm font-medium flex items-center justify-center cursor-pointer"
                  >
                    My Bookings
                  </motion.button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleConfirmReservation}
                className="p-4 sm:p-6 rounded-2xl liquid-glass-card flex flex-col gap-4 max-w-xl mx-auto w-full"
              >
                <div className="flex items-center gap-3.5 p-3 rounded-xl liquid-glass">
                  <img
                    src={selectedStay.imageUrl}
                    alt={selectedStay.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200/70 dark:border-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
                      {selectedStay.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {selectedStay.location} &middot; {selectedStay.city}
                    </p>
                    <p className="text-sm font-semibold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                      ₹{selectedStay.pricePerNight.toLocaleString('en-IN')}{' '}
                      <span className="text-xs font-sans text-slate-500 dark:text-slate-400 font-normal">/ night</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Check-in</span>
                    </label>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      required
                      className="w-full h-10 px-3 liquid-glass-input rounded-xl text-slate-900 dark:text-white text-sm font-mono font-normal"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Check-out</span>
                    </label>
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      required
                      className="w-full h-10 px-3 liquid-glass-input rounded-xl text-slate-900 dark:text-white text-sm font-mono font-normal"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Guests</span>
                    </label>
                    <select
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className="w-full h-10 px-3 liquid-glass-input rounded-xl text-slate-900 dark:text-white text-sm font-normal cursor-pointer"
                    >
                      {Array.from({ length: selectedStay.maxGuests }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n} className="bg-white dark:bg-slate-900">
                          {n} {n === 1 ? 'Guest' : 'Guests'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Guest name</span>
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                      className="w-full h-10 px-3 liquid-glass-input rounded-xl text-slate-900 dark:text-white text-sm font-normal"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Mobile number</span>
                    </label>
                    <input
                      type="tel"
                      value={guestMobile}
                      onChange={(e) => setGuestMobile(e.target.value)}
                      required
                      maxLength={10}
                      className="w-full h-10 px-3 liquid-glass-input rounded-xl text-slate-900 dark:text-white text-sm font-mono font-normal"
                    />
                  </div>
                </div>

                <div className="px-4 py-3 rounded-xl liquid-glass flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal">
                    <span className="font-mono">₹{selectedStay.pricePerNight}</span> &times; {currentNights}{' '}
                    {currentNights === 1 ? 'night' : 'nights'} + GST
                  </span>
                  <span className="text-base font-semibold font-mono text-slate-900 dark:text-white">
                    ₹{Math.round(selectedStay.pricePerNight * currentNights * 1.12).toLocaleString('en-IN')}
                  </span>
                </div>

                {bookingError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-sm">
                    {bookingError}
                  </div>
                )}

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  transition={APPLE_SPRING_SNAPPY}
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl liquid-glass-btn-emerald font-medium text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Reservation</span>
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="stays-catalog"
            initial={{ opacity: 0, y: 10, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.994 }}
            transition={{ duration: 0.3, ease: APPLE_EASE }}
            className="flex flex-col gap-5"
          >
            {/* Header Strip */}
            <div className="p-4 sm:p-5 rounded-2xl liquid-glass-card flex items-center justify-between gap-4">
              <div>
                <h1 className="text-lg sm:text-xl font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">
                  Verified Home Stays
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Handpicked estates, villas, and cottages along key bus routes.
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={APPLE_SPRING_SNAPPY}
                onClick={() => onNavigate('ticket-booking')}
                type="button"
                className="h-9 px-3.5 rounded-xl liquid-glass-btn-secondary text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap"
              >
                <span>Bus Tickets</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-3.5 sm:p-4 rounded-2xl liquid-glass-card flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stays or city..."
                    className="w-full h-10 pl-10 pr-3 rounded-xl liquid-glass-input text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'RECOMMENDED' | 'PRICE_ASC' | 'PRICE_DESC' | 'RATING')}
                  className="h-10 px-3 rounded-xl liquid-glass-input text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer shrink-0"
                >
                  <option value="RECOMMENDED" className="bg-white dark:bg-slate-900">Recommended</option>
                  <option value="PRICE_ASC" className="bg-white dark:bg-slate-900">Price: Low to High</option>
                  <option value="PRICE_DESC" className="bg-white dark:bg-slate-900">Price: High to Low</option>
                  <option value="RATING" className="bg-white dark:bg-slate-900">Highest Rating</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedCity('ALL')}
                  className={`h-8 px-3 rounded-lg font-medium text-xs whitespace-nowrap cursor-pointer transition-all duration-200 ${
                    selectedCity === 'ALL'
                      ? 'liquid-glass-btn-primary text-white'
                      : 'liquid-glass-btn-secondary text-slate-600 dark:text-slate-300'
                  }`}
                >
                  All Cities
                </button>
                {availableCities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    className={`h-8 px-3 rounded-lg font-medium text-xs whitespace-nowrap cursor-pointer transition-all duration-200 ${
                      selectedCity === city
                        ? 'liquid-glass-btn-primary text-white'
                        : 'liquid-glass-btn-secondary text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Stays List */}
            <div className="flex flex-col gap-3">
              {filteredStays.length === 0 ? (
                <div className="p-10 text-center rounded-2xl liquid-glass-card flex flex-col items-center gap-3">
                  <Compass className="w-8 h-8 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    No properties match your filters
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCity('ALL');
                      setSelectedType('ALL');
                      setSearchQuery('');
                    }}
                    className="h-9 px-4 rounded-xl liquid-glass-btn-primary text-white text-sm font-medium cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredStays.map((stay, idx) => (
                  <motion.div
                    key={stay.id}
                    {...appleStaggerItem(idx, 0.05)}
                    whileHover={{ y: -1.5 }}
                    transition={APPLE_SPRING_SNAPPY}
                    className="rounded-2xl liquid-glass-card p-3.5 sm:p-4 flex flex-row items-center gap-3.5 sm:gap-5"
                  >
                    <div className="relative w-24 h-20 sm:w-36 sm:h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/70 dark:border-white/10">
                      <img
                        src={stay.imageUrl}
                        alt={stay.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105"
                        loading="lazy"
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-2.5">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm sm:text-base font-semibold tracking-[-0.01em] text-slate-900 dark:text-white truncate">
                            {stay.name}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="font-mono">{stay.rating.toFixed(1)}</span>
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {stay.location} &middot; {stay.city}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm sm:text-base font-semibold font-mono text-slate-900 dark:text-white">
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
                          onClick={() => handleStartBooking(stay)}
                          className="h-9 px-3.5 rounded-xl liquid-glass-btn-primary text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                        >
                          <span>Reserve</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
