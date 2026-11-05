import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Store,
  DollarSign,
  Package,
  TrendingUp,
  Minus,
  Plus,
  FileDown,
  Bell,
  BellRing,
  BellOff,
  AlertTriangle,
} from 'lucide-react';
import { Brand } from '../types/index';
import { formatINR } from '../utils/billing';
import {
  isBelowLowStockThreshold,
  shouldTriggerStockAlert,
  sendBrowserStockNotification,
  buildStockNotificationPayload,
  LOW_STOCK_ALERT_THRESHOLD,
} from '../utils/stockNotifications';

interface SalesInventoryTabProps {
  brands: Brand[];
  filteredBrands: Brand[];
  totalGMV: number;
  lowStockCount: number;
  onAdjustStock: (brandId: string, delta: number) => void;
  onOpenReport?: () => void;
  onTriggerNotification?: (text: string, type?: 'info' | 'success' | 'warning') => void;
}

export const SalesInventoryTab: React.FC<SalesInventoryTabProps> = ({
  brands,
  filteredBrands,
  totalGMV,
  lowStockCount,
  onAdjustStock,
  onOpenReport,
  onTriggerNotification,
}) => {
  const [notificationPermission, setNotificationPermission] = useState<
    'default' | 'granted' | 'denied' | 'unsupported'
  >('default');

  // Track previous stock levels per brand to detect downward transitions past threshold (< 3)
  const previousStockMapRef = useRef<Map<string, number>>(new Map());
  const isInitialMountRef = useRef<boolean>(true);

  // Check initial browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('unsupported');
    }
  }, []);

  // Monitor stock transitions from remote sync or local updates
  useEffect(() => {
    // On initial mount, populate previousStockMapRef without alerting
    if (isInitialMountRef.current) {
      brands.forEach((b) => {
        previousStockMapRef.current.set(b.id, b.stockOnHand);
      });
      isInitialMountRef.current = false;
      return;
    }

    brands.forEach((b) => {
      const prev = previousStockMapRef.current.get(b.id);
      if (prev !== undefined && shouldTriggerStockAlert(prev, b.stockOnHand)) {
        // Dispatch native browser notification
        sendBrowserStockNotification(b, b.stockOnHand);

        // Dispatch in-app toast notification
        if (onTriggerNotification) {
          onTriggerNotification(
            `⚠️ Low Stock Alert: "${b.name}" dropped to ${b.stockOnHand} unit${
              b.stockOnHand === 1 ? '' : 's'
            } in ${b.slotId} (threshold < ${LOW_STOCK_ALERT_THRESHOLD})!`,
            'warning'
          );
        }
      }
      previousStockMapRef.current.set(b.id, b.stockOnHand);
    });
  }, [brands, onTriggerNotification]);

  // Request browser notification permission
  const handleEnableNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      if (onTriggerNotification) {
        onTriggerNotification('HTML5 Browser Notifications not supported in this browser.', 'warning');
      }
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        if (onTriggerNotification) {
          onTriggerNotification(
            'Browser notifications enabled! You will receive desktop alerts when stock drops below 3 units.',
            'success'
          );
        }
        // Send a quick welcome test notification
        new Notification('🔔 Alt.Tribe Stock Alerts Active', {
          body: 'Low stock notifications will alert you whenever any brand bay has less than 3 units.',
        });
      } else if (permission === 'denied') {
        if (onTriggerNotification) {
          onTriggerNotification(
            'Browser notifications blocked. In-app toast alerts will remain active.',
            'info'
          );
        }
      }
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
    }
  }, [onTriggerNotification]);

  // Send a test low stock notification
  const handleSendTestAlert = useCallback(() => {
    const candidate =
      brands.find((b) => b.stockOnHand < LOW_STOCK_ALERT_THRESHOLD) || brands[0];
    if (!candidate) return;

    const payload = buildStockNotificationPayload(candidate, Math.min(candidate.stockOnHand, 2));

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(payload.title, {
          body: payload.body,
          tag: payload.tag,
        });
      } catch (e) {
        console.warn('Failed to send test notification:', e);
      }
    }

    if (onTriggerNotification) {
      onTriggerNotification(
        `[Test Alert] ${payload.title} — ${payload.body}`,
        'warning'
      );
    }
  }, [brands, onTriggerNotification]);

  // Intercept stock reduction to trigger alert immediately
  const handleAdjustStock = (brandId: string, delta: number) => {
    const targetBrand = brands.find((b) => b.id === brandId);
    if (targetBrand) {
      const currentStock = targetBrand.stockOnHand;
      const nextStock = Math.max(0, currentStock + delta);

      if (shouldTriggerStockAlert(currentStock, nextStock)) {
        // Send browser notification
        sendBrowserStockNotification(targetBrand, nextStock);

        if (onTriggerNotification) {
          onTriggerNotification(
            `⚠️ Low Stock Alert: "${targetBrand.name}" dropped to ${nextStock} unit${
              nextStock === 1 ? '' : 's'
            } in ${targetBrand.slotId} (threshold < ${LOW_STOCK_ALERT_THRESHOLD})! Immediate restock needed.`,
            'warning'
          );
        }
      }
    }

    onAdjustStock(brandId, delta);
  };

  const totalStoreConcession = brands.reduce(
    (acc, b) => acc + (b.unitsSoldWeekly || 0) * (b.unitPrice || 0) * (b.commissionRate || 0.15),
    0
  );

  const criticalStockCount = brands.filter((b) => isBelowLowStockThreshold(b.stockOnHand)).length;

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
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Low Stock Priority</span>
              {criticalStockCount > 0 && (
                <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-rose-100 text-rose-700">
                  {criticalStockCount} Critical &lt; 3
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-amber-700 mt-1 font-mono tracking-tight">
              {lowStockCount} Brands
            </div>
            <span className="text-[11px] text-amber-800 mt-1 block font-medium">
              Alerts trigger when stock drops &lt; 3 units
            </span>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-700 shadow-2xs shrink-0">
            <Package className="w-6 h-6 shrink-0" />
          </div>
        </motion.div>
      </div>

      {/* Browser Notification Low Stock Threshold Control Strip */}
      <div className="bg-gradient-to-r from-amber-50/90 via-white to-pink-50/60 p-3.5 px-4 rounded-2xl border border-amber-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5 sm:mt-0">
            {notificationPermission === 'granted' ? (
              <BellRing className="w-4 h-4 text-amber-700 animate-pulse" />
            ) : notificationPermission === 'denied' ? (
              <BellOff className="w-4 h-4 text-slate-500" />
            ) : (
              <Bell className="w-4 h-4 text-amber-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-xs">
                Browser Stock Notifications (Threshold: &lt; 3 Units)
              </span>
              {notificationPermission === 'granted' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Browser Alerts Active
                </span>
              ) : notificationPermission === 'denied' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Browser Permission Blocked (In-App Active)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Permission Required
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Sends an immediate desktop browser alert whenever an item's bay inventory drops below 3 units.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {notificationPermission !== 'granted' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleEnableNotifications}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-rose-500 hover:from-amber-500 hover:to-rose-400 text-white font-bold rounded-xl text-xs transition-all shadow-xs shadow-amber-200 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Bell className="w-3.5 h-3.5 shrink-0" />
              <span>Enable Browser Alerts</span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleSendTestAlert}
            className="px-3 py-1.5 bg-white hover:bg-pink-50 border border-pink-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
            title="Test browser notification alert"
          >
            <span>Test Alert</span>
          </motion.button>
        </div>
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
                const isOutOfStock = b.stockOnHand === 0;
                const isCriticalStock = isBelowLowStockThreshold(b.stockOnHand) && !isOutOfStock;
                const isLowStock = b.stockOnHand >= LOW_STOCK_ALERT_THRESHOLD && b.stockOnHand < 5;

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
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isOutOfStock
                              ? 'text-rose-600'
                              : isCriticalStock
                              ? 'text-rose-600 font-black'
                              : isLowStock
                              ? 'text-amber-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {b.stockOnHand}
                        </span>
                        {isCriticalStock && (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-pulse" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">units in bay</span>
                    </td>
                    <td className="py-3 px-3">
                      {isOutOfStock ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                          OUT OF STOCK
                        </span>
                      ) : isCriticalStock ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                          CRITICAL (&lt; 3)
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          LOW STOCK (&lt; 5)
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
                          onClick={() => handleAdjustStock(b.id, -1)}
                          disabled={b.stockOnHand <= 0}
                          aria-label={`Log 1 unit sold for ${b.name}`}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white hover:bg-pink-50 disabled:opacity-40 text-slate-700 border border-pink-200 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-2xs shrink-0"
                          title="Log 1 Unit Sold (Reduces bay stock, triggers alert if drops < 3)"
                        >
                          <Minus className="w-3.5 h-3.5 shrink-0" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleAdjustStock(b.id, 5)}
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
