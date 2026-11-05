import { Brand } from '../types/index';

export const LOW_STOCK_ALERT_THRESHOLD = 3;

/**
 * Checks if a given stock level is below the critical alert threshold (< 3 units).
 */
export function isBelowLowStockThreshold(stock: number): boolean {
  return stock < LOW_STOCK_ALERT_THRESHOLD;
}

/**
 * Determines whether a stock level transition should trigger an alert.
 * Triggers when stock transitions from at/above threshold to below threshold.
 */
export function shouldTriggerStockAlert(previousStock: number, currentStock: number): boolean {
  return previousStock >= LOW_STOCK_ALERT_THRESHOLD && currentStock < LOW_STOCK_ALERT_THRESHOLD;
}

/**
 * Builds the notification title and options for a low stock alert.
 */
export function buildStockNotificationPayload(
  brand: Brand,
  stockLevel: number
): { title: string; body: string; tag: string } {
  const countStr =
    stockLevel === 0 ? '0 units (OUT OF STOCK)' : `${stockLevel} unit${stockLevel === 1 ? '' : 's'}`;
  return {
    title: `⚠️ Low Stock Alert: ${brand.name}`,
    body: `Bay ${brand.slotId} has only ${countStr} remaining. Urgent replenishment required!`,
    tag: `low-stock-${brand.id}-${stockLevel}`,
  };
}

/**
 * Dispatches a native HTML5 browser notification if permission is granted.
 * Safely guards against SSR environments and unsupported browsers.
 */
export function sendBrowserStockNotification(brand: Brand, stockLevel: number): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    try {
      const payload = buildStockNotificationPayload(brand, stockLevel);
      new Notification(payload.title, {
        body: payload.body,
        tag: payload.tag,
      });
      return true;
    } catch (err) {
      console.warn('[Notification] Could not display browser notification:', err);
      return false;
    }
  }

  return false;
}
