/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Brand, Ticket, TicketStatus, NotificationState, TabType } from './types/index';
import { INITIAL_BRANDS, INITIAL_TICKETS } from './data/initialData';
import {
  evaluate24thRenewalAudit,
  calculateShortNoticePenalty,
  calculateTotalPenalty,
  getContractExpiryInfo,
} from './utils/billing';
import { Header } from './components/Header';
import { MetricStrip, DashboardMetrics } from './components/MetricStrip';
import { NavigationTabs } from './components/NavigationTabs';
import { RenewalsTab } from './components/RenewalsTab';
import { SalesInventoryTab } from './components/SalesInventoryTab';
import { TicketsTab } from './components/TicketsTab';
import { BarcodePrinterTab } from './components/BarcodePrinterTab';
import { ZohoInvoiceModal } from './components/ZohoInvoiceModal';
import { VacateModal } from './components/VacateModal';
import { AddBrandModal } from './components/AddBrandModal';
import { NewTicketModal } from './components/NewTicketModal';
import { NotificationToast } from './components/NotificationToast';

export default function App() {
  // --- CORE STATE ---
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [activeTab, setActiveTab] = useState<TabType>('renewals');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Modals state
  const [invoiceBrand, setInvoiceBrand] = useState<Brand | null>(null);
  const [vacateBrand, setVacateBrand] = useState<Brand | null>(null);
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  // System real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerNotification = (text: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification((current) => (current?.text === text ? null : current));
    }, 4000);
  };

  // --- DERIVED METRICS ---
  const metrics: DashboardMetrics = useMemo(() => {
    const totalActive = brands.filter((b) => b.status === 'Active' || b.status === 'Grace Period').length;
    const totalPenalties = brands.reduce((acc, b) => acc + calculateTotalPenalty(b), 0);
    const totalFloorRent = brands.reduce((acc, b) => acc + (b.monthlyRent || 0), 0);
    const totalGMV = brands.reduce((acc, b) => acc + (b.unitsSoldWeekly || 0) * (b.unitPrice || 0), 0);
    const lowStockCount = brands.filter((b) => b.stockOnHand < 5).length;
    const overdueCount = brands.filter((b) => b.status === 'Overdue').length;
    const expiringCount = brands.filter((b) => {
      if (b.status === 'Discontinued') return false;
      return getContractExpiryInfo(b, new Date('2026-11-05T00:00:00')).isExpiringSoon;
    }).length;

    return {
      totalActive,
      totalPenalties,
      totalFloorRent,
      totalGMV,
      lowStockCount,
      overdueCount,
      expiringCount,
      totalProjectedAltRevenue: totalFloorRent + totalPenalties,
    };
  }, [brands]);

  // --- PENALTY CHECK ENGINE (24TH OF MONTH RULE) ---
  const handleRunPenaltyCheck = () => {
    const { updatedBrands, newPenaltyCount } = evaluate24thRenewalAudit(brands);
    setBrands(updatedBrands);
    triggerNotification(
      `24th Cycle Audit Complete: Evaluated ${brands.length} brand contracts. ${newPenaltyCount} new ₹250 penalty flags applied.`,
      newPenaltyCount > 0 ? 'warning' : 'success'
    );
  };

  // --- BRAND CONTRACT ACTIONS ---
  const handleRenewBrand = (id: string) => {
    setBrands((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          // Push agreement end date forward by 30 days
          const currentEnd = b.agreementEndDate ? new Date(b.agreementEndDate) : new Date('2026-11-05');
          const nextEnd = new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000);
          const nextEndStr = nextEnd.toISOString().split('T')[0];
          return {
            ...b,
            status: 'Active',
            lateFee: 0,
            agreementEndDate: nextEndStr,
          };
        }
        return b;
      })
    );
    triggerNotification('Brand agreement successfully renewed for 30 days. Penalties cleared.', 'success');
  };

  const handleSendRenewalReminders = (brandNames: string[]) => {
    triggerNotification(
      `Contract Expiry Notices sent via WhatsApp & Email to founders of: ${brandNames.join(', ')}.`,
      'info'
    );
  };

  const handleConfirmVacate = (brandId: string, advanceNoticeDays: number) => {
    const { shortNoticeDays, fee } = calculateShortNoticePenalty(advanceNoticeDays);

    setBrands((prev) =>
      prev.map((b) => {
        if (b.id === brandId) {
          return {
            ...b,
            status: 'Discontinued',
            shortNoticeDays,
            emergencyRemovalFee: fee,
            noticeDate: new Date().toISOString().split('T')[0],
          };
        }
        return b;
      })
    );

    triggerNotification(
      `Discontinuation processed. ${
        shortNoticeDays > 0 ? `Short notice surcharge of ₹${fee} added.` : 'Standard clearance scheduled.'
      }`,
      shortNoticeDays > 0 ? 'warning' : 'info'
    );
  };

  // --- INLINE INVENTORY ADJUSTMENTS ---
  const handleAdjustStock = (brandId: string, delta: number) => {
    setBrands((prev) =>
      prev.map((b) => {
        if (b.id === brandId) {
          const nextStock = Math.max(0, b.stockOnHand + delta);
          // If delta is negative, count as an instant physical point-of-sale
          const nextSales = delta < 0 ? b.unitsSoldWeekly + 1 : b.unitsSoldWeekly;
          return {
            ...b,
            stockOnHand: nextStock,
            unitsSoldWeekly: nextSales,
          };
        }
        return b;
      })
    );
  };

  // --- TICKET ACTIONS ---
  const handleUpdateTicketStatus = (ticketId: string, newStatus: TicketStatus) => {
    setTickets((prev) =>
      prev.map((item) => (item.id === ticketId ? { ...item, status: newStatus } : item))
    );
    triggerNotification(`Ticket ${ticketId} marked as ${newStatus}`, 'info');
  };

  const handleToggleActionable = (ticketId: string, actionableId: number) => {
    setTickets((prev) =>
      prev.map((tk) => {
        if (tk.id === ticketId) {
          return {
            ...tk,
            actionables: tk.actionables.map((a) =>
              a.id === actionableId ? { ...a, done: !a.done } : a
            ),
          };
        }
        return tk;
      })
    );
  };

  const handleAddTicketNote = (ticketId: string, noteText: string) => {
    setTickets((prev) =>
      prev.map((tk) => {
        if (tk.id === ticketId) {
          return {
            ...tk,
            notes: [
              ...tk.notes,
              {
                id: Date.now(),
                author: 'Current Staff',
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                text: noteText,
              },
            ],
          };
        }
        return tk;
      })
    );
  };

  // --- FILTERED BRANDS ---
  const filteredBrands = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return brands;
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.slotId.toLowerCase().includes(q)
    );
  }, [brands, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/50 via-white to-rose-50/30 text-slate-800 flex flex-col font-sans selection:bg-pink-200 selection:text-pink-900">
      {/* Toast Notification */}
      <NotificationToast notification={notification} onClose={() => setNotification(null)} />

      {/* Main App Header */}
      <Header
        currentTime={currentTime}
        onRunPenaltyCheck={handleRunPenaltyCheck}
        onOpenAddBrand={() => setIsAddBrandOpen(true)}
        onOpenNewTicket={() => setIsNewTicketOpen(true)}
      />

      {/* Real-time Metric Strip */}
      <MetricStrip metrics={metrics} />

      {/* Navigation Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        overdueCount={metrics.overdueCount}
        lowStockCount={metrics.lowStockCount}
        openTicketCount={tickets.filter((t) => t.status !== 'Resolved').length}
      />

      {/* Main Tab Views with AnimatePresence */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === 'renewals' && (
            <RenewalsTab
              key="renewals"
              brands={brands}
              filteredBrands={filteredBrands}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onRenewBrand={handleRenewBrand}
              onOpenVacateModal={setVacateBrand}
              onOpenInvoiceModal={setInvoiceBrand}
              onSendRenewalReminders={handleSendRenewalReminders}
            />
          )}

          {activeTab === 'sales' && (
            <SalesInventoryTab
              key="sales"
              brands={brands}
              filteredBrands={filteredBrands}
              totalGMV={metrics.totalGMV}
              lowStockCount={metrics.lowStockCount}
              onAdjustStock={handleAdjustStock}
            />
          )}

          {activeTab === 'tickets' && (
            <TicketsTab
              key="tickets"
              tickets={tickets}
              onOpenNewTicket={() => setIsNewTicketOpen(true)}
              onUpdateTicketStatus={handleUpdateTicketStatus}
              onToggleActionable={handleToggleActionable}
              onAddTicketNote={handleAddTicketNote}
            />
          )}

          {activeTab === 'barcode' && (
            <BarcodePrinterTab
              key="barcode"
              brands={brands}
              onTriggerNotification={triggerNotification}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <ZohoInvoiceModal
        brand={invoiceBrand}
        onClose={() => setInvoiceBrand(null)}
        onPushToZoho={(brand) => {
          triggerNotification(
            `Invoice #ALT-INV-2026-${brand.id.replace('BRD-', '')} pushed directly to Zoho Books!`,
            'success'
          );
          setInvoiceBrand(null);
        }}
      />

      <VacateModal
        brand={vacateBrand}
        onClose={() => setVacateBrand(null)}
        onConfirmVacate={handleConfirmVacate}
      />

      <AddBrandModal
        isOpen={isAddBrandOpen}
        existingCount={brands.length}
        onClose={() => setIsAddBrandOpen(false)}
        onAddBrand={(newBrand) => {
          setBrands((prev) => [...prev, newBrand]);
          triggerNotification(`Brand "${newBrand.name}" boarded to slot ${newBrand.slotId}`, 'success');
        }}
      />

      <NewTicketModal
        isOpen={isNewTicketOpen}
        brands={brands}
        existingTicketsCount={tickets.length}
        onClose={() => setIsNewTicketOpen(false)}
        onCreateTicket={(newTicket) => {
          setTickets((prev) => [newTicket, ...prev]);
          triggerNotification(`Support Ticket ${newTicket.id} issued to ${newTicket.assignee}`, 'info');
        }}
      />

      {/* App Footer */}
      <footer className="border-t border-pink-100 bg-white/70 backdrop-blur-xs py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Alt.Tribe Retail Technologies • Baby Pink & White Edition v3.5</span>
          <span className="font-mono text-pink-700 font-medium">Bangalore Store #01 • Indian Rupee (INR) Enforced</span>
        </div>
      </footer>
    </div>
  );
}
