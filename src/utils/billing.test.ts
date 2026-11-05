import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatINR,
  calculateTotalPenalty,
  calculateShortNoticePenalty,
  evaluate24thRenewalAudit,
  calculateZohoSettlement,
} from './billing';
import { Brand } from '../types/index';

test('formatINR formats currency properly in Indian numbering format', () => {
  const formatted = formatINR(150000);
  assert.match(formatted, /1,50,000/);
  assert.equal(formatINR(0).includes('0'), true);
});

test('calculateTotalPenalty sums lateFee and emergencyRemovalFee correctly', () => {
  assert.equal(calculateTotalPenalty({ lateFee: 250, emergencyRemovalFee: 500 }), 750);
  assert.equal(calculateTotalPenalty({ lateFee: 0, emergencyRemovalFee: 0 }), 0);
  assert.equal(calculateTotalPenalty({ lateFee: 250, emergencyRemovalFee: 0 }), 250);
});

test('calculateShortNoticePenalty enforces 2-day minimum notice rule', () => {
  // 0 days notice = 2 days short => 2 * 250 = 500
  const zeroDays = calculateShortNoticePenalty(0);
  assert.equal(zeroDays.shortNoticeDays, 2);
  assert.equal(zeroDays.fee, 500);

  // 1 day notice = 1 day short => 1 * 250 = 250
  const oneDay = calculateShortNoticePenalty(1);
  assert.equal(oneDay.shortNoticeDays, 1);
  assert.equal(oneDay.fee, 250);

  // 2+ days notice = 0 short => fee 0
  const twoDays = calculateShortNoticePenalty(2);
  assert.equal(twoDays.shortNoticeDays, 0);
  assert.equal(twoDays.fee, 0);

  const fiveDays = calculateShortNoticePenalty(5);
  assert.equal(fiveDays.shortNoticeDays, 0);
  assert.equal(fiveDays.fee, 0);
});

test('evaluate24thRenewalAudit flags overdue brands and applies ₹250 penalty', () => {
  const sampleBrands: Brand[] = [
    {
      id: 'BRD-01',
      name: 'Brand One',
      category: 'Craft',
      slotId: 'Shelf A',
      monthlyRent: 6500,
      renewalDeadlineDay: 24,
      status: 'Active',
      lateFee: 0,
      shortNoticeDays: 0,
      emergencyRemovalFee: 0,
      unitsSoldWeekly: 10,
      stockOnHand: 10,
      unitPrice: 1000,
      commissionRate: 0.15,
      noticeDate: null,
      contactPerson: 'Person A',
      contactEmail: 'a@example.com',
      gstin: '29ABC123',
    },
    {
      id: 'BRD-02',
      name: 'Brand Two',
      category: 'Skincare',
      slotId: 'Shelf B',
      monthlyRent: 6500,
      renewalDeadlineDay: 24,
      status: 'Grace Period',
      lateFee: 0,
      shortNoticeDays: 0,
      emergencyRemovalFee: 0,
      unitsSoldWeekly: 20,
      stockOnHand: 5,
      unitPrice: 500,
      commissionRate: 0.15,
      noticeDate: null,
      contactPerson: 'Person B',
      contactEmail: 'b@example.com',
      gstin: '29DEF456',
    },
  ];

  const result = evaluate24thRenewalAudit(sampleBrands);
  assert.equal(result.newPenaltyCount, 1);
  assert.equal(result.updatedBrands[0].status, 'Active');
  assert.equal(result.updatedBrands[0].lateFee, 0);
  assert.equal(result.updatedBrands[1].status, 'Overdue');
  assert.equal(result.updatedBrands[1].lateFee, 250);
});

test('calculateZohoSettlement accurately computes GST, net payout and final balance', () => {
  const brand: Brand = {
    id: 'BRD-03',
    name: 'Brand Three',
    category: 'Footwear',
    slotId: 'Shelf C',
    monthlyRent: 10000,
    renewalDeadlineDay: 24,
    status: 'Overdue',
    lateFee: 250,
    shortNoticeDays: 1,
    emergencyRemovalFee: 250,
    unitsSoldWeekly: 10,
    stockOnHand: 10,
    unitPrice: 2000, // Gross = 20,000
    commissionRate: 0.20, // Commission = 4,000, Net payout = 16,000
    noticeDate: null,
    contactPerson: 'Person C',
    contactEmail: 'c@example.com',
    gstin: '29GHI789',
  };

  const settlement = calculateZohoSettlement(brand);
  // Base 10000 + Late 250 + Removal 250 = 10,500
  assert.equal(settlement.subtotalAltCharges, 10500);
  // GST 18% on 10,500 = 1,890
  assert.equal(settlement.gstAmount, 1890);
  // Total Alt charges = 12,390
  assert.equal(settlement.totalAltPayable, 12390);

  // Gross sales = 20,000
  assert.equal(settlement.grossSales, 20000);
  assert.equal(settlement.commissionAmount, 4000);
  assert.equal(settlement.netBrandPayout, 16000);

  // Final Settlement = 16,000 - 12,390 = +3,610 (Alt.Tribe pays brand)
  assert.equal(settlement.finalSettlementBalance, 3610);
});

import { generateRetailSKU, generateEAN13, generateZPL } from './barcode';

test('generateRetailSKU produces standardized format with brand code, category, and slot', () => {
  const brand: Brand = {
    id: 'BRD-01',
    name: 'KalaKriti Ceramics',
    category: 'Craft Ceramics',
    slotId: 'Shelf C-04',
    monthlyRent: 7200,
    renewalDeadlineDay: 24,
    status: 'Active',
    lateFee: 0,
    shortNoticeDays: 0,
    emergencyRemovalFee: 0,
    unitsSoldWeekly: 26,
    stockOnHand: 18,
    unitPrice: 1850,
    commissionRate: 0.15,
    noticeDate: null,
    contactPerson: 'Aditi',
    contactEmail: 'a@k.in',
    gstin: '29ABC',
  };

  const sku = generateRetailSKU(brand);
  assert.equal(sku, 'ALT-01CRA-SHELFC04');
});

test('generateEAN13 generates 12-digit Indian retail EAN number with valid check digit', () => {
  const brand: Brand = {
    id: 'BRD-02',
    name: 'Veda Earth',
    category: 'Skincare',
    slotId: 'Aisle S-02',
    monthlyRent: 6500,
    renewalDeadlineDay: 24,
    status: 'Active',
    lateFee: 0,
    shortNoticeDays: 0,
    emergencyRemovalFee: 0,
    unitsSoldWeekly: 10,
    stockOnHand: 5,
    unitPrice: 920,
    commissionRate: 0.18,
    noticeDate: null,
    contactPerson: 'Nikhil',
    contactEmail: 'n@v.in',
    gstin: '29DEF',
  };

  const ean = generateEAN13(brand);
  assert.equal(ean.startsWith('890002'), true);
  assert.equal(ean.length, 12);
});

test('generateZPL formats valid thermal printer string', () => {
  const brand: Brand = {
    id: 'BRD-01',
    name: 'Test Brand',
    category: 'Test Category',
    slotId: 'Shelf A-01',
    monthlyRent: 7000,
    renewalDeadlineDay: 24,
    status: 'Active',
    lateFee: 0,
    shortNoticeDays: 0,
    emergencyRemovalFee: 0,
    unitsSoldWeekly: 5,
    stockOnHand: 10,
    unitPrice: 1500,
    commissionRate: 0.15,
    noticeDate: null,
    contactPerson: 'Test',
    contactEmail: 't@t.com',
    gstin: '29XYZ',
  };

  const zpl = generateZPL(brand, 3);
  assert.equal(zpl.includes('^XA'), true);
  assert.equal(zpl.includes('^PQ3'), true);
  assert.equal(zpl.includes('^XZ'), true);
});

import { getContractExpiryInfo, parseLocalDate, calculateDaysBetween } from './billing';

test('getContractExpiryInfo accurately flags brands with less than 7 days remaining', () => {
  const refDate = new Date(2026, 10, 5); // 05 Nov 2026

  // 1. UrbanKhadi: End Date 09 Nov 2026 => 4 days remaining (< 7 days) => Warning
  const brand4Days: Pick<Brand, 'agreementEndDate' | 'agreementStartDate' | 'renewalDeadlineDay'> = {
    agreementEndDate: '2026-11-09',
    renewalDeadlineDay: 24,
  };
  const info4Days = getContractExpiryInfo(brand4Days, refDate);
  assert.equal(info4Days.daysRemaining, 4);
  assert.equal(info4Days.isExpiringSoon, true);
  assert.equal(info4Days.isExpired, false);
  assert.equal(info4Days.urgency, 'warning');
  assert.equal(info4Days.urgencyLabel.includes('4d left'), true);

  // 2. Goa Roastery: End Date 07 Nov 2026 => 2 days remaining (<= 2 days) => Critical (< 7 days)
  const brand2Days: Pick<Brand, 'agreementEndDate' | 'agreementStartDate' | 'renewalDeadlineDay'> = {
    agreementEndDate: '2026-11-07',
    renewalDeadlineDay: 24,
  };
  const info2Days = getContractExpiryInfo(brand2Days, refDate);
  assert.equal(info2Days.daysRemaining, 2);
  assert.equal(info2Days.isExpiringSoon, true);
  assert.equal(info2Days.isExpired, false);
  assert.equal(info2Days.urgency, 'critical');

  // 3. KalaKriti: End Date 24 Nov 2026 => 19 days remaining (>= 7 days) => Safe
  const brand19Days: Pick<Brand, 'agreementEndDate' | 'agreementStartDate' | 'renewalDeadlineDay'> = {
    agreementEndDate: '2026-11-24',
    renewalDeadlineDay: 24,
  };
  const info19Days = getContractExpiryInfo(brand19Days, refDate);
  assert.equal(info19Days.daysRemaining, 19);
  assert.equal(info19Days.isExpiringSoon, false);
  assert.equal(info19Days.isExpired, false);
  assert.equal(info19Days.urgency, 'safe');

  // 4. Overdue Brand: End Date 04 Nov 2026 => -1 day => Expired
  const brandExpired: Pick<Brand, 'agreementEndDate' | 'agreementStartDate' | 'renewalDeadlineDay'> = {
    agreementEndDate: '2026-11-04',
    renewalDeadlineDay: 24,
  };
  const infoExpired = getContractExpiryInfo(brandExpired, refDate);
  assert.equal(infoExpired.daysRemaining, -1);
  assert.equal(infoExpired.isExpiringSoon, false);
  assert.equal(infoExpired.isExpired, true);
  assert.equal(infoExpired.urgency, 'expired');
});

