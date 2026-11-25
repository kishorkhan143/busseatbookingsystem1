import type { Transition } from 'motion/react';

/**
 * Shared Apple-inspired motion curves and spring physics.
 * Compositor-friendly (transform & opacity) with realistic physical settling.
 */
export const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const IOS_SHEET_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

export const APPLE_SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
  mass: 0.85,
};

export const APPLE_SPRING_FLUID: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 30,
  mass: 0.95,
};

export const APPLE_VIEW_TRANSITION: Transition = {
  duration: 0.34,
  ease: APPLE_EASE,
};

export const appleStaggerItem = (index: number, baseDelay = 0.04) => ({
  initial: { opacity: 0, y: 10, scale: 0.992 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.38,
      delay: Math.min(index, 7) * 0.045 + baseDelay,
      ease: APPLE_EASE,
    },
  },
});
