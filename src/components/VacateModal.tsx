import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Brand } from '../types/index';
import { calculateShortNoticePenalty, formatINR } from '../utils/billing';

interface VacateModalProps {
  brand: Brand | null;
  onClose: () => void;
  onConfirmVacate: (brandId: string, advanceNoticeDays: number) => void;
}

export const VacateModal: React.FC<VacateModalProps> = ({ brand, onClose, onConfirmVacate }) => {
  const [days, setDays] = useState(0);

  if (!brand) return null;

  const penaltyCalculation = calculateShortNoticePenalty(days);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmVacate(brand.id, days);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vacate-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="bg-white border border-pink-200 rounded-3xl max-w-md w-full shadow-2xl shadow-pink-200/50 p-6"
        >
          <div className="flex justify-between items-center pb-3 border-b border-pink-100">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
              <h3 id="vacate-modal-title" className="font-extrabold text-slate-900 text-sm">
                Floor Slot Clearance: {brand.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-pink-100/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
            <div className="bg-pink-50/50 p-3.5 rounded-2xl border border-pink-100 space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Current Allotted Bay:</span>
                <span className="font-mono text-pink-700 font-bold">{brand.slotId}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Category:</span>
                <span className="font-medium text-slate-900">{brand.category}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Monthly Base Rent:</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(brand.monthlyRent)}</span>
              </div>
            </div>

            <div>
              <label htmlFor="notice-days-input" className="text-slate-700 block mb-1 font-bold">
                Advance Notice Given (in Days)
              </label>
              <input
                id="notice-days-input"
                type="number"
                min="0"
                max="30"
                value={days}
                onChange={(e) => setDays(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-pink-50/30 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-pink-500 font-mono text-sm"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Alt.Tribe Policy: Minimum 2 calendar days advance notice required before vacating.
              </p>
            </div>

            {/* Surcharge preview */}
            {penaltyCalculation.shortNoticeDays > 0 ? (
              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl text-rose-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Short Notice Policy Surcharge</span>
                </div>
                <p className="text-[11px]">
                  Notice given is <span className="font-bold">{penaltyCalculation.shortNoticeDays} day(s)</span> less than the required 2-day notice period.
                </p>
                <div className="flex justify-between pt-1 border-t border-rose-200 font-mono font-bold text-xs">
                  <span>Emergency Clearance Fee:</span>
                  <span className="text-rose-700">{formatINR(penaltyCalculation.fee)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-emerald-900 text-[11px] font-medium">
                Standard 2+ day advance notice window fulfilled. No short-notice penalty will be levied.
              </div>
            )}

            <div className="pt-3 border-t border-pink-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-white border border-pink-200 text-slate-700 font-semibold rounded-xl hover:bg-pink-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md shadow-rose-200 transition-colors"
              >
                Confirm Discontinuation
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
