import { Brand, Ticket } from '../types/index';

/**
 * Computes next unique Brand ID (e.g. BRD-08, BRD-09) by inspecting all existing IDs.
 * Guarantees no collisions even when brands are added concurrently.
 */
export function generateNextBrandId(brands: Brand[]): string {
  const ids = brands
    .map((b) => {
      const match = b.id.match(/BRD-(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));
  const max = ids.length > 0 ? Math.max(...ids) : 0;
  const next = max + 1;
  return `BRD-${next.toString().padStart(2, '0')}`;
}

/**
 * Computes next unique Ticket ID (e.g. ALT-TK-104) by inspecting all existing ticket IDs.
 */
export function generateNextTicketId(tickets: Ticket[]): string {
  const ids = tickets
    .map((t) => {
      const match = t.id.match(/ALT-TK-(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));
  const max = ids.length > 0 ? Math.max(...ids) : 100;
  const next = Math.max(max + 1, 101);
  return `ALT-TK-${next}`;
}

/**
 * Idempotently merges a brand into the brands array.
 * If brand already exists by ID, updates it in place.
 * If brand is new, appends it.
 */
export function mergeBrand(brands: Brand[], brandToMerge: Brand): Brand[] {
  const index = brands.findIndex((b) => b.id === brandToMerge.id);
  if (index >= 0) {
    const updated = [...brands];
    updated[index] = { ...updated[index], ...brandToMerge };
    return updated;
  }
  return [...brands, brandToMerge];
}

/**
 * Idempotently merges a ticket into the tickets array.
 * If ticket exists by ID, updates it in place.
 * If ticket is new, prepends it to the top.
 */
export function mergeTicket(tickets: Ticket[], ticketToMerge: Ticket): Ticket[] {
  const index = tickets.findIndex((t) => t.id === ticketToMerge.id);
  if (index >= 0) {
    const updated = [...tickets];
    updated[index] = { ...updated[index], ...ticketToMerge };
    return updated;
  }
  return [ticketToMerge, ...tickets];
}

/**
 * Applies physical stock delta:
 * - Minimum stock is 0 (no negative inventory)
 * - Decrementing stock records an instant point-of-sale (+1 weekly units sold)
 */
export function applyStockDelta(
  brand: Brand,
  delta: number
): { stockOnHand: number; unitsSoldWeekly: number } {
  const nextStock = Math.max(0, brand.stockOnHand + delta);
  const nextSales = delta < 0 ? (brand.unitsSoldWeekly || 0) + 1 : brand.unitsSoldWeekly || 0;
  return {
    stockOnHand: nextStock,
    unitsSoldWeekly: nextSales,
  };
}
