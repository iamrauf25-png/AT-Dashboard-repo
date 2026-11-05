import React from 'react';
import { motion } from 'motion/react';
import { Calendar, TrendingUp, MessageSquare, Barcode } from 'lucide-react';
import { TabType } from '../types/index';

interface NavigationTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  overdueCount: number;
  lowStockCount: number;
  openTicketCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  overdueCount,
  lowStockCount,
  openTicketCount,
}) => {
  const tabs = [
    {
      id: 'renewals' as TabType,
      label: 'Renewal & Invoicing Hub',
      shortLabel: 'Renewals',
      icon: Calendar,
      badge: overdueCount > 0 ? overdueCount : null,
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
    },
    {
      id: 'sales' as TabType,
      label: 'Sales & Inventory Performance',
      shortLabel: 'Sales & Stock',
      icon: TrendingUp,
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'tickets' as TabType,
      label: 'Brand Ticket Resolution Desk',
      shortLabel: 'Tickets',
      icon: MessageSquare,
      badge: openTicketCount > 0 ? openTicketCount : null,
      badgeColor: 'bg-pink-100 text-pink-700 border-pink-200',
    },
    {
      id: 'barcode' as TabType,
      label: 'Barcode Tag Printer',
      shortLabel: 'Barcode Studio',
      icon: Barcode,
      badge: 'NEW',
      badgeColor: 'bg-gradient-to-r from-pink-500 to-rose-400 text-white font-black text-[9px] px-1.5',
    },
  ];

  return (
    <nav
      aria-label="Dashboard sections"
      className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex gap-1.5 sm:gap-3 border-b border-pink-200/80 text-xs font-medium overflow-x-auto no-scrollbar scroll-smooth"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-selected={isActive}
            role="tab"
            className={`relative py-3 sm:py-3.5 px-2.5 sm:px-3 flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isActive ? 'text-pink-700 font-bold' : 'text-slate-600 hover:text-pink-600'
            }`}
          >
            <Icon
              className={`w-4 h-4 shrink-0 transition-colors ${
                isActive ? 'text-pink-600' : 'text-slate-400'
              }`}
            />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>

            {tab.badge !== null && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono border shrink-0 ${tab.badgeColor}`}
              >
                {tab.badge}
              </span>
            )}

            {isActive && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400 shadow-sm shadow-pink-300"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
