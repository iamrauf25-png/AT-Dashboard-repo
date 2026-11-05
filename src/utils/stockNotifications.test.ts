import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isBelowLowStockThreshold,
  shouldTriggerStockAlert,
  buildStockNotificationPayload,
  LOW_STOCK_ALERT_THRESHOLD,
} from './stockNotifications';
import { Brand } from '../types/index';

const mockBrand: Brand = {
  id: 'BRD-02',
  name: 'Veda Earth Botanicals',
  category: 'Organic Skincare',
  slotId: 'Aisle S-02',
  monthlyRent: 6500,
  renewalDeadlineDay: 24,
  status: 'Active',
  lateFee: 0,
  shortNoticeDays: 0,
  emergencyRemovalFee: 0,
  unitsSoldWeekly: 40,
  stockOnHand: 4,
  unitPrice: 920,
  commissionRate: 0.18,
  noticeDate: null,
  contactPerson: 'Dr. Nikhil Rao',
  contactEmail: 'nikhil@vedaearth.co',
  gstin: '29FGHIJ5678K2Z3',
};

test('threshold is set to 3 units', () => {
  assert.equal(LOW_STOCK_ALERT_THRESHOLD, 3);
});

test('isBelowLowStockThreshold correctly evaluates numbers', () => {
  assert.equal(isBelowLowStockThreshold(0), true);
  assert.equal(isBelowLowStockThreshold(1), true);
  assert.equal(isBelowLowStockThreshold(2), true);
  assert.equal(isBelowLowStockThreshold(3), false);
  assert.equal(isBelowLowStockThreshold(4), false);
  assert.equal(isBelowLowStockThreshold(10), false);
});

test('shouldTriggerStockAlert triggers only when crossing threshold downwards', () => {
  // 3 -> 2: crossed downwards below 3
  assert.equal(shouldTriggerStockAlert(3, 2), true);

  // 4 -> 2: crossed downwards below 3
  assert.equal(shouldTriggerStockAlert(4, 2), true);

  // 2 -> 1: already below 3, does not trigger initial alert transition
  assert.equal(shouldTriggerStockAlert(2, 1), false);

  // 2 -> 7: restocked upwards, does not trigger alert
  assert.equal(shouldTriggerStockAlert(2, 7), false);

  // 5 -> 4: still above threshold
  assert.equal(shouldTriggerStockAlert(5, 4), false);
});

test('buildStockNotificationPayload formats clear brand and bay details', () => {
  const payload = buildStockNotificationPayload(mockBrand, 2);
  assert.equal(payload.title, '⚠️ Low Stock Alert: Veda Earth Botanicals');
  assert.ok(payload.body.includes('Aisle S-02'));
  assert.ok(payload.body.includes('2 units'));
  assert.equal(payload.tag, 'low-stock-BRD-02-2');

  const zeroPayload = buildStockNotificationPayload(mockBrand, 0);
  assert.ok(zeroPayload.body.includes('0 units (OUT OF STOCK)'));
});
