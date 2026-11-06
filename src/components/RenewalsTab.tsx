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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  RotateCcw,
  FileSpreadsheet,
  Download,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import { Brand } from '../types/index';
import { formatINR, calculateTotalPenalty, getContractExpiryInfo } from '../utils/billing';
import { SortField, SortDirection, sortBrands, getBrandGMV } from '../utils/sorting';
import { generateBrandsCSV, downloadCSV } from '../utils/csvExport';
import { WhatsAppModal } from './WhatsAppModal';
import { getBrandWhatsAppUrl } from '../utils/whatsapp';

interface RenewalsTabProps {
  brands: Brand[];
  filteredBrands: Brand[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRenewBrand: (brandId: string) => void;
  onToggleAutoRenew?: (brandId: string, nextValue?: boolean) => void;
  onRunAutoRenewals?: () => void;
  onOpenVacateModal: (brand: Brand) => void;
  onOpenInvoiceModal: (brand: Brand) => void;
  onSendRenewalReminders?: (brandNames: string[]) => void;
  onTriggerNotification?: (text: string, type?: 'info' | 'success' | 'warning') => void;
}

export const RenewalsTab: React.FC<RenewalsTabProps> = ({
  brands,
  filteredBrands,
  searchQuery,
  onSearchChange,
  onRenewBrand,
  onToggleAutoRenew,
  onRunAutoRenewals,
  onOpenVacateModal,
  onOpenInvoiceModal,
  onSendRenewalReminders,
  onTriggerNotification,
}) => {
  // Reference date matching system local date (November 5, 2026)
  const referenceDate = useMemo(() => new Date('2026-11-05T00:00:00'), []);
  const [filterMode, setFilterMode] = useState<'all' | 'expiring' | 'overdue' | 'active' | 'autoRenew'>('all');
  const [sortField, setSortField] = useState<SortField>('default');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [whatsAppBrand, setWhatsAppBrand] = useState<Brand | null>(null);

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

  // Brands with Auto-Renew enabled
  const autoRenewBrands = useMemo(() => {
    return brands.filter((b) => Boolean(b.autoRenew) && b.status !== 'Discontinued');
  }, [brands]);

  // Filtered brands applying both the search query and the active quick filter pill
  const filteredList = useMemo(() => {
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
      if (filterMode === 'autoRenew') {
        return Boolean(b.autoRenew);
      }
      return true;
    });
  }, [filteredBrands, filterMode, referenceDate]);

  // Final sorted list according to active sort criteria
  const displayedBrands = useMemo(() => {
    return sortBrands(filteredList, sortField, sortDirection);
  }, [filteredList, sortField, sortDirection]);

  // Sorting handler: toggles field and direction
  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        // Third click clears sort back to default
        setSortField('default');
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      // For GMV, start with descending (highest grossing first); for dates, start with ascending (earliest expiry first)
      setSortDirection(field === 'gmv' ? 'desc' : 'asc');
    }
  };

  const handleSendBatchAlerts = () => {
    const names = expiringSoonBrands.map((b) => b.name);
    if (onSendRenewalReminders) {
      onSendRenewalReminders(names);
    }
  };

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `AltTribe_Brands_Ledger_${timestamp}.csv`;
    const csv = generateBrandsCSV(displayedBrands, referenceDate);
    downloadCSV(csv, filename);
    if (onTriggerNotification) {
      onTriggerNotification(
        `Exported ${displayedBrands.length} brands to ${filename}`,
        'success'
      );
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
            <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-xs shadow-rose-200 mt-0.5 shrink-0">
              <ShieldAlert className="w-5 h-5 shrink-0 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-sm">
                  Contract Expiry Alert: {expiringSoonBrands.length} Brand Agreement
                  {expiringSoonBrands.length > 1 ? 's' : ''} Expiring in &lt; 7 Days
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white uppercase tracking-wider animate-pulse shrink-0">
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                filterMode === 'expiring'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-300'
                  : 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50'
              }`}
            >
              <span>{filterMode === 'expiring' ? 'Show All Brands' : 'Filter Expiring (< 7d)'}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </motion.button>

            {onSendRenewalReminders && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSendBatchAlerts}
                className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:opacity-95 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-pink-300 shrink-0"
                title="Send automated email & WhatsApp renewal reminders to expiring brand founders"
              >
                <BellRing className="w-3.5 h-3.5 shrink-0" />
                <span>Send Batch Reminders</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Search, Filter & Quick Stats Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/95 p-4 rounded-2xl border border-pink-200/80 shadow-sm shadow-pink-100/50">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-pink-400 shrink-0" />
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
            className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer shrink-0 ${
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
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              filterMode === 'expiring'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300'
            }`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
            </span>
            <span>Expiring &lt; 7d ({expiringSoonBrands.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('overdue')}
            className={`px-3 py-1 rounded-xl font-medium transition-all cursor-pointer shrink-0 ${
              filterMode === 'overdue'
                ? 'bg-rose-700 text-white'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Overdue ({overdueBrands.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode(filterMode === 'autoRenew' ? 'all' : 'autoRenew')}
            className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              filterMode === 'autoRenew'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-pink-50/70 text-pink-800 hover:bg-pink-100 border border-pink-200'
            }`}
            title="Filter brands with Automated Renewal enabled"
          >
            <RefreshCw className="w-3 h-3 shrink-0" />
            <span>Auto-Renew ({autoRenewBrands.length})</span>
          </button>

          <div className="h-4 w-px bg-pink-200 hidden sm:block mx-1"></div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1 bg-white hover:bg-pink-50 text-pink-800 font-bold border border-pink-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
            title="Download current brands list as CSV file for spreadsheet reporting"
            aria-label="Export brands list as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-pink-600 shrink-0" />
            <span>Export CSV</span>
          </motion.button>
        </div>
      </div>

      {/* Sorting Control Strip */}
      <div className="bg-gradient-to-r from-pink-50/70 via-white to-rose-50/50 p-3 px-4 rounded-2xl border border-pink-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-pink-600 shrink-0" />
            <span>Sort Ledger:</span>
          </span>

          {/* Toggle 1: Agreement End Date */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => handleToggleSort('agreementEndDate')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              sortField === 'agreementEndDate'
                ? 'bg-rose-600 text-white shadow-xs shadow-rose-200'
                : 'bg-white text-slate-700 hover:bg-pink-100/70 border border-pink-200/80'
            }`}
            title="Click to toggle: Earliest Expiry First ↔ Latest Expiry First"
          >
            <Calendar className={`w-3.5 h-3.5 shrink-0 ${sortField === 'agreementEndDate' ? 'text-white' : 'text-pink-500'}`} />
            <span>Agreement End Date</span>
            {sortField === 'agreementEndDate' ? (
              <span className="text-[10px] bg-rose-700 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-0.5">
                {sortDirection === 'asc' ? (
                  <>
                    <ArrowUp className="w-3 h-3 shrink-0" />
                    <span>Earliest First</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-3 h-3 shrink-0" />
                    <span>Latest First</span>
                  </>
                )}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">
                <ArrowUpDown className="w-3 h-3 inline shrink-0" />
              </span>
            )}
          </motion.button>

          {/* Toggle 2: GMV Performance */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => handleToggleSort('gmv')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              sortField === 'gmv'
                ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-200'
                : 'bg-white text-slate-700 hover:bg-pink-100/70 border border-pink-200/80'
            }`}
            title="Click to toggle: Highest GMV First ↔ Lowest GMV First"
          >
            <TrendingUp className={`w-3.5 h-3.5 shrink-0 ${sortField === 'gmv' ? 'text-white' : 'text-emerald-600'}`} />
            <span>GMV Performance</span>
            {sortField === 'gmv' ? (
              <span className="text-[10px] bg-emerald-700 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-0.5">
                {sortDirection === 'desc' ? (
                  <>
                    <ArrowDown className="w-3 h-3 shrink-0" />
                    <span>High → Low</span>
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-3 h-3 shrink-0" />
                    <span>Low → High</span>
                  </>
                )}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">
                <ArrowUpDown className="w-3 h-3 inline shrink-0" />
              </span>
            )}
          </motion.button>

          {/* Reset Sort Button */}
          {sortField !== 'default' && (
            <button
              type="button"
              onClick={() => {
                setSortField('default');
                setSortDirection('asc');
              }}
              className="px-2.5 py-1 text-xs text-slate-500 hover:text-pink-700 hover:bg-pink-100/60 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="Reset sorting to default floor order"
            >
              <RotateCcw className="w-3 h-3 shrink-0" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Active Sort Label Badge */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {sortField !== 'default' ? (
            <span className="text-[11px] font-semibold text-pink-800 bg-pink-100/70 px-2.5 py-1 rounded-lg border border-pink-200 flex items-center gap-1">
              <span>Active Sort:</span>
              <strong className="font-bold">
                {sortField === 'agreementEndDate' ? 'Agreement End Date' : 'Weekly GMV Performance'}{' '}
                ({sortDirection === 'asc' ? 'Ascending' : 'Descending'})
              </strong>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">
              Default Order (Slot Allocation)
            </span>
          )}
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
          <div className="flex items-center gap-2 flex-wrap">
            {filterMode === 'expiring' && (
              <span className="text-xs text-rose-800 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1 shrink-0">
                <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse shrink-0" />
                Filtered: &lt; 7 Days Expiry
              </span>
            )}
            <span className="text-xs text-pink-700 font-semibold bg-pink-50 px-3 py-1 rounded-full border border-pink-200 shrink-0">
              Showing {displayedBrands.length} of {brands.length} Brands
            </span>
            {onRunAutoRenewals && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onRunAutoRenewals}
                className="flex items-center gap-1.5 px-3 py-1 bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-300 rounded-full font-bold text-xs shadow-2xs transition-all cursor-pointer shrink-0"
                title="Run automated renewal processing for eligible Auto-Renew brands"
                aria-label="Process Auto-Renewals"
              >
                <RefreshCw className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                <span>Process Auto-Renewals</span>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full font-bold text-xs shadow-xs shadow-pink-200 transition-all cursor-pointer shrink-0"
              title="Download current brands list as a CSV file for manual reporting"
              aria-label="Download Brands CSV"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Download CSV</span>
            </motion.button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-pink-50/60 text-pink-900/80 font-bold border-b border-pink-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="py-3 px-4">Brand & Category</th>
                <th scope="col" className="py-3 px-3">Slot ID</th>

                {/* Sortable GMV & Base Rent Column Header */}
                <th scope="col" className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('gmv')}
                    className="flex items-center gap-1.5 hover:text-emerald-700 transition-colors cursor-pointer group uppercase text-[11px] font-bold"
                    title="Click to sort by Gross Merchandise Value (GMV)"
                  >
                    <span>Base Rent & GMV</span>
                    {sortField === 'gmv' ? (
                      sortDirection === 'desc' ? (
                        <ArrowDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <ArrowUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                    )}
                  </button>
                </th>

                {/* Sortable Agreement End Date Column Header */}
                <th scope="col" className="py-3 px-3 min-w-[170px]">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('agreementEndDate')}
                    className="flex items-center gap-1.5 hover:text-rose-700 transition-colors cursor-pointer group uppercase text-[11px] font-bold"
                    title="Click to sort by Agreement End Date"
                  >
                    <span>Agreement Cycle & Expiry</span>
                    {sortField === 'agreementEndDate' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-rose-600 shrink-0" />
                    )}
                  </button>
                </th>

                <th scope="col" className="py-3 px-3">Auto-Renew</th>
                <th scope="col" className="py-3 px-3">Status</th>
                <th scope="col" className="py-3 px-3">Penalties Accrued</th>
                <th scope="col" className="py-3 px-3">Discontinuation Info</th>
                <th scope="col" className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50 text-slate-700">
              {displayedBrands.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No brands match the selected criteria.
                  </td>
                </tr>
              ) : (
                displayedBrands.map((b, index) => {
                  const totalBrandPenalty = calculateTotalPenalty(b);
                  const expiryInfo = getContractExpiryInfo(b, referenceDate);
                  const isFlaggedExpiring = expiryInfo.isExpiringSoon && b.status !== 'Discontinued';
                  const brandGMV = getBrandGMV(b);

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
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs shrink-0"
                              title={`Contract expires on ${expiryInfo.formattedDate} (${expiryInfo.daysRemaining} days left)`}
                            >
                              <Flame className="w-3 h-3 text-rose-600 shrink-0 animate-pulse" />
                              <span>&lt; 7d Expiry</span>
                            </span>
                          )}

                          {/* When sorted by GMV, show rank badge */}
                          {sortField === 'gmv' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                              <span>Rank #{index + 1}</span>
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

                      {/* Base Rent & Weekly GMV */}
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        <span className="font-mono text-slate-950 font-bold">{formatINR(b.monthlyRent)}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">base rent / mo</span>
                        <span
                          className={`text-[10px] font-mono font-bold mt-0.5 block ${
                            sortField === 'gmv' ? 'text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded w-fit' : 'text-slate-600'
                          }`}
                        >
                          GMV: {formatINR(brandGMV)}/wk
                        </span>
                      </td>

                      {/* Agreement Cycle & Expiry Visual Indicator */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 font-mono text-slate-800 font-medium">
                          <Calendar className="w-3 h-3 text-pink-500 shrink-0" />
                          <span>{expiryInfo.formattedDate}</span>
                          {sortField === 'agreementEndDate' && (
                            <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1 rounded border border-rose-200 ml-1">
                              #{index + 1}
                            </span>
                          )}
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
                              <span className="relative flex h-2 w-2 shrink-0">
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
                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                            Expired ({Math.abs(expiryInfo.daysRemaining)}d ago)
                          </span>
                        ) : (
                          <span className="mt-0.5 text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                            {expiryInfo.daysRemaining} days remaining
                          </span>
                        )}
                      </td>

                      {/* Auto-Renew Toggle Switch */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={Boolean(b.autoRenew)}
                            aria-label={`Toggle Auto-Renew for ${b.name}`}
                            disabled={b.status === 'Discontinued'}
                            onClick={() => onToggleAutoRenew && onToggleAutoRenew(b.id, !Boolean(b.autoRenew))}
                            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200 focus:outline-none ${
                              b.status === 'Discontinued'
                                ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-50'
                                : Boolean(b.autoRenew)
                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 border-pink-600 cursor-pointer shadow-2xs shadow-pink-200'
                                : 'bg-slate-200 border-slate-300 hover:bg-pink-100 cursor-pointer'
                            }`}
                            title={
                              b.status === 'Discontinued'
                                ? 'Auto-Renew unavailable for discontinued agreements'
                                : Boolean(b.autoRenew)
                                ? 'Auto-Renew is ON: Contract will automatically extend by 30 days on cutoff'
                                : 'Auto-Renew is OFF: Click to enable automated 30-day renewal processing'
                            }
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform duration-200 ${
                                Boolean(b.autoRenew) ? 'translate-x-4' : 'translate-x-0.5'
                              }`}
                            />
                          </button>

                          <div className="flex flex-col">
                            {b.status === 'Discontinued' ? (
                              <span className="text-[10px] font-medium text-slate-400">Closed</span>
                            ) : Boolean(b.autoRenew) ? (
                              <>
                                <span className="text-[11px] font-bold text-pink-700 flex items-center gap-0.5 leading-tight">
                                  <RefreshCw className="w-2.5 h-2.5 text-pink-600 shrink-0" />
                                  <span>Auto ON</span>
                                </span>
                                <span className="text-[9px] text-slate-400 leading-tight">30d cycle</span>
                              </>
                            ) : (
                              <>
                                <span className="text-[11px] font-medium text-slate-500 leading-tight">
                                  Manual
                                </span>
                                <span className="text-[9px] text-slate-400 leading-tight">Off</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {b.status === 'Active' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> Active
                          </span>
                        )}
                        {b.status === 'Grace Period' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" /> Grace (Due 24th)
                          </span>
                        )}
                        {b.status === 'Overdue' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" /> Overdue (Past 24th)
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
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs transition-colors cursor-pointer font-bold shadow-xs shadow-emerald-200 shrink-0"
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
                              className="px-2 py-1 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-pink-200 rounded-lg text-xs transition-colors cursor-pointer shrink-0"
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
                            className="px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer font-semibold shadow-2xs shrink-0"
                            title="Open Zoho Mock Statement & Tax Invoice"
                          >
                            <FileText className="w-3 h-3 text-pink-600 shrink-0" />
                            <span>Zoho Invoice</span>
                          </motion.button>

                          {/* WhatsApp Contract Status Button */}
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setWhatsAppBrand(b)}
                            aria-label={`Send WhatsApp contract update to ${b.name} founder`}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer font-bold shadow-2xs shrink-0 group"
                            title={`Open WhatsApp dispatch preview and pre-filled message for ${b.contactPerson || b.name}`}
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                            <span>WhatsApp</span>
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

      {/* WhatsApp Pre-filled Dispatch Modal */}
      <WhatsAppModal
        brand={whatsAppBrand}
        onClose={() => setWhatsAppBrand(null)}
        referenceDate={referenceDate}
        onCopied={() => {
          if (onTriggerNotification) {
            onTriggerNotification(
              `WhatsApp message for ${whatsAppBrand?.name} copied to clipboard!`,
              'info'
            );
          }
        }}
      />
    </motion.div>
  );
};
