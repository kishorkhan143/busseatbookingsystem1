import React from 'react';
import { Armchair, Check, Lock } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SeatItem } from '../utils/bookingRules';
import { APPLE_SPRING_SNAPPY } from '../utils/motion';

interface SeatProps {
  seat: SeatItem;
  isSelected: boolean;
  onToggle: (seatId: string, isAvailable: boolean) => void;
}

export const Seat: React.FC<SeatProps> = ({ seat, isSelected, onToggle }) => {
  const isBooked = seat.status === 'BOOKED';
  const isAvailable = seat.status === 'AVAILABLE';

  let buttonClass =
    'relative group flex flex-col items-center justify-center rounded-xl transition-colors duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer select-none border focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 ';

  if (isSelected) {
    buttonClass +=
      'liquid-glass-btn-primary text-white dark:text-slate-950';
  } else if (isAvailable) {
    buttonClass +=
      'liquid-glass-seat-available text-emerald-900 dark:text-emerald-200';
  } else {
    buttonClass +=
      'liquid-glass-seat-booked text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70';
  }

  return (
    <motion.button
      type="button"
      onClick={() => onToggle(seat.seatId, isAvailable)}
      disabled={isBooked}
      whileHover={isBooked ? undefined : { y: -1.5, scale: 1.03 }}
      whileTap={isBooked ? undefined : { scale: 0.94 }}
      animate={{ scale: isSelected ? 1.03 : 1 }}
      transition={APPLE_SPRING_SNAPPY}
      aria-label={`Seat ${seat.seatId}, status: ${isSelected ? 'selected' : seat.status}, price: ₹${seat.price}`}
      title={
        isBooked
          ? `Seat ${seat.seatId} is booked`
          : isSelected
          ? `Seat ${seat.seatId} selected - click to deselect`
          : `Seat ${seat.seatId} available - ₹${seat.price}`
      }
      className={`${buttonClass} min-w-[40px] sm:min-w-[48px] py-2 px-1`}
    >
      <div className="relative">
        <Armchair
          className={`w-4 h-4 sm:w-[18px] sm:h-[18px] transition-colors duration-250 ${
            isSelected
              ? 'text-white dark:text-slate-950'
              : isAvailable
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        />

        <AnimatePresence>
          {isSelected && (
            <motion.span
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={APPLE_SPRING_SNAPPY}
              className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-white dark:bg-slate-950 text-cyan-700 dark:text-cyan-400 rounded-full flex items-center justify-center"
            >
              <Check className="w-2.5 h-2.5 stroke-[2.5]" />
            </motion.span>
          )}
        </AnimatePresence>

        {isBooked && (
          <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full flex items-center justify-center">
            <Lock className="w-2 h-2" />
          </span>
        )}
      </div>

      <span
        className={`text-xs font-mono font-semibold tracking-tight mt-0.5 transition-colors duration-250 ${
          isSelected
            ? 'text-white dark:text-slate-950'
            : isAvailable
            ? 'text-slate-900 dark:text-slate-100'
            : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        {seat.seatId}
      </span>

      <span
        className={`text-[10px] font-mono leading-tight transition-colors duration-250 ${
          isSelected
            ? 'text-white/90 dark:text-slate-900/80'
            : isAvailable
            ? 'text-slate-500 dark:text-slate-400'
            : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        {isBooked ? 'Booked' : `₹${seat.price}`}
      </span>
    </motion.button>
  );
};
