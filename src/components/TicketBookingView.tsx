import React, { useState, useEffect, useMemo } from 'react';
import {
  Armchair,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Printer,
  Disc,
  User,
  ArrowLeft,
  ArrowLeftRight,
  Calendar,
  Star,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookingData,
  UserProfile,
  CITIES_AND_STOPS,
  searchAvailableBuses,
  getAvailableSeatsForBus,
} from '../services/api';
import { SeatItem, SEAT_PRICE, calculateTotalAmount } from '../utils/bookingRules';
import { APPLE_EASE, APPLE_SPRING_SNAPPY, appleStaggerItem } from '../utils/motion';
import { Seat } from './Seat';
import { SeatLegend } from './SeatLegend';

interface TicketBookingViewProps {
  seats: SeatItem[];
  selectedSeatIds: string[];
  onToggleSeat: (seatId: string, isAvailable: boolean) => void;
  onClearSelection: () => void;
  onRefreshSeats: (busId?: string) => void;
  isLoadingSeats: boolean;
  onBookSeats: (payload: {
    name: string;
    mobile: string;
    email?: string;
    busId: string;
    busName: string;
    busType: string;
    from: string;
    boardingPoint: string;
    to: string;
    droppingPoint: string;
    departureTime: string;
    arrivalTime: string;
    journeyDate: string;
  }) => Promise<BookingData>;
  userProfile: UserProfile;
  initialFromCity?: string;
  initialToCity?: string;
  initialBusId?: string;
  onViewBookings?: () => void;
}

export const TicketBookingView: React.FC<TicketBookingViewProps> = ({
  seats,
  selectedSeatIds,
  onToggleSeat,
  onClearSelection,
  onRefreshSeats,
  onBookSeats,
  userProfile,
  initialFromCity = 'Bangalore',
  initialToCity = 'Chennai',
  initialBusId = 'blr-chn-1',
}) => {
  const cityNames = Object.keys(CITIES_AND_STOPS);

  const [fromCity, setFromCity] = useState(initialFromCity);
  const [toCity, setToCity] = useState(initialToCity);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const [journeyDate, setJourneyDate] = useState(todayStr);
  const [busFilter, setBusFilter] = useState<'ALL' | 'SLEEPER' | 'EV'>('ALL');

  const availableBuses = useMemo(() => {
    return searchAvailableBuses(fromCity, toCity);
  }, [fromCity, toCity]);

  const [selectedBusId, setSelectedBusId] = useState<string>(() => {
    const match = availableBuses.find((b) => b.id === initialBusId);
    return match ? match.id : availableBuses[0]?.id || 'blr-chn-1';
  });

  const selectedBus = useMemo(() => {
    return availableBuses.find((b) => b.id === selectedBusId) || availableBuses[0];
  }, [availableBuses, selectedBusId]);

  useEffect(() => {
    if (initialFromCity) setFromCity(initialFromCity);
    if (initialToCity) setToCity(initialToCity);
    if (initialBusId) setSelectedBusId(initialBusId);
  }, [initialFromCity, initialToCity, initialBusId]);

  const [bookingStep, setBookingStep] = useState<'ROUTE_AND_BUSES' | 'SEAT_SELECTION'>('ROUTE_AND_BUSES');

  const handleSelectBusAndProceed = (busId: string) => {
    if (selectedBusId !== busId) {
      setSelectedBusId(busId);
      onClearSelection();
      onRefreshSeats(busId);
    }
    setBookingStep('SEAT_SELECTION');
  };

  const handleFromCityChange = (newCity: string) => {
    setFromCity(newCity);
    onClearSelection();
    setBookingStep('ROUTE_AND_BUSES');
  };

  const handleToCityChange = (newCity: string) => {
    setToCity(newCity);
    onClearSelection();
    setBookingStep('ROUTE_AND_BUSES');
  };

  const handleSwapCities = () => {
    const prevFrom = fromCity;
    const prevTo = toCity;
    setFromCity(prevTo);
    setToCity(prevFrom);
    onClearSelection();
    setBookingStep('ROUTE_AND_BUSES');
  };

  useEffect(() => {
    if (selectedBus) {
      onRefreshSeats(selectedBus.id);
    }
  }, [selectedBus?.id, onRefreshSeats]);

  const [passengerName, setPassengerName] = useState(userProfile.name || 'Kishor Khan');
  const [passengerMobile, setPassengerMobile] = useState(userProfile.mobile || '9876543210');
  const [passengerEmail, setPassengerEmail] = useState(userProfile.email || 'kishor@example.com');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingData | null>(null);

  const rows = ['A', 'B', 'C', 'D', 'E'];
  const totalAmount = calculateTotalAmount(selectedSeatIds.length, SEAT_PRICE);

  const handleConfirmBooking = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedSeatIds.length === 0 || !selectedBus) return;

    setBookingError(null);
    setIsSubmitting(true);

    try {
      const ticket = await onBookSeats({
        name: passengerName.trim() || 'Passenger',
        mobile: passengerMobile.trim() || '9876543210',
        email: passengerEmail.trim(),
        busId: selectedBus.id,
        busName: selectedBus.operator,
        busType: selectedBus.busType,
        from: fromCity,
        boardingPoint: fromCity,
        to: toCity,
        droppingPoint: toCity,
        departureTime: selectedBus.departureTime,
        arrivalTime: selectedBus.arrivalTime,
        journeyDate,
      });
      setConfirmedBooking(ticket);
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : 'Booking failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBuses = useMemo(() => {
    if (busFilter === 'SLEEPER') {
      return availableBuses.filter((b) => b.busType.toLowerCase().includes('sleeper'));
    }
    if (busFilter === 'EV') {
      return availableBuses.filter(
        (b) => b.busType.toLowerCase().includes('electric') || b.busType.toLowerCase().includes('ev')
      );
    }
    return availableBuses;
  }, [availableBuses, busFilter]);

  const activeStepKey = confirmedBooking ? 'CONFIRMED' : bookingStep;

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-5">
      <AnimatePresence mode="wait" initial={false}>
        {activeStepKey === 'CONFIRMED' && confirmedBooking ? (
          <motion.div
            key="confirmed-ticket"
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.34, ease: APPLE_EASE }}
            className="w-full py-2 max-w-md mx-auto"
          >
            <div className="liquid-glass-card rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
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
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-[-0.015em]">
                    Ticket Confirmed
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    PNR <span className="font-mono font-medium text-cyan-700 dark:text-cyan-300">{confirmedBooking.pnr}</span>
                  </p>
                </div>
              </div>

              <div className="liquid-glass rounded-xl p-4 flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between font-medium text-slate-900 dark:text-white pb-2 border-b border-slate-200/60 dark:border-white/[0.06]">
                  <span>{confirmedBooking.from} &rarr; {confirmedBooking.to}</span>
                  <span className="font-mono text-cyan-700 dark:text-cyan-400">{confirmedBooking.departureTime}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>{confirmedBooking.busName}</span>
                  <span className="font-mono">{confirmedBooking.journeyDate}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>{confirmedBooking.customer.name}</span>
                  <span className="font-mono">+91 {confirmedBooking.customer.mobile}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-white/[0.06] text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Seats ({confirmedBooking.seatIds.length})
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {confirmedBooking.seatIds.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-md bg-cyan-600/12 dark:bg-cyan-400/15 text-cyan-800 dark:text-cyan-200 font-mono font-medium text-xs"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Fare paid</span>
                  <span className="font-mono font-semibold text-base text-slate-900 dark:text-white">
                    ₹{confirmedBooking.totalAmount}
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
                    setConfirmedBooking(null);
                    setBookingStep('ROUTE_AND_BUSES');
                  }}
                  className="flex-1 h-10 rounded-xl liquid-glass-btn-primary text-white text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Armchair className="w-4 h-4" />
                  <span>Book More</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : activeStepKey === 'ROUTE_AND_BUSES' ? (
          <motion.div
            key="route-and-buses"
            initial={{ opacity: 0, y: 10, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.994 }}
            transition={{ duration: 0.3, ease: APPLE_EASE }}
            className="flex flex-col gap-5"
          >
            {/* Route Selector Card */}
            <div className="p-4 sm:p-5 rounded-2xl liquid-glass-card flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-base font-semibold tracking-[-0.015em] text-slate-900 dark:text-white">
                  Travel Route
                </h1>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono">
                  Flat ₹150 / seat
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-11 gap-2.5 items-end">
                <div className="sm:col-span-5">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
                    From
                  </label>
                  <select
                    value={fromCity}
                    onChange={(e) => handleFromCityChange(e.target.value)}
                    className="w-full h-10 px-3 liquid-glass-input rounded-xl text-slate-900 dark:text-white text-sm font-medium cursor-pointer"
                  >
                    {cityNames.map((city) => (
                      <option key={city} value={city} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1 flex items-center justify-center">
                  <motion.button
                    type="button"
                    whileHover={{ rotate: 180 }}
                    whileTap={{ scale: 0.92 }}
                    transition={APPLE_SPRING_SNAPPY}
                    onClick={handleSwapCities}
                    className="w-10 h-10 rounded-xl liquid-glass-btn-secondary text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
                    title="Swap cities"
                    aria-label="Swap origin and destination cities"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="sm:col-span-5">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
                    To
                  </label>
                  <select
                    value={toCity}
                    onChange={(e) => handleToCityChange(e.target.value)}
                    className="w-full h-10 px-3 liquid-glass-input rounded-xl text-slate-900 dark:text-white text-sm font-medium cursor-pointer"
                  >
                    {cityNames
                      .filter((c) => c !== fromCity)
                      .map((city) => (
                        <option key={city} value={city} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {city}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Journey date
                  </span>
                  <input
                    type="date"
                    value={journeyDate}
                    min={todayStr}
                    onChange={(e) => setJourneyDate(e.target.value)}
                    className="h-9 px-2.5 liquid-glass-input rounded-lg text-xs font-mono font-medium text-slate-900 dark:text-white cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setJourneyDate(todayStr)}
                    className={`h-8 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      journeyDate === todayStr
                        ? 'liquid-glass-btn-primary text-white'
                        : 'liquid-glass-btn-secondary text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setJourneyDate(tomorrowStr)}
                    className={`h-8 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      journeyDate === tomorrowStr
                        ? 'liquid-glass-btn-primary text-white'
                        : 'liquid-glass-btn-secondary text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
            </div>

            {/* Buses List */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 px-0.5">
                <h2 className="text-base font-semibold tracking-[-0.015em] text-slate-900 dark:text-white">
                  Available Buses{' '}
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400 font-mono">
                    ({filteredBuses.length})
                  </span>
                </h2>

                <div className="flex items-center gap-1.5">
                  {(['ALL', 'SLEEPER', 'EV'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setBusFilter(filter)}
                      className={`h-8 px-3 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap ${
                        busFilter === filter
                          ? 'liquid-glass-btn-primary text-white'
                          : 'liquid-glass-btn-ghost text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {filter === 'ALL' ? 'All' : filter === 'SLEEPER' ? 'Sleeper' : 'EV'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {filteredBuses.map((bus, idx) => {
                  const busAvailableSeats = getAvailableSeatsForBus(bus.id);

                  return (
                    <motion.div
                      key={bus.id}
                      {...appleStaggerItem(idx, 0.05)}
                      whileHover={{ y: -1.5 }}
                      transition={APPLE_SPRING_SNAPPY}
                      onClick={() => handleSelectBusAndProceed(bus.id)}
                      className="p-4 sm:px-5 sm:py-4 rounded-2xl liquid-glass-card flex flex-row items-center justify-between gap-4 cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-[15px] tracking-[-0.01em] group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors truncate">
                            {bus.operator}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="font-mono">{bus.rating}</span>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                            {bus.departureTime} – {bus.arrivalTime}
                          </span>
                          <span aria-hidden="true">&middot;</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            {busAvailableSeats} seats left
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="text-sm sm:text-base font-semibold font-mono text-slate-900 dark:text-white block leading-tight">
                            ₹{bus.pricePerSeat}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            per seat
                          </span>
                        </div>

                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          transition={APPLE_SPRING_SNAPPY}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectBusAndProceed(bus.id);
                          }}
                          className="h-9 px-3.5 rounded-xl liquid-glass-btn-primary text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <Armchair className="w-3.5 h-3.5" />
                          <span>Select Seats</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          selectedBus && (
            <motion.div
              key="seat-selection"
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.994 }}
              transition={{ duration: 0.32, ease: APPLE_EASE }}
              className="flex flex-col gap-4"
            >
              {/* Back navigation & bus summary */}
              <div className="px-4 py-3 rounded-2xl liquid-glass-card flex items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setBookingStep('ROUTE_AND_BUSES')}
                  className="h-8 px-3 rounded-xl liquid-glass-btn-ghost inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Buses</span>
                </button>

                <div className="flex items-center gap-2 truncate text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-white truncate">
                    {selectedBus.operator}
                  </span>
                  <span aria-hidden="true">&middot;</span>
                  <span className="font-mono shrink-0">{selectedBus.departureTime}</span>
                  <span aria-hidden="true">&middot;</span>
                  <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400 shrink-0">
                    ₹{selectedBus.pricePerSeat}
                  </span>
                </div>
              </div>

              {/* Selected Seats & Total Strip */}
              <div className="p-4 rounded-2xl liquid-glass-card flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                    Selected seats
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap min-h-[24px]">
                    <AnimatePresence mode="popLayout">
                      {selectedSeatIds.length > 0 ? (
                        selectedSeatIds.map((id) => (
                          <motion.span
                            key={id}
                            layout
                            initial={{ opacity: 0, scale: 0.75 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.75 }}
                            transition={APPLE_SPRING_SNAPPY}
                            className="px-2 py-0.5 rounded-md bg-cyan-600/12 dark:bg-cyan-400/15 text-cyan-800 dark:text-cyan-200 font-mono font-medium text-xs"
                          >
                            {id}
                          </motion.span>
                        ))
                      ) : (
                        <motion.span
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-slate-400 dark:text-slate-500 text-xs"
                        >
                          Tap available seats below
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-auto">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">
                      Total
                    </span>
                    <span className="text-lg font-semibold font-mono text-slate-900 dark:text-white leading-tight">
                      ₹{totalAmount}
                    </span>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    transition={APPLE_SPRING_SNAPPY}
                    onClick={() => handleConfirmBooking()}
                    disabled={isSubmitting || selectedSeatIds.length === 0}
                    className="h-10 px-4 rounded-xl liquid-glass-btn-primary disabled:opacity-40 disabled:pointer-events-none text-white font-medium text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Booking...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Book Seats</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Passenger Details */}
              <div className="p-4 rounded-2xl liquid-glass-card flex flex-col gap-3">
                <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Passenger Details</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    placeholder="Full name"
                    className="h-10 px-3 liquid-glass-input rounded-xl text-slate-900 dark:text-white text-sm font-normal"
                  />
                  <input
                    type="tel"
                    maxLength={10}
                    value={passengerMobile}
                    onChange={(e) => setPassengerMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="Mobile number"
                    className="h-10 px-3 liquid-glass-input rounded-xl text-slate-900 dark:text-white text-sm font-mono font-normal"
                  />
                  <input
                    type="email"
                    value={passengerEmail}
                    onChange={(e) => setPassengerEmail(e.target.value)}
                    placeholder="Email address"
                    className="h-10 px-3 liquid-glass-input rounded-xl text-slate-900 dark:text-white text-sm font-normal"
                  />
                </div>
              </div>

              {bookingError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, ease: APPLE_EASE }}
                  className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </motion.div>
              )}

              {/* Seat Legend */}
              <SeatLegend />

              {/* 30-Seat Cabin Layout */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.36, delay: 0.08, ease: APPLE_EASE }}
                className="liquid-glass-card rounded-2xl p-4 sm:p-5 max-w-md mx-auto w-full flex flex-col gap-3.5"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-dashed border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>Front windshield</span>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                    <Disc className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Driver cabin</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {rows.map((rowName) => {
                    const rowSeats = seats.filter((s) => s.rowName === rowName);
                    const leftBatch = rowSeats.slice(0, 3);
                    const rightBatch = rowSeats.slice(3, 6);

                    return (
                      <div key={rowName} className="flex items-center justify-between gap-1.5">
                        <div className="w-4 text-center text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">
                          {rowName}
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 flex-1">
                          {leftBatch.map((seat) => (
                            <Seat
                              key={seat.seatId}
                              seat={seat}
                              isSelected={selectedSeatIds.includes(seat.seatId)}
                              onToggle={onToggleSeat}
                            />
                          ))}
                        </div>

                        <div className="w-3 flex items-center justify-center">
                          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 flex-1">
                          {rightBatch.map((seat) => (
                            <Seat
                              key={seat.seatId}
                              seat={seat}
                              isSelected={selectedSeatIds.includes(seat.seatId)}
                              onToggle={onToggleSeat}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center text-xs text-slate-400 dark:text-slate-500 font-medium pt-2 border-t border-slate-200/70 dark:border-white/[0.06]">
                  Rear exit
                </div>
              </motion.div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};
