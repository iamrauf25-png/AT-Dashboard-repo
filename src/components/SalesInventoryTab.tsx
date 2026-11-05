import React from 'react';
import { motion } from 'motion/react';
import { Store, DollarSign, Package, TrendingUp, Minus, Plus, FileDown, Printer } from 'lucide-react';
import { Brand } from '../types/index';
import { formatINR } from '../utils/billing';

interface SalesInventoryTabProps {
  brands: Brand[];
  filteredBrands: Brand[];
  totalGMV: number;
  lowStockCount: number;
  onAdjustStock: (brandId: string, delta: number) => void;
  onOpenReport?: () => void;
}

export const SalesInventoryTab: React.FC<SalesInventoryTabProps> = ({
  brands,
  filteredBrands,
  totalGMV,
  lowStockCount,
  onAdjustStock,
  onOpenReport,
}) => {
  const totalStoreConcession = brands.reduce(
    (acc, b) => acc + (b.unitsSoldWeekly || 0) * (b.unitPrice || 0) * (b.commissionRate || 0.15),
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-4"
    >
      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl border border-pink-100 p-5 flex items-center justify-between shadow-sm shadow-pink-100/40"
        >
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Floor Gross Merchandise Value</span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight">
              {formatINR(totalGMV)}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" /> Across all physical consignment slots
            </span>
          </div>
          <div className="p-3 bg-pink-50 border border-pink-200/80 rounded-2xl text-pink-600 shadow-2xs shrink-0">
            <Store className="w-6 h-6 shrink-0" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl border border-pink-100 p-5 flex items-center justify-between shadow-sm shadow-pink-100/40"
        >
          <div>
            <span className="text-xs text-slate-500 font-medium">Est. Store Concession Share (Avg 15%)</span>
            <div className="text-2xl font-black text-pink-700 mt-1 font-mono tracking-tight">
              {formatINR(totalStoreConcession)}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Net commissions retained by Alt.Tribe
            </span>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-2xl text-rose-600 shadow-2xs shrink-0">
            <DollarSign className="w-6 h-6 shrink-0" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl border border-pink-100 p-5 flex items-center justify-between shadow-sm shadow-pink-100/40"
        >
          <div>
            <span className="text-xs text-slate-500 font-medium">Low Stock Replenishment Priority</span>
            <div className="text-2xl font-black text-amber-700 mt-1 font-mono tracking-tight">
              {lowStockCount} Brands
            </div>
            <span className="text-[11px] text-amber-800 mt-1 block font-medium">
              Threshold &lt; 5 units on display bay
            </span>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-700 shadow-2xs shrink-0">
            <Package className="w-6 h-6 shrink-0" />
          </div>
        </motion.div>
      </div>

      {/* Main Velocity & Inventory Table */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-md shadow-pink-100/40 overflow-hidden">
        <div className="p-4 border-b border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">
              Weekly Shelf Velocity & Direct Stock Modifier
            </h2>
            <p className="text-xs text-slate-500">
              Use inline controls to log counter POS sales or restock receipts instantly
            </p>
          </div>

          {/* Export Action Buttons */}
          {onOpenReport && (
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onOpenReport}
                aria-label="Export Stakeholder PDF Report"
                className="px-3.5 py-1.5 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-pink-200 cursor-pointer shrink-0"
                title="Open executive brand performance report and download clean PDF"
              >
                <FileDown className="w-3.5 h-3.5 shrink-0" />
                <span>Export Stakeholder PDF</span>
              </motion.button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-pink-50/60 text-pink-900/80 font-bold border-b border-pink-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="py-3 px-4">Brand</th>
                <th scope="col" className="py-3 px-3">Avg Unit Price</th>
                <th scope="col" className="py-3 px-3">Weekly Sales</th>
                <th scope="col" className="py-3 px-3">Gross Revenue (GMV)</th>
                <th scope="col" className="py-3 px-3">Alt.Tribe Commission</th>
                <th scope="col" className="py-3 px-3">Current Stock</th>
                <th scope="col" className="py-3 px-3">Stock Health</th>
                <th scope="col" className="py-3 px-4 text-right">Quick Restock / Sale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50 text-slate-700">
              {filteredBrands.map((b) => {
                const weeklyGMV = (b.unitsSoldWeekly || 0) * (b.unitPrice || 0);
                const commissionAmount = weeklyGMV * (b.commissionRate || 0.15);
                const isLowStock = b.stockOnHand < 5;
                const isOutOfStock = b.stockOnHand === 0;

                return (
                  <tr key={b.id} className="hover:bg-pink-50/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{b.name}</span>
                      <span className="text-[11px] text-pink-700 font-mono block font-semibold">{b.slotId}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-800 font-medium">{formatINR(b.unitPrice)}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <span className="font-mono text-sm">{b.unitsSoldWeekly}</span>{' '}
                      <span className="text-slate-400 font-normal">units</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-700 font-mono">
                      {formatINR(weeklyGMV)}
                    </td>
                    <td className="py-3 px-3 font-mono text-pink-700 font-semibold">
                      {formatINR(commissionAmount)}
                      <span className="text-[10px] text-slate-400 block font-normal">
                        ({(b.commissionRate * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-mono font-bold text-sm ${
                          isOutOfStock
                            ? 'text-rose-600'
                            : isLowStock
                            ? 'text-amber-700'
                            : 'text-slate-900'
                        }`}
                      >
                        {b.stockOnHand}
                      </span>
                      <span className="text-[10px] text-slate-400 block">units in bay</span>
                    </td>
                    <td className="py-3 px-3">
                      {isOutOfStock ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          OUT OF STOCK
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          LOW STOCK (&lt;5)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          HEALTHY
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onAdjustStock(b.id, -1)}
                          disabled={b.stockOnHand <= 0}
                          aria-label={`Log 1 unit sold for ${b.name}`}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white hover:bg-pink-50 disabled:opacity-40 text-slate-700 border border-pink-200 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-2xs shrink-0"
                          title="Log 1 Unit Sold (Reduces bay stock, updates weekly GMV)"
                        >
                          <Minus className="w-3.5 h-3.5 shrink-0" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => onAdjustStock(b.id, 5)}
                          aria-label={`Restock 5 units for ${b.name}`}
                          className="px-2.5 py-1 flex items-center gap-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 transition-colors text-xs font-bold cursor-pointer shadow-2xs shrink-0"
                          title="Restock +5 units"
                        >
                          <Plus className="w-3 h-3 text-pink-600 shrink-0" />
                          <span>+5 Restock</span>
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
