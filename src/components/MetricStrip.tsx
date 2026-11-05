import React from 'react';
import { motion } from 'motion/react';
import { formatINR } from '../utils/billing';

export interface DashboardMetrics {
  totalActive: number;
  totalPenalties: number;
  totalFloorRent: number;
  totalGMV: number;
  lowStockCount: number;
  overdueCount: number;
  expiringCount: number;
  totalProjectedAltRevenue: number;
}

interface MetricStripProps {
  metrics: DashboardMetrics;
}

export const MetricStrip: React.FC<MetricStripProps> = ({ metrics }) => {
  const cards = [
    {
      title: 'Active Brands',
      value: `${metrics.totalActive} on Floor`,
      color: 'text-slate-900',
      badge: 'Bays Active',
      badgeStyle: 'bg-pink-100 text-pink-700',
    },
    {
      title: 'Contract Renewals',
      value: `${metrics.overdueCount} Overdue`,
      color: metrics.overdueCount > 0 || metrics.expiringCount > 0 ? 'text-rose-600' : 'text-slate-900',
      badge: metrics.expiringCount > 0 ? `⚠️ ${metrics.expiringCount} Expire < 7d` : 'Healthy',
      badgeStyle:
        metrics.expiringCount > 0
          ? 'bg-rose-100 text-rose-800 border border-rose-300'
          : 'bg-slate-100 text-slate-600',
    },
    {
      title: 'Accrued Penalties',
      value: formatINR(metrics.totalPenalties),
      color: 'text-rose-600',
      badge: 'Late + Short',
      badgeStyle: 'bg-rose-100 text-rose-700',
    },
    {
      title: 'Floor Fixed Rent',
      value: formatINR(metrics.totalFloorRent),
      color: 'text-slate-900',
      badge: 'Monthly Base',
      badgeStyle: 'bg-pink-100 text-pink-700',
    },
    {
      title: 'Combined GMV (Wk)',
      value: formatINR(metrics.totalGMV),
      color: 'text-emerald-700',
      badge: 'Floor Volume',
      badgeStyle: 'bg-emerald-100 text-emerald-800',
    },
    {
      title: 'Low Stock Items',
      value: `${metrics.lowStockCount} Brands`,
      color: metrics.lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700',
      badge: '<5 units',
      badgeStyle: metrics.lowStockCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
    },
  ];

  return (
    <div className="bg-pink-50/40 border-b border-pink-200/60 px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            whileHover={{ y: -2 }}
            className="bg-white/95 p-3 rounded-xl border border-pink-100/90 shadow-sm shadow-pink-100/50 hover:border-pink-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium text-[11px] truncate">{card.title}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${card.badgeStyle}`}>
                {card.badge}
              </span>
            </div>
            <div className={`font-extrabold text-sm sm:text-base mt-1 font-mono tracking-tight ${card.color}`}>
              {card.value}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
