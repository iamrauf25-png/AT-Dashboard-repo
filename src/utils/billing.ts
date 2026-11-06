import { Brand, SettlementBreakdown, ContractExpiryInfo, ExpiryUrgency } from '../types/index';

/**
 * Parses YYYY-MM-DD cleanly into local midnight Date avoiding UTC shift
 */
export const parseLocalDate = (dateStr: string): Date => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
};

/**
 * Calculates calendar days between two dates (to - from)
 */
export const calculateDaysBetween = (from: Date, to: Date): number => {
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  const diffMs = toMidnight.getTime() - fromMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Computes contract expiry metrics for a brand.
 * Flags brands with less than 7 days remaining in their current agreement cycle.
 */
export const getContractExpiryInfo = (
  brand: Pick<Brand, 'agreementEndDate' | 'agreementStartDate' | 'renewalDeadlineDay'>,
  referenceDate: Date = new Date('2026-11-05T00:00:00')
): ContractExpiryInfo => {
  let endDate: Date;
  if (brand.agreementEndDate) {
    endDate = parseLocalDate(brand.agreementEndDate);
  } else {
    // Default to renewalDeadlineDay of the reference month
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const day = brand.renewalDeadlineDay || 24;
    endDate = new Date(year, month, day);
  }

  const daysRemaining = calculateDaysBetween(referenceDate, endDate);
  const isExpired = daysRemaining < 0;
  const isExpiringSoon = daysRemaining >= 0 && daysRemaining < 7;

  let urgency: ExpiryUrgency;
  let urgencyLabel: string;

  if (isExpired) {
    urgency = 'expired';
    urgencyLabel = `Expired (${Math.abs(daysRemaining)}d ago)`;
  } else if (daysRemaining <= 2) {
    urgency = 'critical';
    urgencyLabel = `Critical: ${daysRemaining}d left`;
  } else if (daysRemaining < 7) {
    urgency = 'warning';
    urgencyLabel = `Expiring Soon: ${daysRemaining}d left`;
  } else {
    urgency = 'safe';
    urgencyLabel = `${daysRemaining} days remaining`;
  }

  // 30-day agreement cycle progress percentage
  const totalCycleDays = 30;
  const daysElapsed = Math.max(0, Math.min(totalCycleDays, totalCycleDays - daysRemaining));
  const progressPercent = Math.min(100, Math.max(0, Math.round((daysElapsed / totalCycleDays) * 100)));

  const formattedDate = endDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return {
    daysRemaining,
    isExpiringSoon,
    isExpired,
    formattedDate,
    urgency,
    urgencyLabel,
    progressPercent,
  };
};

/**
 * Format currency amounts in Indian Rupees (INR) with standard en-IN formatting
 */
export const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(val) ? val : 0);
};

/**
 * Calculate total penalty accrued by a brand
 */
export const calculateTotalPenalty = (brand: Pick<Brand, 'lateFee' | 'emergencyRemovalFee'>): number => {
  return (brand.lateFee || 0) + (brand.emergencyRemovalFee || 0);
};

/**
 * Alt.Tribe policy: Minimum 2 days notice required for slot discontinuation.
 * Short notice fee is ₹250 per day short.
 */
export const calculateShortNoticePenalty = (
  noticeDaysGiven: number,
  minNoticeRequired = 2,
  dailyPenalty = 250
): { shortNoticeDays: number; fee: number } => {
  const parsed = Math.max(0, Math.floor(noticeDaysGiven));
  if (parsed < minNoticeRequired) {
    const shortDays = minNoticeRequired - parsed;
    return {
      shortNoticeDays: shortDays,
      fee: shortDays * dailyPenalty,
    };
  }
  return {
    shortNoticeDays: 0,
    fee: 0,
  };
};

/**
 * Toggles or sets the autoRenew boolean flag for a specific brand ID.
 */
export const toggleBrandAutoRenew = (
  brands: Brand[],
  brandId: string,
  explicitValue?: boolean
): { updatedBrands: Brand[]; updatedBrand?: Brand } => {
  let updatedBrand: Brand | undefined;
  const updatedBrands = brands.map((b) => {
    if (b.id === brandId) {
      const nextAutoRenew = explicitValue !== undefined ? explicitValue : !Boolean(b.autoRenew);
      updatedBrand = {
        ...b,
        autoRenew: nextAutoRenew,
      };
      return updatedBrand;
    }
    return b;
  });
  return { updatedBrands, updatedBrand };
};

/**
 * Processes automated renewals for all eligible brands that have `autoRenew: true`
 * and are either Overdue, in Grace Period, Expired, or Expiring within 7 days.
 */
export const processAutoRenewals = (
  brands: Brand[],
  referenceDate: Date = new Date('2026-11-05T00:00:00')
): { updatedBrands: Brand[]; renewedBrandNames: string[] } => {
  const renewedBrandNames: string[] = [];

  const updatedBrands = brands.map((b) => {
    if (!b.autoRenew || b.status === 'Discontinued' || b.status === 'Notice Served') {
      return b;
    }

    const expiryInfo = getContractExpiryInfo(b, referenceDate);
    const needsRenewal =
      b.status === 'Overdue' ||
      b.status === 'Grace Period' ||
      expiryInfo.isExpiringSoon ||
      expiryInfo.isExpired;

    if (needsRenewal) {
      const currentEnd = b.agreementEndDate ? parseLocalDate(b.agreementEndDate) : referenceDate;
      const baseDate = currentEnd < referenceDate ? referenceDate : currentEnd;
      const nextEnd = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const yyyy = nextEnd.getFullYear();
      const mm = String(nextEnd.getMonth() + 1).padStart(2, '0');
      const dd = String(nextEnd.getDate()).padStart(2, '0');
      const nextEndStr = `${yyyy}-${mm}-${dd}`;

      renewedBrandNames.push(b.name);
      return {
        ...b,
        status: 'Active' as const,
        lateFee: 0,
        agreementEndDate: nextEndStr,
      };
    }

    return b;
  });

  return { updatedBrands, renewedBrandNames };
};

/**
 * Evaluates brands against the 24th cutoff monthly rule.
 * - If a brand in Overdue or Grace Period has `autoRenew: true`, it automatically renews for 30 days with 0 penalty.
 * - Otherwise, if status is Overdue or Grace Period, applies ₹250 penalty flag if not already charged.
 */
export const evaluate24thRenewalAudit = (
  brands: Brand[]
): { updatedBrands: Brand[]; newPenaltyCount: number; autoRenewedCount: number } => {
  let newPenaltyCount = 0;
  let autoRenewedCount = 0;
  const updatedBrands = brands.map((b) => {
    if (b.status === 'Overdue' || b.status === 'Grace Period') {
      if (b.autoRenew) {
        autoRenewedCount++;
        const currentEnd = b.agreementEndDate
          ? parseLocalDate(b.agreementEndDate)
          : new Date(2026, 10, 5);
        const nextEnd = new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000);
        const yyyy = nextEnd.getFullYear();
        const mm = String(nextEnd.getMonth() + 1).padStart(2, '0');
        const dd = String(nextEnd.getDate()).padStart(2, '0');
        return {
          ...b,
          status: 'Active' as const,
          lateFee: 0,
          agreementEndDate: `${yyyy}-${mm}-${dd}`,
        };
      }

      const isFirstTimePenalty = b.lateFee === 0;
      if (isFirstTimePenalty) {
        newPenaltyCount++;
      }
      return {
        ...b,
        status: 'Overdue' as const,
        lateFee: isFirstTimePenalty ? 250 : b.lateFee,
      };
    }
    return b;
  });

  return { updatedBrands, newPenaltyCount, autoRenewedCount };
};

/**
 * Calculate complete Zoho Books settlement breakdown:
 * - Fixed Space Rent
 * - Late renewal penalties
 * - Short notice removal surcharges
 * - 18% GST on Space & Penalty Services
 * - Store Sales Offset (concession commission deduction)
 * - Net Settlement Balance (Alt.Tribe pays brand vs brand owes Alt.Tribe)
 */
export const calculateZohoSettlement = (
  brand: Brand,
  gstRate = 0.18
): SettlementBreakdown => {
  const baseRent = brand.monthlyRent || 0;
  const lateFee = brand.lateFee || 0;
  const emergencyRemovalFee = brand.emergencyRemovalFee || 0;
  const subtotalAltCharges = baseRent + lateFee + emergencyRemovalFee;
  const gstAmount = subtotalAltCharges * gstRate;
  const totalAltPayable = subtotalAltCharges + gstAmount;

  const grossSales = (brand.unitsSoldWeekly || 0) * (brand.unitPrice || 0);
  const commissionRate = brand.commissionRate ?? 0.15;
  const commissionAmount = grossSales * commissionRate;
  const netBrandPayout = grossSales - commissionAmount;

  const finalSettlementBalance = netBrandPayout - totalAltPayable;

  return {
    baseRent,
    lateFee,
    emergencyRemovalFee,
    subtotalAltCharges,
    gstRate,
    gstAmount,
    totalAltPayable,
    grossSales,
    commissionRate,
    commissionAmount,
    netBrandPayout,
    finalSettlementBalance,
  };
};
