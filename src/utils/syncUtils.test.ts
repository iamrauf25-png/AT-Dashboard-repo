import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateNextBrandId,
  generateNextTicketId,
  mergeBrand,
  mergeTicket,
  applyStockDelta,
} from './syncUtils';
import { Brand, Ticket } from '../types/index';

const sampleBrands: Brand[] = [
  {
    id: 'BRD-01',
    name: 'Brand One',
    category: 'Craft',
    slotId: 'Shelf A',
    monthlyRent: 7000,
    renewalDeadlineDay: 24,
    status: 'Active',
    lateFee: 0,
    shortNoticeDays: 0,
    emergencyRemovalFee: 0,
    unitsSoldWeekly: 10,
    stockOnHand: 5,
    unitPrice: 1000,
    commissionRate: 0.15,
    noticeDate: null,
    contactPerson: 'Alice',
    contactEmail: 'alice@test.com',
    gstin: '29ABC1234',
  },
  {
    id: 'BRD-07',
    name: 'Brand Seven',
    category: 'Food',
    slotId: 'Shelf B',
    monthlyRent: 6500,
    renewalDeadlineDay: 24,
    status: 'Active',
    lateFee: 0,
    shortNoticeDays: 0,
    emergencyRemovalFee: 0,
    unitsSoldWeekly: 20,
    stockOnHand: 15,
    unitPrice: 500,
    commissionRate: 0.1,
    noticeDate: null,
    contactPerson: 'Bob',
    contactEmail: 'bob@test.com',
    gstin: '29XYZ5678',
  },
];

const sampleTickets: Ticket[] = [
  {
    id: 'ALT-TK-101',
    brandId: 'BRD-01',
    brandName: 'Brand One',
    category: 'Display Maintenance',
    urgency: 'Medium',
    subject: 'Light broken',
    assignee: 'Vikram',
    status: 'Open',
    createdDate: '01 Nov 2026',
    actionables: [{ id: 1, text: 'Fix bulb', done: false }],
    notes: [],
  },
];

test('generateNextBrandId correctly calculates next sequential ID', () => {
  assert.equal(generateNextBrandId(sampleBrands), 'BRD-08');
  assert.equal(generateNextBrandId([]), 'BRD-01');
});

test('generateNextTicketId correctly calculates next sequential ID', () => {
  assert.equal(generateNextTicketId(sampleTickets), 'ALT-TK-102');
  assert.equal(generateNextTicketId([]), 'ALT-TK-101');
});

test('mergeBrand idempotently updates existing and appends new brand', () => {
  // Update existing
  const updated = mergeBrand(sampleBrands, {
    ...sampleBrands[0],
    name: 'Brand One Updated',
    stockOnHand: 22,
  });
  assert.equal(updated.length, 2);
  assert.equal(updated[0].name, 'Brand One Updated');
  assert.equal(updated[0].stockOnHand, 22);

  // Append new
  const appended = mergeBrand(sampleBrands, {
    ...sampleBrands[0],
    id: 'BRD-08',
    name: 'Brand Eight',
  });
  assert.equal(appended.length, 3);
  assert.equal(appended[2].id, 'BRD-08');
});

test('mergeTicket idempotently updates existing and prepends new ticket', () => {
  // Update existing
  const updated = mergeTicket(sampleTickets, {
    ...sampleTickets[0],
    status: 'Resolved',
  });
  assert.equal(updated.length, 1);
  assert.equal(updated[0].status, 'Resolved');

  // Prepend new
  const prepended = mergeTicket(sampleTickets, {
    ...sampleTickets[0],
    id: 'ALT-TK-102',
    subject: 'New Issue',
  });
  assert.equal(prepended.length, 2);
  assert.equal(prepended[0].id, 'ALT-TK-102');
});

test('applyStockDelta adjusts stockOnHand and unitsSoldWeekly properly', () => {
  const resultSale = applyStockDelta(sampleBrands[0], -1);
  assert.equal(resultSale.stockOnHand, 4);
  assert.equal(resultSale.unitsSoldWeekly, 11);

  const resultRestock = applyStockDelta(sampleBrands[0], 10);
  assert.equal(resultRestock.stockOnHand, 15);
  assert.equal(resultRestock.unitsSoldWeekly, 10);

  // Clamps at 0
  const resultDeplete = applyStockDelta(sampleBrands[0], -999);
  assert.equal(resultDeplete.stockOnHand, 0);
  assert.equal(resultDeplete.unitsSoldWeekly, 11);
});
