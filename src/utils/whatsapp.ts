import { Brand } from '../types/index';
import { calculateTotalPenalty, getContractExpiryInfo, formatINR } from './billing';

/**
 * Sanitizes an Indian / international phone number for the wa.me protocol:
 * - Strips all non-digit characters (+, spaces, hyphens)
 * - If 10 digits (Indian mobile), prepends '91' country code
 * - Defaults to store ops fallback if empty
 */
export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return '919880123456';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits || '919880123456';
}

/**
 * Formats a clean, executive WhatsApp message to the brand founder
 * with their live contract status, agreement cycle, penalties, and stock.
 */
export function formatBrandWhatsAppMessage(
  brand: Brand,
  referenceDate: Date = new Date('2026-11-05T00:00:00')
): string {
  const expiry = getContractExpiryInfo(brand, referenceDate);
  const totalPenalties = calculateTotalPenalty(brand);
  const contactName = brand.contactPerson || 'Founder';

  let statusCallout = '';
  if (brand.status === 'Overdue') {
    statusCallout = `⚠️ *URGENT ACTION REQUIRED*: Your contract renewal is past due. Please clear the pending renewal and ₹250 penalty to prevent bay reallocation.`;
  } else if (expiry.isExpiringSoon) {
    statusCallout = `⚠️ *RENEWAL NOTICE*: Your agreement cycle expires in ${expiry.daysRemaining} days (${expiry.formattedDate}). Please confirm your 30-day renewal cycle before the cutoff.`;
  } else if (brand.status === 'Notice Served') {
    statusCallout = `ℹ️ *SLOT CLEARANCE*: Notice of discontinuation logged. Please coordinate bay handover with floor operations.`;
  } else if (brand.status === 'Discontinued') {
    statusCallout = `ℹ️ *ACCOUNT CLOSED*: Concession agreement concluded for bay ${brand.slotId}.`;
  } else {
    statusCallout = `✅ *GOOD STANDING*: Your concession agreement is active and in good standing.`;
  }

  const penaltyBreakdown =
    totalPenalties > 0
      ? `• Penalties Accrued: ₹${totalPenalties} (Late: ₹${brand.lateFee || 0}, Short Notice: ₹${
          brand.emergencyRemovalFee || 0
        })`
      : `• Penalties Accrued: ₹0 (Clean)`;

  return (
    `Hi ${contactName}, greetings from *Alt.Tribe Retail Ops*!\n\n` +
    `Here is the live contract status update for *${brand.name}*:\n` +
    `• Floor Bay / Slot: ${brand.slotId}\n` +
    `• Agreement Status: *${brand.status}*\n` +
    `• Cycle End Date: ${expiry.formattedDate} (${
      brand.status === 'Discontinued'
        ? 'Concluded'
        : expiry.isExpired
        ? `Expired ${Math.abs(expiry.daysRemaining)}d ago`
        : `${expiry.daysRemaining} days remaining`
    })\n` +
    `• Monthly Base Rent: ${formatINR(brand.monthlyRent)}\n` +
    `${penaltyBreakdown}\n` +
    `• Bay Stock on Display: ${brand.stockOnHand} units\n\n` +
    `${statusCallout}\n\n` +
    `For queries or immediate payment settlement, please reply directly to this thread.\n\n` +
    `Best regards,\n` +
    `*Alt.Tribe Retail Ops Team*\n` +
    `Bangalore Concept Store #01`
  );
}

/**
 * Builds the complete pre-filled WhatsApp click-to-chat URL.
 */
export function getBrandWhatsAppUrl(
  brand: Brand,
  referenceDate: Date = new Date('2026-11-05T00:00:00')
): string {
  const phone = cleanPhoneNumber(brand.contactPhone);
  const text = formatBrandWhatsAppMessage(brand, referenceDate);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
