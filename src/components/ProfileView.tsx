import React, { useState } from 'react';
import {
  Mail,
  Phone,
  Armchair,
  RotateCcw,
  CheckCircle2,
  Edit3,
  Save,
  X,
  Shield,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { UserProfile } from '../services/api';
import { NavTab } from './TopMenuBar';
import { APPLE_EASE, APPLE_SPRING_SNAPPY, appleStaggerItem } from '../utils/motion';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onNavigate: (tab: NavTab) => void;
  onResetAllData: () => void;
  totalBookingsCount?: number;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onUpdateProfile,
  onNavigate,
  onResetAllData,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>(profile);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const initials =
    profile.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'U';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(editForm);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-5">
      {/* Account Summary Header */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.992 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.36, ease: APPLE_EASE }}
        className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl liquid-glass-card"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-semibold text-base shrink-0 transition-colors duration-300">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold tracking-[-0.015em] text-slate-900 dark:text-white truncate">
              {profile.name}
            </h1>
            <p className="text-xs sm:text-sm text-cyan-700 dark:text-cyan-400 font-medium">
              {profile.memberTier} Member
            </p>
          </div>
        </div>

        {!isEditing && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            transition={APPLE_SPRING_SNAPPY}
            onClick={() => {
              setEditForm(profile);
              setIsEditing(true);
            }}
            className="h-9 px-3.5 rounded-xl liquid-glass-btn-secondary text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </motion.button>
        )}
      </motion.div>

      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.26, ease: APPLE_EASE }}
            className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile saved successfully.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Info or Inline Edit Form */}
      <AnimatePresence mode="wait" initial={false}>
        {isEditing ? (
          <motion.form
            key="edit-profile"
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.994 }}
            transition={{ duration: 0.3, ease: APPLE_EASE }}
            onSubmit={handleSave}
            className="p-4 sm:p-6 rounded-2xl liquid-glass-card flex flex-col gap-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/[0.06]">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Edit Profile Details
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-lg liquid-glass-btn-ghost flex items-center justify-center text-slate-500 dark:text-slate-300 cursor-pointer"
                aria-label="Cancel editing"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full h-10 px-3 liquid-glass-input rounded-xl text-slate-900 dark:text-white text-sm font-normal"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full h-10 px-3 liquid-glass-input rounded-xl text-slate-900 dark:text-white text-sm font-normal"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">
                  Mobile number
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value.replace(/\D/g, '') })}
                  className="w-full h-10 px-3 liquid-glass-input rounded-xl text-slate-900 dark:text-white text-sm font-mono font-normal"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">
                  Seat preference
                </label>
                <select
                  value={editForm.preferredSeatType}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      preferredSeatType: e.target.value as 'Window' | 'Aisle' | 'Any',
                    })
                  }
                  className="w-full h-10 px-3 liquid-glass-input rounded-xl text-slate-900 dark:text-white text-sm font-normal cursor-pointer"
                >
                  <option value="Window" className="bg-white dark:bg-slate-900">Window</option>
                  <option value="Aisle" className="bg-white dark:bg-slate-900">Aisle</option>
                  <option value="Any" className="bg-white dark:bg-slate-900">Any</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/60 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="h-9 px-4 rounded-xl liquid-glass-btn-secondary text-slate-700 dark:text-slate-200 text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                whileTap={{ scale: 0.96 }}
                transition={APPLE_SPRING_SNAPPY}
                className="h-9 px-4 rounded-xl liquid-glass-btn-primary text-white font-medium text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </motion.button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="view-profile"
            initial={{ opacity: 0, y: 10, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.994 }}
            transition={{ duration: 0.3, ease: APPLE_EASE }}
            className="p-4 sm:p-5 rounded-2xl liquid-glass-card"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.div {...appleStaggerItem(0, 0.04)} className="flex items-center gap-3 p-3.5 rounded-xl liquid-glass">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Email</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white truncate block">
                    {profile.email}
                  </span>
                </div>
              </motion.div>

              <motion.div {...appleStaggerItem(1, 0.04)} className="flex items-center gap-3 p-3.5 rounded-xl liquid-glass">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Phone</span>
                  <span className="text-sm font-mono font-medium text-slate-900 dark:text-white">
                    +91 {profile.mobile}
                  </span>
                </div>
              </motion.div>

              <motion.div {...appleStaggerItem(2, 0.04)} className="flex items-center gap-3 p-3.5 rounded-xl liquid-glass">
                <Armchair className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Seat preference</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {profile.preferredSeatType} seat
                  </span>
                </div>
              </motion.div>

              <motion.div {...appleStaggerItem(3, 0.04)} className="flex items-center gap-3 p-3.5 rounded-xl liquid-glass">
                <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Emergency contact</span>
                  <span className="text-sm font-mono font-medium text-slate-900 dark:text-white">
                    {profile.emergencyContact}
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, delay: 0.12, ease: APPLE_EASE }}
        className="p-4 sm:p-5 rounded-2xl liquid-glass-card flex flex-col gap-3"
      >
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Quick Actions</h2>

        <div className="flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              transition={APPLE_SPRING_SNAPPY}
              onClick={() => onNavigate('ticket-booking')}
              className="h-9 px-4 rounded-xl liquid-glass-btn-primary text-white text-sm font-medium cursor-pointer"
            >
              Book Ticket
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              transition={APPLE_SPRING_SNAPPY}
              onClick={() => onNavigate('my-bookings')}
              className="h-9 px-4 rounded-xl liquid-glass-btn-secondary text-slate-700 dark:text-slate-200 text-sm font-medium cursor-pointer"
            >
              My Bookings
            </motion.button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {!showResetConfirm ? (
              <motion.button
                key="reset-btn"
                type="button"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease: APPLE_EASE }}
                onClick={() => setShowResetConfirm(true)}
                className="h-9 px-3.5 rounded-xl liquid-glass-btn-danger text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </motion.button>
            ) : (
              <motion.div
                key="reset-confirm"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.22, ease: APPLE_EASE }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl liquid-glass ml-auto"
              >
                <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
                  Reset all demo data?
                </span>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="h-7 px-2.5 rounded-lg liquid-glass-btn-secondary text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onResetAllData();
                    setShowResetConfirm(false);
                  }}
                  className="h-7 px-2.5 rounded-lg liquid-glass-btn-danger text-xs font-medium cursor-pointer"
                >
                  Confirm
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
