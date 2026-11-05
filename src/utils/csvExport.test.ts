import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeCSVCell, generateBrandsCSV } from './csvExport';
import { Brand } from '../types/index';

const testBrands: Brand[] = [
  {
    id: 'BRD-01',
    name: 'KalaKriti Ceramics',
    category: 'Craft Ceramics',
    slotId: 'Shelf C-04',
    monthlyRent: 7200,
    renewalDeadlineDay: 24,
    agreementStartDate: '2026-10-25',
    agreementEndDate: '2026-11-24',
    status: 'Active',
    lateFee: 0,
    shortNoticeDays: 0,
    emergencyRemovalFee: 0,
    unitsSoldWeekly: 26,
    stockOnHand: 18,
    unitPrice: 1850,
    commissionRate: 0.15,
    noticeDate: null,
    contactPerson: 'Aditi Sharma',
    contactEmail: 'aditi@kalakriti.in',
    gstin: '29ABCDE1234F1Z5',
  },
  {
    id: 'BRD-05',
    name: 'Mitti Soul, "Footwear"',
    category: 'Vegan Footwear',
    slotId: 'Pod W-09',
    monthlyRent: 7500,
    renewalDeadlineDay: 24,
    agreementStartDate: '2026-10-04',
    agreementEndDate: '2026-11-03',
    status: 'Notice Served',
    lateFee: 0,
    shortNoticeDays: 1,
    emergencyRemovalFee: 250,
    unitsSoldWeekly: 14,
    stockOnHand: 7,
    unitPrice: 2900,
    commissionRate: 0.15,
    noticeDate: '2026-11-03',
    contactPerson: 'Saurabh Jain',
    contactEmail: 'saurabh@mittisoul.in',
    gstin: '29WXYZ7890A5Z1',
  },
];

test('escapeCSVCell properly escapes special characters and quotes', () => {
  assert.equal(escapeCSVCell('hello'), 'hello');
  assert.equal(escapeCSVCell(''), '');
  assert.equal(escapeCSVCell(null), '');
  assert.equal(escapeCSVCell(123), '123');
  assert.equal(escapeCSVCell('hello, world'), '"hello, world"');
  assert.equal(escapeCSVCell('say "hi"'), '"say ""hi"""');
  assert.equal(escapeCSVCell('line1\nline2'), '"line1\nline2"');
});

test('generateBrandsCSV produces valid CSV with headers and escaped fields', () => {
  const csv = generateBrandsCSV(testBrands, new Date('2026-11-05T00:00:00'));
  const lines = csv.split('\r\n');

  assert.equal(lines.length, 3); // Header + 2 brand rows

  // Check header line contains critical columns
  const header = lines[0];
  assert.ok(header.includes('Brand ID'));
  assert.ok(header.includes('Brand Name'));
  assert.ok(header.includes('Monthly Base Rent (INR)'));
  assert.ok(header.includes('Weekly GMV (INR)'));
  assert.ok(header.includes('Total Penalties Accrued (INR)'));

  // Check first brand row values
  const row1 = lines[1];
  assert.ok(row1.includes('BRD-01'));
  assert.ok(row1.includes('KalaKriti Ceramics'));
  assert.ok(row1.includes('7200'));
  assert.ok(row1.includes('48100')); // 26 * 1850 = 48100 GMV

  // Check second brand row with commas and quotes in name
  const row2 = lines[2];
  assert.ok(row2.includes('BRD-05'));
  assert.ok(row2.includes('"Mitti Soul, ""Footwear"""'));
  assert.ok(row2.includes('250')); // emergencyRemovalFee
});
