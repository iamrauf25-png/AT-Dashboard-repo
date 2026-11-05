import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  BellRing,
  Flame,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Brand } from '../types/index';
import { formatINR, calculateTotalPenalty, getContractExpiryInfo } from '../utils/billing';

interface RenewalsTabProps {
  brands: Brand[];
  filteredBrands: Brand[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRenewBrand: (brandId: string) => void;
  onOpenVacateModal: (brand: Brand) => void;
  onOpenInvoiceModal: (brand: Brand) => void;
  onSendRenewalReminders?: (brandNames: string[]) => void;
}

export const RenewalsTab: React.FC<RenewalsTabProps> = ({
  brands,
  filteredBrands,
  searchQuery,
  onSearchChange,
  onRenewBrand,
  onOpenVacateModal,
  onOpenInvoiceModal,
  onSendRenewalReminders,
}) => {
  // Reference date matching system local date (November 5, 2026)
  const referenceDate = useMemo(() => new Date('2026-11-05T00:00:00'), []);
  const [filterMode, setFilterMode] = useState<'all' | 'expiring' | 'overdue' | 'active'>('all');

  // Brands with less than 7 days remaining in their current agreement cycle
  const expiringSoonBrands = useMemo(() => {
    return brands.filter((b) => {
      if (b.status === 'Discontinued') return false;
      const info = getContractExpiryInfo(b, referenceDate);
      return info.isExpiringSoon;
    });
  }, [brands, referenceDate]);

  // Overdue brands
  const overdueBrands = useMemo(() => {
    return brands.filter((b) => b.status === 'Overdue');
  }, [brands]);

  // Filtered brands applying both the search query and the active quick filter pill
  const displayedBrands = useMemo(() => {
    return filteredBrands.filter((b) => {
      if (filterMode === 'expiring') {
        if (b.status === 'Discontinued') return false;
        const info = getContractExpiryInfo(b, referenceDate);
        return info.isExpiringSoon;
      }
      if (filterMode === 'overdue') {
        return b.status === 'Overdue';
      }
      if (filterMode === 'active') {
        return b.status === 'Active' || b.status === 'Grace Period';
      }
      return true;
    });
  }, [filteredBrands, filterMode, referenceDate]);

  const handleSendBatchAlerts = () => {
    const names = expiringSoonBrands.map((b) => b.name);
    if (onSendRenewalReminders) {
      onSendRenewalReminders(names);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-4"
    >
      {/* Contract Expiry Visual Alert Banner */}
      {expiringSoonBrands.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-rose-50 via-pink-50 to-white p-4 rounded-2xl border-2 border-rose-300 shadow-md shadow-rose-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-xs shadow-rose-200 mt-0.5">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-sm">
                  Contract Expiry Alert: {expiringSoonBrands.length} Brand Agreement{expiringSoonBrands.length > 1 ? 's' : ''} Expiring in &lt; 7 Days
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white uppercase tracking-wider animate-pulse">
                  Urgent Action
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                The agreement cycles for{' '}
                <span className="font-semibold text-rose-900">
                  {expiringSoonBrands.map((b) => b.name).join(', ')}
                </span>{' '}
                expire within 7 days. Send renewal reminders or review floor reallocations before grace cutoffs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilterMode(filterMode === 'expiring' ? 'all' : 'expiring')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'expiring'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-300'
                  : 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50'
              }`}
            >
              <span>{filterMode === 'expiring' ? 'Show All Brands' : 'Filter Expiring (< 7d)'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>

            {onSendRenewalReminders && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSendBatchAlerts}
                className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:opacity-95 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-pink-300"
                title="Send automated email & WhatsApp renewal reminders to expiring brand founders"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Send Batch Reminders</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Search & Policy Filter Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/95 p-4 rounded-2xl border border-pink-200/80 shadow-sm shadow-pink-100/50">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-pink-400" />
          <input
            type="text"
            aria-label="Search brands"
            placeholder="Search brand, category, or bay ID (e.g. 'Ceramics', 'Shelf C-04')..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-pink-50/30 border border-pink-100 rounded-xl text-xs placeholder:text-slate-400 text-slate-800 focus:outline-none focus:border-pink-400 transition-colors"
          />
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-pink-50 text-slate-700 hover:bg-pink-100 border border-pink-200/80'
            }`}
          >
            All Brands ({brands.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('expiring')}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'expiring'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
            </span>
            <span>Expiring &lt; 7d ({expiringSoonBrands.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('overdue')}
            className={`px-3 py-1 rounded-xl font-medium transition-all cursor-pointer ${
              filterMode === 'overdue'
                ? 'bg-rose-700 text-white'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Overdue ({overdueBrands.length})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-md shadow-pink-100/40 overflow-hidden">
        <div className="p-4 border-b border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Contract Renewal & Expiry Ledger</h2>
            <p className="text-xs text-slate-500">
              Live agreement cycles, 7-day contract expiry flags, and penalty audits
            </p>
          </div>
          <div className="flex items-center gap-2">
            {filterMode === 'expiring' && (
              <span className="text-xs text-rose-800 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                Filtered: &lt; 7 Days Expiry
              </span>
            )}
            <span className="text-xs text-pink-700 font-semibold bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
              Showing {displayedBrands.length} of {brands.length} Brands
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-pink-50/60 text-pink-900/80 font-bold border-b border-pink-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="py-3 px-4">Brand & Category</th>
                <th scope="col" className="py-3 px-3">Slot ID</th>
                <th scope="col" className="py-3 px-3">Base Rent</th>
                <th scope="col" className="py-3 px-3 min-w-[170px]">Agreement Cycle & Expiry</th>
                <th scope="col" className="py-3 px-3">Status</th>
                <th scope="col" className="py-3 px-3">Penalties Accrued</th>
                <th scope="col" className="py-3 px-3">Discontinuation Info</th>
                <th scope="col" className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50 text-slate-700">
              {displayedBrands.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No brands match the selected criteria.
                  </td>
                </tr>
              ) : (
                displayedBrands.map((b) => {
                  const totalBrandPenalty = calculateTotalPenalty(b);
                  const expiryInfo = getContractExpiryInfo(b, referenceDate);
                  const isFlaggedExpiring = expiryInfo.isExpiringSoon && b.status !== 'Discontinued';

                  return (
                    <tr
                      key={b.id}
                      className={`transition-colors ${
                        isFlaggedExpiring
                          ? 'bg-rose-50/35 border-l-4 border-l-rose-500 hover:bg-rose-50/50'
                          : 'hover:bg-pink-50/30'
                      }`}
                    >
                      {/* Brand & Category */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">{b.name}</span>
                          {/* Visual Indicator Pill next to Brand Name */}
                          {isFlaggedExpiring && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs"
                              title={`Contract expires on ${expiryInfo.formattedDate} (${expiryInfo.daysRemaining} days left)`}
                            >
                              <Flame className="w-3 h-3 text-rose-600 animate-pulse" />
                              <span>&lt; 7d Expiry</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{b.category}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-pink-600 font-mono font-medium">{b.id}</span>
                        </div>
                      </td>

                      {/* Slot ID */}
                      <td className="py-3 px-3 font-mono text-pink-800 font-semibold">
                        <span className="bg-pink-50 px-2 py-0.5 rounded border border-pink-200/80">
                          {b.slotId}
                        </span>
                      </td>

                      {/* Base Rent */}
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        <span className="font-mono text-slate-950 font-bold">{formatINR(b.monthlyRent)}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">per month</span>
                      </td>

                      {/* Agreement Cycle & Expiry Visual Indicator */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 font-mono text-slate-800 font-medium">
                          <Calendar className="w-3 h-3 text-pink-500 shrink-0" />
                          <span>{expiryInfo.formattedDate}</span>
                        </div>

                        {/* Visual indicator for < 7 days remaining */}
                        {isFlaggedExpiring ? (
                          <div className="mt-1 flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold w-fit ${
                                expiryInfo.urgency === 'critical'
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300 animate-pulse'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              <span className="relative flex h-2 w-2">
                                <span
                                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                    expiryInfo.urgency === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
                                  }`}
                                />
                                <span
                                  className={`relative inline-flex rounded-full h-2 w-2 ${
                                    expiryInfo.urgency === 'critical' ? 'bg-rose-600' : 'bg-amber-600'
                                  }`}
                                />
                              </span>
                              <span>
                                {expiryInfo.urgency === 'critical' ? '⚡ Critical: ' : '⚠️ Expiry: '}
                                {expiryInfo.daysRemaining === 0 ? 'Today' : `${expiryInfo.daysRemaining}d left`}
                              </span>
                            </span>

                            {/* Cycle progress bar */}
                            <div
                              className="w-28 bg-slate-200/80 rounded-full h-1.5 overflow-hidden"
                              title={`${expiryInfo.progressPercent}% of agreement cycle elapsed (${expiryInfo.daysRemaining} days left)`}
                            >
                              <div
                                className={`h-1.5 rounded-full ${
                                  expiryInfo.urgency === 'critical' ? 'bg-rose-600' : 'bg-amber-500'
                                }`}
                                style={{ width: `${expiryInfo.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        ) : expiryInfo.isExpired && b.status !== 'Discontinued' ? (
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 w-fit">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Expired ({Math.abs(expiryInfo.daysRemaining)}d ago)
                          </span>
                        ) : (
                          <span className="mt-0.5 text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-emerald-600" />
                            {expiryInfo.daysRemaining} days remaining
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {b.status === 'Active' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                          </span>
                        )}
                        {b.status === 'Grace Period' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> Grace (Due 24th)
                          </span>
                        )}
                        {b.status === 'Overdue' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Overdue (Past 24th)
                          </span>
                        )}
                        {b.status === 'Notice Served' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            Notice Served
                          </span>
                        )}
                        {b.status === 'Discontinued' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Discontinued
                          </span>
                        )}
                      </td>

                      {/* Penalties Accrued */}
                      <td className="py-3 px-3">
                        {totalBrandPenalty > 0 ? (
                          <div>
                            <span className="font-bold text-rose-600 font-mono text-sm">
                              {formatINR(totalBrandPenalty)}
                            </span>
                            <div className="text-[10px] text-rose-700/80 flex flex-col font-medium">
                              {b.lateFee > 0 && <span>• ₹{b.lateFee} Late Renewal</span>}
                              {b.emergencyRemovalFee > 0 && <span>• ₹{b.emergencyRemovalFee} Short Notice</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-mono font-semibold text-[11px]">₹0 (Clean)</span>
                        )}
                      </td>

                      {/* Discontinuation Info */}
                      <td className="py-3 px-3 text-slate-500">
                        {b.noticeDate ? (
                          <div>
                            <span className="text-slate-800 font-mono font-medium">{b.noticeDate}</span>
                            {b.shortNoticeDays > 0 ? (
                              <span className="block text-[10px] text-rose-600 font-semibold">
                                Short notice: {b.shortNoticeDays}d under min 2-day
                              </span>
                            ) : (
                              <span className="block text-[10px] text-emerald-700 font-medium">Standard notice met</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* If expiring soon or overdue, offer prominent Renew action */}
                          {isFlaggedExpiring || b.status === 'Overdue' || b.status === 'Grace Period' ? (
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => onRenewBrand(b.id)}
                              aria-label={`Renew contract for ${b.name}`}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs transition-colors cursor-pointer font-bold shadow-xs shadow-emerald-200"
                              title="Extend contract cycle by 30 days and clear overdue flags"
                            >
                              Renew Now
                            </motion.button>
                          ) : null}

                          {b.status !== 'Discontinued' && (
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => onOpenVacateModal(b)}
                              aria-label={`Vacate slot for ${b.name}`}
                              className="px-2 py-1 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-pink-200 rounded-lg text-xs transition-colors cursor-pointer"
                              title="Trigger floor exit workflow"
                            >
                              Vacate
                            </motion.button>
                          )}

                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onOpenInvoiceModal(b)}
                            aria-label={`Open Zoho Invoice for ${b.name}`}
                            className="px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer font-semibold shadow-2xs"
                            title="Open Zoho Mock Statement & Tax Invoice"
                          >
                            <FileText className="w-3 h-3 text-pink-600" />
                            <span>Zoho Invoice</span>
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
