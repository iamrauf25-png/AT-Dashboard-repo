export type BrandStatus = 'Active' | 'Grace Period' | 'Overdue' | 'Notice Served' | 'Discontinued';

export interface Brand {
  id: string;
  name: string;
  category: string;
  slotId: string;
  monthlyRent: number;
  renewalDeadlineDay: number;
  status: BrandStatus;
  lateFee: number;
  shortNoticeDays: number;
  emergencyRemovalFee: number;
  unitsSoldWeekly: number;
  stockOnHand: number;
  unitPrice: number;
  commissionRate: number;
  noticeDate: string | null;
  agreementStartDate?: string;
  agreementEndDate?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string;
  gstin: string;
  autoRenew?: boolean;
}

export type ExpiryUrgency = 'safe' | 'warning' | 'critical' | 'expired';

export interface ContractExpiryInfo {
  daysRemaining: number;
  isExpiringSoon: boolean; // < 7 days && >= 0
  isExpired: boolean; // < 0
  formattedDate: string;
  urgency: ExpiryUrgency;
  urgencyLabel: string;
  progressPercent: number;
}

export type TicketUrgency = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved';
export type TicketCategory =
  | 'Display Maintenance'
  | 'Rent/Billing'
  | 'Restock Discrepancy'
  | 'Damage/Loss';

export interface TicketActionable {
  id: number;
  text: string;
  done: boolean;
}

export interface TicketNote {
  id: number;
  author: string;
  time: string;
  text: string;
}

export interface Ticket {
  id: string;
  brandId: string;
  brandName: string;
  category: TicketCategory;
  urgency: TicketUrgency;
  subject: string;
  assignee: string;
  status: TicketStatus;
  createdDate: string;
  actionables: TicketActionable[];
  notes: TicketNote[];
}

export interface NotificationState {
  text: string;
  type: 'info' | 'success' | 'warning';
}

export type TabType = 'renewals' | 'sales' | 'tickets' | 'barcode';

export type LabelPreset = 'shelf-50x30' | 'jewel-35x20' | 'apparel-60x40' | 'carton-70x50';
export type BarcodeType = 'code128' | 'qr' | 'dual';

export interface SettlementBreakdown {
  baseRent: number;
  lateFee: number;
  emergencyRemovalFee: number;
  subtotalAltCharges: number;
  gstRate: number;
  gstAmount: number;
  totalAltPayable: number;
  grossSales: number;
  commissionRate: number;
  commissionAmount: number;
  netBrandPayout: number;
  finalSettlementBalance: number; // positive = Alt.Tribe pays brand, negative = brand owes Alt.Tribe
}
