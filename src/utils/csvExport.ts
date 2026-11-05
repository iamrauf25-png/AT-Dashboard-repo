import { Brand } from '../types/index';
import { calculateTotalPenalty, getContractExpiryInfo } from './billing';

/**
 * Escapes a single CSV field following RFC 4180:
 * Encloses in quotes if the string contains commas, quotes, or newlines,
 * and escapes double quotes by doubling them ("").
 */
export function escapeCSVCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates an RFC 4180-compliant CSV string for the given brands list.
 */
export function generateBrandsCSV(
  brands: Brand[],
  referenceDate: Date = new Date('2026-11-05T00:00:00')
): string {
  const headers = [
    'Brand ID',
    'Brand Name',
    'Category',
    'Bay / Slot ID',
    'Status',
    'Monthly Base Rent (INR)',
    'Commission Rate (%)',
    'Agreement Start Date',
    'Agreement End Date',
    'Days Until Expiry',
    'Expiry Status',
    'Late Fee (INR)',
    'Emergency Removal Fee (INR)',
    'Total Penalties Accrued (INR)',
    'Stock On Hand (Units)',
    'Weekly Units Sold',
    'Unit Retail Price (INR)',
    'Weekly GMV (INR)',
    'Founder / Contact Person',
    'Contact Email',
    'GSTIN',
    'Discontinuation Notice Date',
    'Short Notice Days',
  ];

  const rows = brands.map((b) => {
    const expiry = getContractExpiryInfo(b, referenceDate);
    const totalPenalties = calculateTotalPenalty(b);
    const gmv = (b.unitsSoldWeekly || 0) * (b.unitPrice || 0);
    const commPct = Math.round((b.commissionRate || 0) * 100);

    return [
      b.id,
      b.name,
      b.category,
      b.slotId,
      b.status,
      b.monthlyRent,
      `${commPct}%`,
      b.agreementStartDate || '',
      b.agreementEndDate || '',
      b.status === 'Discontinued' ? 'N/A' : expiry.daysRemaining,
      b.status === 'Discontinued' ? 'Discontinued' : expiry.urgencyLabel,
      b.lateFee || 0,
      b.emergencyRemovalFee || 0,
      totalPenalties,
      b.stockOnHand,
      b.unitsSoldWeekly,
      b.unitPrice,
      gmv,
      b.contactPerson,
      b.contactEmail,
      b.gstin,
      b.noticeDate || '',
      b.shortNoticeDays || 0,
    ].map(escapeCSVCell);
  });

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Triggers a client-side download of the CSV content.
 * Adds UTF-8 BOM so Excel and spreadsheet applications display characters properly.
 */
export function downloadCSV(csvContent: string, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
