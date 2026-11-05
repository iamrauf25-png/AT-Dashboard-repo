import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanPhoneNumber,
  formatBrandWhatsAppMessage,
  getBrandWhatsAppUrl,
} from './whatsapp';
import { Brand } from '../types/index';

const sampleBrand: Brand = {
  id: 'BRD-03',
  name: 'UrbanKhadi Apparel',
  category: 'Sustainable Fashion',
  slotId: 'Rack A-01',
  monthlyRent: 8500,
  renewalDeadlineDay: 24,
  agreementStartDate: '2026-10-10',
  agreementEndDate: '2026-11-09',
  status: 'Active',
  lateFee: 0,
  shortNoticeDays: 0,
  emergencyRemovalFee: 0,
  unitsSoldWeekly: 38,
  stockOnHand: 25,
  unitPrice: 2400,
  commissionRate: 0.16,
  noticeDate: null,
  contactPerson: 'Meera Nambiar',
  contactEmail: 'meera@urbankhadi.com',
  contactPhone: '+91 98455 34567',
  gstin: '29KLMNO9012P3Z7',
};

const overdueBrand: Brand = {
  id: 'BRD-02',
  name: 'Veda Earth Botanicals',
  category: 'Organic Skincare',
  slotId: 'Aisle S-02',
  monthlyRent: 6500,
  renewalDeadlineDay: 24,
  agreementStartDate: '2026-10-05',
  agreementEndDate: '2026-11-04',
  status: 'Overdue',
  lateFee: 250,
  shortNoticeDays: 0,
  emergencyRemovalFee: 0,
  unitsSoldWeekly: 44,
  stockOnHand: 4,
  unitPrice: 920,
  commissionRate: 0.18,
  noticeDate: null,
  contactPerson: 'Dr. Nikhil Rao',
  contactEmail: 'nikhil@vedaearth.co',
  contactPhone: '9886023456',
  gstin: '29FGHIJ5678K2Z3',
};

test('cleanPhoneNumber formats Indian and international numbers with country code', () => {
  assert.equal(cleanPhoneNumber('+91 98455 34567'), '919845534567');
  assert.equal(cleanPhoneNumber('9886023456'), '919886023456');
  assert.equal(cleanPhoneNumber(''), '919880123456');
});

test('formatBrandWhatsAppMessage includes brand, bay, status and countdown', () => {
  const msg = formatBrandWhatsAppMessage(sampleBrand, new Date('2026-11-05T00:00:00'));
  assert.ok(msg.includes('Meera Nambiar'));
  assert.ok(msg.includes('UrbanKhadi Apparel'));
  assert.ok(msg.includes('Rack A-01'));
  assert.ok(msg.includes('4 days remaining'));
  assert.ok(msg.includes('₹8,500'));
  assert.ok(msg.includes('25 units'));
  assert.ok(msg.includes('RENEWAL NOTICE'));
});

test('formatBrandWhatsAppMessage includes overdue warning and late penalty', () => {
  const msg = formatBrandWhatsAppMessage(overdueBrand, new Date('2026-11-05T00:00:00'));
  assert.ok(msg.includes('Dr. Nikhil Rao'));
  assert.ok(msg.includes('Veda Earth Botanicals'));
  assert.ok(msg.includes('Overdue'));
  assert.ok(msg.includes('₹250'));
  assert.ok(msg.includes('URGENT ACTION REQUIRED'));
});

test('getBrandWhatsAppUrl generates valid wa.me link with encoded text', () => {
  const url = getBrandWhatsAppUrl(sampleBrand, new Date('2026-11-05T00:00:00'));
  assert.ok(url.startsWith('https://wa.me/919845534567?text='));
  assert.ok(url.includes(encodeURIComponent('UrbanKhadi Apparel')));
});
