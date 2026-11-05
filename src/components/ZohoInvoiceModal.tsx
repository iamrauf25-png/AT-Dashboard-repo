import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, X, CheckCircle2, Printer, Sparkles } from 'lucide-react';
import { Brand } from '../types/index';
import { formatINR, calculateZohoSettlement } from '../utils/billing';

interface ZohoInvoiceModalProps {
  brand: Brand | null;
  onClose: () => void;
  onPushToZoho: (brand: Brand) => void;
}

export const ZohoInvoiceModal: React.FC<ZohoInvoiceModalProps> = ({
  brand,
  onClose,
  onPushToZoho,
}) => {
  if (!brand) return null;

  const settlement = calculateZohoSettlement(brand);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="bg-white border border-pink-200 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl shadow-pink-200/50 flex flex-col"
        >
          {/* Modal Header */}
          <div className="p-4 px-6 border-b border-pink-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-pink-100 text-pink-700 rounded-xl">
                <FileText className="w-4 h-4" />
              </div>
              <h3 id="invoice-modal-title" className="font-extrabold text-slate-900 text-sm">
                Zoho Invoice Settlement: <span className="text-pink-700">{brand.name}</span>
              </h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close invoice modal"
              className="p-1.5 rounded-xl hover:bg-pink-100/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Printable Tax Invoice Container */}
          <div className="p-6 bg-white text-slate-800 space-y-6 text-xs font-sans" id="printable-invoice">
            {/* Top Banner */}
            <div className="flex justify-between items-start border-b border-pink-100 pb-4">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-950">ALT.TRIBE SPACES LLP</h2>
                <p className="text-[11px] text-slate-500">104 Indiranagar 100ft Road, Bangalore, KA 560038</p>
                <p className="text-[11px] text-slate-500">
                  GSTIN: <span className="font-mono text-slate-800 font-bold">29AAAAA0000A1Z5</span>
                </p>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                  Zoho Books Auto-Sync: Active (#ZOHO-INV-2026-089)
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-black text-pink-700 uppercase tracking-widest">
                  TAX INVOICE / SETTLEMENT
                </div>
                <p className="font-mono text-slate-900 font-bold text-xs mt-1">
                  #ALT-INV-2026-{brand.id.replace('BRD-', '')}
                </p>
                <p className="text-[11px] text-slate-500">
                  Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-[11px] text-slate-500">Due Cutoff: 24th Monthly</p>
              </div>
            </div>

            {/* Billed To / Concession Details */}
            <div className="grid grid-cols-2 gap-4 bg-pink-50/40 p-4 rounded-2xl border border-pink-100 text-[11px]">
              <div>
                <span className="text-pink-900 uppercase font-bold text-[10px] block mb-1">
                  Brand Concessionaire:
                </span>
                <div className="font-bold text-slate-950 text-xs">{brand.name}</div>
                <div className="text-slate-600 font-medium">{brand.contactPerson}</div>
                <div className="text-slate-500">{brand.contactEmail}</div>
                <div className="font-mono text-slate-600 mt-1 font-semibold">GSTIN: {brand.gstin}</div>
              </div>
              <div>
                <span className="text-pink-900 uppercase font-bold text-[10px] block mb-1">
                  Allotted Floor Bay:
                </span>
                <div className="font-bold text-pink-700 font-mono text-xs">{brand.slotId}</div>
                <div className="text-slate-600">Category: {brand.category}</div>
                <div className="text-slate-600">
                  Commission Rate: {(brand.commissionRate * 100).toFixed(0)}%
                </div>
                <div className="text-pink-800 font-mono mt-1 font-bold">Status: {brand.status}</div>
              </div>
            </div>

            {/* Breakdown Ledger Table */}
            <div>
              <table className="w-full text-left text-xs border border-pink-100 rounded-xl overflow-hidden">
                <thead className="bg-pink-50/70 text-pink-900 font-bold border-b border-pink-100 text-[11px]">
                  <tr>
                    <th scope="col" className="py-2.5 px-3">Line Description</th>
                    <th scope="col" className="py-2.5 px-3 text-center">HSN/SAC</th>
                    <th scope="col" className="py-2.5 px-3 text-right">Rate</th>
                    <th scope="col" className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50 text-slate-700">
                  {/* Base Rent */}
                  <tr>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">Space Rental & Display Concession Fee</div>
                      <span className="text-[10px] text-slate-500">Fixed monthly space allocation</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">997212</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatINR(settlement.baseRent)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">{formatINR(settlement.baseRent)}</td>
                  </tr>

                  {/* Late Penalty */}
                  {settlement.lateFee > 0 && (
                    <tr className="bg-rose-50/50 text-rose-900">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-rose-800">Recurring 24th Late Renewal Penalty</div>
                        <span className="text-[10px] text-rose-600">
                          Applied for contract renewal pending after the 24th
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">999799</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹250</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">{formatINR(settlement.lateFee)}</td>
                    </tr>
                  )}

                  {/* Short Notice Removal Penalty */}
                  {settlement.emergencyRemovalFee > 0 && (
                    <tr className="bg-amber-50/50 text-amber-900">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-amber-800">
                          Emergency Bay Removal & Short-Notice Penalty
                        </div>
                        <span className="text-[10px] text-amber-700">
                          ₹250/day surcharge for exit under mandatory 2-day notice window
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">999799</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹250/day</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {formatINR(settlement.emergencyRemovalFee)}
                      </td>
                    </tr>
                  )}

                  {/* GST Row */}
                  <tr className="bg-pink-50/20 text-slate-600 text-[11px]">
                    <td colSpan={3} className="py-2 px-3 text-right font-medium">
                      GST (CGST 9% + SGST 9%) on Space Services
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-900 font-bold">
                      {formatINR(settlement.gstAmount)}
                    </td>
                  </tr>

                  {/* Total Alt Charges */}
                  <tr className="border-t-2 border-pink-200 font-bold text-slate-950 bg-pink-50/40">
                    <td colSpan={3} className="py-2.5 px-3 text-right font-bold text-xs">
                      Total Alt.Tribe Charges Payable (A):
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-pink-700 text-sm">
                      {formatINR(settlement.totalAltPayable)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Store Sales Offset (Concession Reversal) */}
            <div className="bg-pink-50/40 p-4 rounded-2xl border border-pink-100 space-y-2">
              <span className="text-[11px] font-bold text-pink-900 uppercase tracking-wider block">
                Consignment Store Sales Clearance (Weekly Offset)
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>
                    Physical Store Sales Volume ({brand.unitsSoldWeekly} units @ {formatINR(brand.unitPrice)}):
                  </span>
                  <span className="font-mono text-slate-900 font-semibold">{formatINR(settlement.grossSales)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>
                    Less: Alt.Tribe Revenue Commission ({(brand.commissionRate * 100).toFixed(0)}%):
                  </span>
                  <span className="font-mono text-rose-600 font-semibold">- {formatINR(settlement.commissionAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-pink-200">
                  <span>Net Sales Revenue Retained for Brand (B):</span>
                  <span className="font-mono text-emerald-700">{formatINR(settlement.netBrandPayout)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-black pt-2 border-t border-pink-300">
                  <span className={settlement.finalSettlementBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    Net Settlement Balance (B - A):
                  </span>
                  <span
                    className={`font-mono text-base ${
                      settlement.finalSettlementBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {settlement.finalSettlementBalance >= 0
                      ? `Alt.Tribe Pays Brand: ${formatINR(settlement.finalSettlementBalance)}`
                      : `Brand Owes Alt.Tribe: ${formatINR(Math.abs(settlement.finalSettlementBalance))}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Zoho Stamp & Sign */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-pink-100">
              <div>
                <p>System verified by Zoho Books Automated Webhook Engine.</p>
                <p>In accordance with Section 31 of CGST Act, 2017.</p>
              </div>
              <div className="text-right font-mono">
                <span className="text-slate-700 font-bold">AUTHORIZED SIGNATORY</span>
                <p className="text-pink-700 font-sans mt-0.5 font-bold">Alt.Tribe Finance Desk</p>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="p-4 px-6 bg-pink-50/40 border-t border-pink-100 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Payload ready for Zoho Books API batch export</span>
            </span>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrint}
                aria-label="Print or export PDF"
                className="px-3.5 py-2 bg-white hover:bg-pink-50 text-slate-700 border border-pink-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-pink-600" />
                <span>Print / Export PDF</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPushToZoho(brand)}
                aria-label="Push invoice to Zoho Books"
                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-pink-200 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Push to Zoho Books</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
