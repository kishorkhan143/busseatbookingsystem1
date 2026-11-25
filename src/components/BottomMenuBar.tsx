import React, { useState, useEffect, useRef } from 'react';
import { Home, Armchair, Building2, Ticket, User } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, useVelocity } from 'motion/react';
import { NavTab } from './TopMenuBar';
import { useLiquidGlass } from '../context/LiquidGlassContext';
import { APPLE_EASE, APPLE_SPRING_SNAPPY } from '../utils/motion';

interface BottomMenuBarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  bookingsCount: number;
}

interface NavItemConfig {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'ticket-booking', label: 'Buses', icon: Armchair },
  { id: 'homestays', label: 'Stays', icon: Building2 },
  { id: 'my-bookings', label: 'Bookings', icon: Ticket },
  { id: 'profile', label: 'Profile', icon: User },
];

export const BottomMenuBar: React.FC<BottomMenuBarProps> = ({
  activeTab,
  setActiveTab,
  bookingsCount,
}) => {
  const { webglActive, registerPanel } = useLiquidGlass();
  const navRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState<number>(0);

  // Draggable active selection pill state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const pointerActiveRef = useRef<boolean>(false);
  const pointerIdRef = useRef<number | null>(null);
  const startClientXRef = useRef<number>(0);
  const grabOffsetRef = useRef<number>(0);
  const didDragRef = useRef<boolean>(false);
  const startIndexRef = useRef<number>(0);

  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((item) => item.id === activeTab)
  );
  const slotWidth = trackWidth > 0 ? trackWidth / NAV_ITEMS.length : 0;

  // Fluid Apple-style spring physics with realistic physical inertia & velocity stretch
  const rawX = useMotionValue(0);
  const smoothX = useSpring(rawX, {
    stiffness: 340,
    damping: 30,
    mass: 0.9,
  });
  const velocityX = useVelocity(smoothX);
  const liquidScaleX = useTransform(velocityX, [-1200, 0, 1200], [1.08, 1, 1.08]);
  const liquidScaleY = useTransform(velocityX, [-1200, 0, 1200], [0.95, 1, 0.95]);
  const smoothScaleX = useSpring(liquidScaleX, { stiffness: 360, damping: 28 });
  const smoothScaleY = useSpring(liquidScaleY, { stiffness: 360, damping: 28 });

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const updateWidth = () => {
      const nextWidth = el.getBoundingClientRect().width;
      setTrackWidth(nextWidth);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Keep pill smoothly synced with activeTab whenever not actively dragging
  useEffect(() => {
    if (!isDragging && slotWidth > 0) {
      rawX.set(activeIndex * slotWidth);
    }
  }, [activeIndex, slotWidth, isDragging, rawX]);

  // Register floating capsule panel with WebGL optical glass overlay
  useEffect(() => {
    return registerPanel('capsule', () => {
      const el = navRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        w: rect.width,
        h: rect.height,
        cornerRadius: 40,
        shadowOpacity: 0,
      };
    });
  }, [registerPanel]);

  // Register live spring-driven draggable selection pill lens with WebGL overlay
  useEffect(() => {
    return registerPanel('pill', () => {
      const track = trackRef.current;
      if (!track) return null;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;

      const currentSlotWidth = rect.width / NAV_ITEMS.length;
      const xOffset = smoothX.get();
      const sx = smoothScaleX.get() || 1;
      const sy = smoothScaleY.get() || 1;
      const dragScale = isDraggingRef.current ? 1.04 : 1.0;

      return {
        x: rect.left + xOffset + currentSlotWidth / 2,
        y: rect.top + rect.height / 2,
        w: currentSlotWidth * sx * dragScale,
        h: rect.height * sy * dragScale,
        cornerRadius: 40,
        zRadius: 28,
        refraction: 0.72,
        shadowOpacity: 0,
      };
    });
  }, [registerPanel, smoothX, smoothScaleX, smoothScaleY]);

  const clampX = (x: number, width: number, itemWidth: number) => {
    return Math.max(0, Math.min(x, Math.max(0, width - itemWidth)));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const currentSlotWidth = rect.width / NAV_ITEMS.length;
    if (currentSlotWidth <= 0) return;

    const relX = e.clientX - rect.left;
    const pressedIndex = Math.max(
      0,
      Math.min(NAV_ITEMS.length - 1, Math.floor(relX / currentSlotWidth))
    );

    const activePillLeft = activeIndex * currentSlotWidth;

    pointerActiveRef.current = true;
    pointerIdRef.current = e.pointerId;
    startClientXRef.current = e.clientX;
    startIndexRef.current = pressedIndex;
    didDragRef.current = false;

    grabOffsetRef.current =
      pressedIndex === activeIndex ? relX - activePillLeft : currentSlotWidth / 2;

    try {
      track.setPointerCapture(e.pointerId);
    } catch {
      // Ignore capture errors in synthetic events
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerActiveRef.current) return;
    const track = trackRef.current;
    if (!track) return;

    const deltaX = Math.abs(e.clientX - startClientXRef.current);
    if (!didDragRef.current && deltaX < 6) {
      return;
    }

    const rect = track.getBoundingClientRect();
    const currentSlotWidth = rect.width / NAV_ITEMS.length;
    if (currentSlotWidth <= 0) return;

    if (!didDragRef.current) {
      didDragRef.current = true;
      isDraggingRef.current = true;
      setIsDragging(true);
    }

    const relX = e.clientX - rect.left;
    const nextX = clampX(relX - grabOffsetRef.current, rect.width, currentSlotWidth);
    const nextIndex = Math.max(
      0,
      Math.min(NAV_ITEMS.length - 1, Math.round(nextX / currentSlotWidth))
    );

    rawX.set(nextX);
    setHoveredIndex(nextIndex);
  };

  const finishPointerGesture = () => {
    if (!pointerActiveRef.current) return;
    const track = trackRef.current;

    if (track && pointerIdRef.current !== null) {
      try {
        if (track.hasPointerCapture(pointerIdRef.current)) {
          track.releasePointerCapture(pointerIdRef.current);
        }
      } catch {
        // Ignore release errors
      }
    }

    pointerActiveRef.current = false;
    pointerIdRef.current = null;

    if (didDragRef.current) {
      const targetIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;
      const targetTab = NAV_ITEMS[targetIndex]?.id;
      if (slotWidth > 0) {
        rawX.set(targetIndex * slotWidth);
      }
      if (targetTab && targetTab !== activeTab) {
        setActiveTab(targetTab);
      }
      isDraggingRef.current = false;
      setIsDragging(false);
      setHoveredIndex(null);
      window.setTimeout(() => {
        didDragRef.current = false;
      }, 60);
    } else {
      const targetIndex = startIndexRef.current;
      const targetTab = NAV_ITEMS[targetIndex]?.id;
      if (slotWidth > 0) {
        rawX.set(targetIndex * slotWidth);
      }
      if (targetTab && targetTab !== activeTab) {
        setActiveTab(targetTab);
      }
      isDraggingRef.current = false;
      setIsDragging(false);
      setHoveredIndex(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (index + 1) % NAV_ITEMS.length;
      setActiveTab(NAV_ITEMS[next].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (index - 1 + NAV_ITEMS.length) % NAV_ITEMS.length;
      setActiveTab(NAV_ITEMS[prev].id);
    }
  };

  const highlightedIndex = isDragging && hoveredIndex !== null ? hoveredIndex : activeIndex;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.48, delay: 0.08, ease: APPLE_EASE }}
      className="fixed inset-x-0 bottom-0 z-30 pointer-events-none flex justify-center px-3 sm:px-6"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
    >
      <nav
        ref={navRef}
        aria-label="Primary Navigation"
        className={`pointer-events-auto rounded-full p-1.5 w-full max-w-[440px] sm:max-w-[500px] select-none transition-colors duration-300 ${
          webglActive
            ? 'bg-transparent border border-slate-900/[0.06] dark:border-white/[0.1] shadow-none'
            : 'capsule-glass'
        }`}
      >
        {/* Fixed items track with Apple liquid-spring draggable selection pill */}
        <div
          ref={trackRef}
          role="tablist"
          aria-label="Navigation destinations — click or drag selection pill"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointerGesture}
          onPointerCancel={finishPointerGesture}
          className={`relative grid grid-cols-5 items-center w-full rounded-full touch-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-pointer'
          }`}
        >
          {/* Liquid-Spring Selection Pill (drives Motion spring physics; visible only as CSS fallback when WebGL is off) */}
          {slotWidth > 0 ? (
            <motion.div
              aria-hidden="true"
              className={`absolute top-0 bottom-0 left-0 rounded-full pointer-events-none transition-[background-color,border-color,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                webglActive
                  ? 'opacity-0'
                  : isDragging
                  ? 'bg-white/85 dark:bg-white/[0.17] border border-slate-900/[0.09] dark:border-white/[0.2]'
                  : 'bg-slate-900/[0.06] dark:bg-white/[0.12] border border-slate-900/[0.06] dark:border-white/[0.1]'
              }`}
              style={{
                width: slotWidth,
                x: smoothX,
                scaleX: smoothScaleX,
                scaleY: smoothScaleY,
              }}
              animate={{
                scale: isDragging ? 1.04 : 1,
              }}
              transition={APPLE_SPRING_SNAPPY}
            />
          ) : (
            !webglActive && (
              <div
                aria-hidden="true"
                className="absolute top-0 bottom-0 rounded-full pointer-events-none bg-slate-900/[0.07] dark:bg-white/[0.12] border border-slate-900/[0.06] dark:border-white/[0.1] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  width: `${100 / NAV_ITEMS.length}%`,
                  left: `${(activeIndex * 100) / NAV_ITEMS.length}%`,
                }}
              />
            )
          )}

          {/* Stationary Navigation Destinations */}
          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isSelected = highlightedIndex === index;
            const badge =
              item.id === 'my-bookings' && bookingsCount > 0 ? bookingsCount : undefined;

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={activeTab === item.id}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onClick={() => {
                  if (!didDragRef.current && activeTab !== item.id) {
                    setActiveTab(item.id);
                  }
                }}
                className={`relative z-10 w-full min-h-[46px] sm:min-h-[50px] px-1.5 sm:px-3 py-1.5 rounded-full flex flex-col items-center justify-center gap-0.5 select-none transition-colors duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 ${
                  isDragging
                    ? 'cursor-grabbing'
                    : isSelected
                    ? 'cursor-grab'
                    : 'cursor-pointer'
                } ${
                  isSelected
                    ? 'text-cyan-700 dark:text-cyan-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title={`${item.label} — click or drag selection pill`}
              >
                <motion.div
                  animate={{
                    scale: isSelected ? 1.07 : 1,
                    y: isSelected ? -1 : 0,
                  }}
                  transition={APPLE_SPRING_SNAPPY}
                  className="relative flex items-center justify-center"
                >
                  <Icon
                    className={`w-[18px] h-[18px] sm:w-[19px] sm:h-[19px] transition-colors duration-250 ${
                      isSelected
                        ? 'stroke-[2.1] text-cyan-700 dark:text-cyan-400'
                        : 'stroke-[1.75]'
                    }`}
                  />
                  {badge !== undefined && (
                    <motion.span
                      key={badge}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={APPLE_SPRING_SNAPPY}
                      className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-4 rounded-full bg-cyan-700 dark:bg-cyan-400 text-white dark:text-slate-950 text-[10px] font-semibold font-mono tabular-nums flex items-center justify-center leading-none"
                    >
                      {badge}
                    </motion.span>
                  )}
                </motion.div>

                <motion.span
                  animate={{ opacity: isSelected ? 1 : 0.85 }}
                  transition={{ duration: 0.2 }}
                  className={`text-[11px] leading-tight tracking-[-0.01em] truncate max-w-full ${
                    isSelected ? 'font-semibold' : 'font-medium'
                  }`}
                >
                  {item.label}
                </motion.span>
              </button>
            );
          })}
        </div>
      </nav>
    </motion.div>
  );
};
