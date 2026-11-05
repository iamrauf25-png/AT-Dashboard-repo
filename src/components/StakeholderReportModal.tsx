import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileDown,
  Printer,
  Copy,
  Check,
  TrendingUp,
  Store,
  DollarSign,
  Package,
  Calendar,
  Building2,
  UserCheck,
  Award,
} from 'lucide-react';
import { Brand } from '../types/index';
import { formatINR } from '../utils/billing';
import { calculateReportSummary, generateBrandPerformancePDF } from '../utils/pdfExport';

interface StakeholderReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  brands: Brand[];
  onTriggerNotification: (text: string, type?: 'info' | 'success' | 'warning') => void;
}

export const StakeholderReportModal: React.FC<StakeholderReportModalProps> = ({
  isOpen,
  onClose,
  brands,
  onTriggerNotification,
}) => {
  const [period, setPeriod] = useState('Q4 2026 Audit Cycle (01 Nov - 07 Nov 2026)');
  const [preparedBy, setPreparedBy] = useState('Retail Operations & Floor Management');
  const [storeLocation, setStoreLocation] = useState('Alt.Tribe Flagship Space #01 (Bangalore)');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const summary = calculateReportSummary(brands);

  // Ranked brands descending by GMV
  const rankedBrands = [...brands].sort((a, b) => {
    const gmvA = (a.unitsSoldWeekly || 0) * (a.unitPrice || 0);
    const gmvB = (b.unitsSoldWeekly || 0) * (b.unitPrice || 0);
    return gmvB - gmvA;
  });

  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      const doc = generateBrandPerformancePDF(brands, {
        period,
        preparedBy,
        storeLocation,
      });

      doc.save('AltTribe_Brand_Performance_Stakeholder_Report.pdf');
      onTriggerNotification(
        'Executive Brand Performance PDF successfully generated & downloaded.',
        'success'
      );
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      onTriggerNotification('Failed to generate PDF report. Please try printing to PDF instead.', 'warning');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
    onTriggerNotification('Print dialog opened. Select "Save as PDF" to export a clean document.', 'info');
  };

  const handleCopySummary = async () => {
    const text = `*Alt.Tribe Retail Ops — Executive Brand Performance Report*
Period: ${period}
Store: ${storeLocation}

• Total Floor GMV: ${formatINR(summary.totalGMV)} (${summary.totalUnitsSoldWeekly} units)
• Alt.Tribe Concession Revenue: ${formatINR(summary.totalConcessionRevenue)} (Avg 15% margin)
• Fixed Monthly Space Rent: ${formatINR(summary.totalFloorRent)}
• Total Display Stock: ${summary.totalStockOnHand} units
• Top Brand: ${summary.topPerformingBrand?.name || 'N/A'} (${formatINR(
      (summary.topPerformingBrand?.unitsSoldWeekly || 0) * (summary.topPerformingBrand?.unitPrice || 0)
    )} GMV)
• Restock Priority: ${summary.lowStockCount} brands below threshold

Generated via Alt.Tribe Retail Technologies`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onTriggerNotification('Executive report summary copied to clipboard for stakeholders.', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onTriggerNotification('Could not copy to clipboard.', 'warning');
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stakeholder-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="bg-white border border-pink-200 rounded-3xl max-w-4xl w-full shadow-2xl shadow-pink-200/50 flex flex-col max-h-[92vh] overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-pink-100 flex items-center justify-between bg-gradient-to-r from-pink-50 via-white to-rose-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-400 text-white flex items-center justify-center shadow-sm shadow-pink-200 shrink-0">
                <FileDown className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 id="stakeholder-modal-title" className="font-extrabold text-slate-900 text-base">
                    Executive Brand Performance Report
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700 border border-pink-200 shrink-0">
                    PDF Export Engine
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Ready-to-export stakeholder document with GMV, concession margins, and velocity audits
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close report modal"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-pink-100/60 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5 shrink-0" />
            </button>
          </div>

          {/* Report Customization Bar */}
          <div className="px-5 py-3 bg-pink-50/50 border-b border-pink-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label htmlFor="audit-period-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Audit Period
              </label>
              <input
                id="audit-period-input"
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-pink-200 rounded-lg text-slate-800 focus:outline-none focus:border-pink-400 font-medium"
              />
            </div>
            <div>
              <label htmlFor="prepared-by-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Prepared By
              </label>
              <input
                id="prepared-by-input"
                type="text"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-pink-200 rounded-lg text-slate-800 focus:outline-none focus:border-pink-400 font-medium"
              />
            </div>
            <div>
              <label htmlFor="store-location-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Store Location
              </label>
              <input
                id="store-location-input"
                type="text"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-pink-200 rounded-lg text-slate-800 focus:outline-none focus:border-pink-400 font-medium"
              />
            </div>
          </div>

          {/* Document Preview Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
            {/* Printable Document Sheet Preview */}
            <div
              id="stakeholder-printable-report"
              className="bg-white rounded-2xl border border-pink-200 p-5 sm:p-7 shadow-md shadow-pink-100/50 space-y-6 text-slate-800"
            >
              {/* Report Header Bar */}
              <div className="border-b border-pink-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-600 via-rose-500 to-pink-400 text-white flex items-center justify-center font-black text-xl shadow-md shadow-pink-200 shrink-0">
                    A•T
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-lg">Alt.Tribe Concept Spaces</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Executive Concession Performance & Floor Velocity Report
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-medium">
                        <Building2 className="w-3 h-3 text-pink-500 shrink-0" />
                        {storeLocation}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-pink-500 shrink-0" />
                        {period}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-pink-50 border border-pink-200 px-3.5 py-2 rounded-xl self-start sm:self-auto text-right">
                  <span className="text-[10px] font-bold text-pink-800 uppercase tracking-wider block">
                    Confidential Report
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* 4 Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-emerald-50/50 border border-emerald-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Total Floor GMV (Wk)
                  </span>
                  <div className="text-base sm:text-lg font-black font-mono text-emerald-800 mt-0.5">
                    {formatINR(summary.totalGMV)}
                  </div>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">
                    {summary.totalUnitsSoldWeekly} units sold
                  </span>
                </div>

                <div className="bg-pink-50/50 border border-pink-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-pink-800 uppercase tracking-wider block">
                    Alt.Tribe Concession Share
                  </span>
                  <div className="text-base sm:text-lg font-black font-mono text-pink-700 mt-0.5">
                    {formatINR(summary.totalConcessionRevenue)}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Avg 15% revenue capture
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                    Floor Base Rent
                  </span>
                  <div className="text-base sm:text-lg font-black font-mono text-slate-900 mt-0.5">
                    {formatINR(summary.totalFloorRent)}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {summary.totalBrands} consignment bays
                  </span>
                </div>

                <div className="bg-amber-50/50 border border-amber-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Inventory & Safety Buffer
                  </span>
                  <div className="text-base sm:text-lg font-black font-mono text-amber-800 mt-0.5">
                    {summary.totalStockOnHand} Units
                  </div>
                  <span className="text-[10px] text-amber-700 block mt-0.5">
                    {summary.lowStockCount} below buffer (&lt;5)
                  </span>
                </div>
              </div>

              {/* Performance Table */}
              <div className="overflow-x-auto rounded-xl border border-pink-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-pink-50/80 text-pink-900 font-bold border-b border-pink-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th scope="col" className="py-2.5 px-3">#</th>
                      <th scope="col" className="py-2.5 px-3">Brand & Category</th>
                      <th scope="col" className="py-2.5 px-2">Slot</th>
                      <th scope="col" className="py-2.5 px-2">Avg Price</th>
                      <th scope="col" className="py-2.5 px-2">Wk Units</th>
                      <th scope="col" className="py-2.5 px-3">Gross GMV</th>
                      <th scope="col" className="py-2.5 px-2">Rate</th>
                      <th scope="col" className="py-2.5 px-3">Concession Yield</th>
                      <th scope="col" className="py-2.5 px-2">Bay Stock</th>
                      <th scope="col" className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-100 text-slate-700">
                    {rankedBrands.map((b, index) => {
                      const weeklyGMV = (b.unitsSoldWeekly || 0) * (b.unitPrice || 0);
                      const yieldAmount = weeklyGMV * (b.commissionRate || 0.15);

                      return (
                        <tr key={b.id} className={index % 2 === 0 ? 'bg-white' : 'bg-pink-50/20'}>
                          <td className="py-2.5 px-3 font-bold font-mono text-pink-600">
                            #{index + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 block">{b.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {b.category} • {b.id}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-mono font-bold text-pink-800 text-[11px]">
                            {b.slotId}
                          </td>
                          <td className="py-2.5 px-2 font-mono text-slate-800">
                            {formatINR(b.unitPrice)}
                          </td>
                          <td className="py-2.5 px-2 font-mono font-bold text-slate-900">
                            {b.unitsSoldWeekly} pcs
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                            {formatINR(weeklyGMV)}
                          </td>
                          <td className="py-2.5 px-2 font-mono text-slate-600">
                            {((b.commissionRate || 0.15) * 100).toFixed(0)}%
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-pink-700">
                            {formatINR(yieldAmount)}
                          </td>
                          <td className="py-2.5 px-2 font-mono font-bold">
                            {b.stockOnHand === 0 ? (
                              <span className="text-rose-600">0 (Out)</span>
                            ) : b.stockOnHand < 5 ? (
                              <span className="text-amber-700">{b.stockOnHand} (Low)</span>
                            ) : (
                              <span className="text-slate-800">{b.stockOnHand}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : b.status === 'Grace Period'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : b.status === 'Overdue'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-300'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-pink-50/70 border-t-2 border-pink-200 font-bold text-slate-900">
                    <tr>
                      <td colSpan={4} className="py-2.5 px-3 text-slate-800 text-xs">
                        Consolidated Floor Totals ({brands.length} Brands)
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-900">
                        {summary.totalUnitsSoldWeekly} pcs
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-700">
                        {formatINR(summary.totalGMV)}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-500">Avg 15%</td>
                      <td className="py-2.5 px-3 font-mono text-pink-700">
                        {formatINR(summary.totalConcessionRevenue)}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-800">
                        {summary.totalStockOnHand} pcs
                      </td>
                      <td className="py-2.5 px-3 text-right text-[10px] text-slate-400">
                        Audited
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Stakeholder Sign-Off Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900 text-[11px] block">
                    1. Velocity Analysis
                  </span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    • Top contributor:{' '}
                    <span className="font-semibold text-slate-700">
                      {summary.topPerformingBrand?.name}
                    </span>{' '}
                    with{' '}
                    {formatINR(
                      (summary.topPerformingBrand?.unitsSoldWeekly || 0) *
                        (summary.topPerformingBrand?.unitPrice || 0)
                    )}
                    /wk.
                    <br />
                    • {summary.lowStockCount} brands below threshold require immediate restocking notice.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900 text-[11px] block">
                    2. Prepared By
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Officer: {preparedBy}
                    <br />
                    System: Alt.Tribe POS & Concession Engine
                    <br />
                    Sign: ___________________
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900 text-[11px] block">
                    3. Stakeholder Endorsement
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Board Review: [✓] Approved [ ] Action
                    <br />
                    Date: _____ / _____ / 2026
                    <br />
                    Sign: ___________________
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Fast Actions */}
          <div className="p-4 sm:p-5 border-t border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Award className="w-4 h-4 text-pink-500 shrink-0" />
              <span>Generates high-contrast landscape PDF report formatted for board reviews</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              <button
                type="button"
                onClick={handleCopySummary}
                className="px-3 py-2 bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Copy report summary to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                <span>{copied ? 'Copied' : 'Copy Summary'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-white hover:bg-pink-50 text-slate-700 border border-pink-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Print or Save via System PDF dialog"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span>Print / Save as PDF</span>
              </button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                disabled={isExporting}
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 hover:from-pink-500 hover:to-rose-400 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md shadow-pink-200 transition-all cursor-pointer shrink-0"
              >
                <FileDown className="w-4 h-4 shrink-0" />
                <span>{isExporting ? 'Generating PDF...' : 'Download Clean PDF'}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
