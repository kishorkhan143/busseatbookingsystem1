import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  fetchSeats,
  createBooking,
  getAllBookings,
  cancelBooking,
  getUserProfile,
  saveUserProfile,
  resetSimulatedData,
  BookingData,
  UserProfile,
} from './services/api';
import { SeatItem, toggleSeatSelection } from './utils/bookingRules';
import { APPLE_EASE } from './utils/motion';
import { ThemeProvider } from './context/ThemeContext';
import { LiquidGlassProvider, useLiquidGlass } from './context/LiquidGlassContext';
import { LiquidGlassOverlay } from './components/LiquidGlassOverlay';
import { TopMenuBar, NavTab } from './components/TopMenuBar';
import { BottomMenuBar } from './components/BottomMenuBar';
import { HomeView } from './components/HomeView';
import { TicketBookingView } from './components/TicketBookingView';
import { HomeStaysView } from './components/HomeStaysView';
import { MyBookingsView } from './components/MyBookingsView';
import { ProfileView } from './components/ProfileView';
import { GlobalSearchModal } from './components/GlobalSearchModal';

function MainApp() {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const { markSceneDirty } = useLiquidGlass();

  // Active Route & Bus
  const [selectedFromCity, setSelectedFromCity] = useState<string>('Bangalore');
  const [selectedToCity, setSelectedToCity] = useState<string>('Chennai');
  const [currentBusId, setCurrentBusId] = useState<string>('blr-chn-1');

  // Seats State
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);

  // Bookings State
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(getUserProfile());

  // Load seats from backend or local engine
  const loadSeats = useCallback(async (busId?: string) => {
    const targetBus = busId || currentBusId;
    setIsLoadingSeats(true);
    try {
      const resp = await fetchSeats(targetBus);
      setSeats(resp.data);
      if (busId && busId !== currentBusId) {
        setCurrentBusId(busId);
      }
    } catch (err) {
      console.error('Failed to load seats:', err);
    } finally {
      setIsLoadingSeats(false);
    }
  }, [currentBusId]);

  // Load all bookings
  const loadBookings = useCallback(async () => {
    setIsLoadingBookings(true);
    try {
      const data = await getAllBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setIsLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    loadSeats();
    loadBookings();
  }, [loadSeats, loadBookings]);

  useEffect(() => {
    markSceneDirty();
  }, [seats, selectedSeatIds, bookings, userProfile, markSceneDirty]);

  // Handle seat selection toggle
  const handleToggleSeat = (seatId: string, isAvailable: boolean) => {
    if (!isAvailable) return;
    setSelectedSeatIds((prev) => toggleSeatSelection(prev, seatId, isAvailable));
  };

  const handleClearSelection = () => {
    setSelectedSeatIds([]);
  };

  // Handle bus booking creation
  const handleBookSeats = async (payload: {
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
  }): Promise<BookingData> => {
    const result = await createBooking({
      ...payload,
      seatIds: selectedSeatIds,
    });

    setSelectedSeatIds([]);
    await loadSeats(payload.busId);
    await loadBookings();
    return result.data;
  };

  // Handle cancellation (Bus ticket or Homestay)
  const handleCancelBooking = async (bookingId: number) => {
    await cancelBooking(bookingId);
    await loadSeats(currentBusId);
    await loadBookings();
  };

  // Route selected from Home View
  const handleSelectRouteFromHome = (from: string, to: string, routeId?: string) => {
    setSelectedFromCity(from);
    setSelectedToCity(to);
    let targetBus = 'blr-chn-1';
    if (routeId) {
      targetBus = `${routeId}-1`;
    }
    setCurrentBusId(targetBus);
    loadSeats(targetBus);
    setSelectedSeatIds([]);
    setActiveTab('ticket-booking');
  };

  // Handle Profile Update
  const handleUpdateProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    saveUserProfile(updated);
  };

  // Handle full reset of simulated data
  const handleResetAllData = () => {
    resetSimulatedData();
    setUserProfile(getUserProfile());
    loadSeats('blr-chn-1');
    loadBookings();
    setActiveTab('home');
  };

  const availableSeatsCount = seats.filter((s) => s.status === 'AVAILABLE').length;

  return (
    <div className="relative h-full max-h-full w-full bg-slate-50 text-slate-900 dark:bg-[#090d16] dark:text-slate-100 flex flex-col font-sans overflow-hidden selection:bg-cyan-600 selection:text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
      {/* Subtle Minimal Ambient Wash */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-48 -left-40 w-[480px] sm:w-[640px] h-[480px] sm:h-[640px] rounded-full bg-cyan-400/[0.08] dark:bg-cyan-500/[0.07] blur-[130px] animate-liquid-1" />
        <div className="absolute top-1/3 -right-48 w-[460px] sm:w-[600px] h-[460px] sm:h-[600px] rounded-full bg-slate-400/[0.08] dark:bg-sky-500/[0.05] blur-[140px] animate-liquid-2" />
      </div>

      {/* Main View Area — Full-height scroll container passing directly behind WebGL Header & Capsule */}
      <main
        ref={mainRef}
        onScroll={markSceneDirty}
        className="relative z-10 flex-1 min-h-0 h-full overflow-y-auto overflow-x-hidden overscroll-contain flex flex-col max-w-[1280px] mx-auto px-3 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-28 sm:pb-32 w-full"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.995 }}
            transition={{ duration: 0.28, ease: APPLE_EASE }}
            className="w-full"
          >
            {activeTab === 'home' && (
              <HomeView
                onNavigate={setActiveTab}
                onOpenSearch={() => setIsSearchOpen(true)}
                onSelectRoute={handleSelectRouteFromHome}
              />
            )}

            {activeTab === 'ticket-booking' && (
              <TicketBookingView
                seats={seats}
                selectedSeatIds={selectedSeatIds}
                onToggleSeat={handleToggleSeat}
                onClearSelection={handleClearSelection}
                onRefreshSeats={loadSeats}
                isLoadingSeats={isLoadingSeats}
                onBookSeats={handleBookSeats}
                userProfile={userProfile}
                initialFromCity={selectedFromCity}
                initialToCity={selectedToCity}
                initialBusId={currentBusId}
                onViewBookings={() => {
                  loadBookings();
                  setActiveTab('my-bookings');
                }}
              />
            )}

            {activeTab === 'homestays' && (
              <HomeStaysView
                userProfile={userProfile}
                onViewBookings={() => {
                  loadBookings();
                  setActiveTab('my-bookings');
                }}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'my-bookings' && (
              <MyBookingsView
                bookings={bookings}
                onCancelBooking={handleCancelBooking}
                onNavigate={setActiveTab}
                isLoading={isLoadingBookings}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileView
                profile={userProfile}
                onUpdateProfile={handleUpdateProfile}
                onNavigate={setActiveTab}
                onResetAllData={handleResetAllData}
                totalBookingsCount={bookings.filter((b) => b.bookingStatus === 'CONFIRMED').length}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Unified WebGL 1 Optical Regular Glass Overlay (Header, Floating Capsule, Draggable Pill) */}
      <LiquidGlassOverlay mainRef={mainRef} activeTab={activeTab} />

      {/* Top Menu Bar - Spacious & Rounded Floating Optical Glass */}
      <TopMenuBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        availableSeatsCount={availableSeatsCount}
        totalBookingsCount={bookings.filter((b) => b.bookingStatus === 'CONFIRMED').length}
        userName={userProfile.name}
      />

      {/* Floating Capsule Bottom Navigation with Liquid Draggable Selector */}
      <BottomMenuBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        bookingsCount={bookings.filter((b) => b.bookingStatus === 'CONFIRMED').length}
      />

      {/* Global Search Drawer */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        bookings={bookings}
        onNavigate={setActiveTab}
        onSelectRoute={handleSelectRouteFromHome}
        onSelectBooking={() => {
          setActiveTab('my-bookings');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <LiquidGlassProvider>
          <MainApp />
        </LiquidGlassProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
