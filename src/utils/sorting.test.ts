import test from 'node:test';
import assert from 'node:assert/strict';
import { sortBrands, getBrandGMV, getBrandAgreementEndDate } from './sorting';
import { INITIAL_BRANDS } from '../data/initialData';

test('getBrandGMV correctly computes weekly units * unit price', () => {
  const gmv = getBrandGMV({ unitsSoldWeekly: 10, unitPrice: 1500 });
  assert.equal(gmv, 15000);
});

test('sortBrands sorts by agreementEndDate ascending (earliest expiry first)', () => {
  const sorted = sortBrands(INITIAL_BRANDS, 'agreementEndDate', 'asc');
  assert.equal(sorted[0].id, 'BRD-07'); // 2026-11-01
  assert.equal(sorted[1].id, 'BRD-05'); // 2026-11-03
  assert.equal(sorted[2].id, 'BRD-02'); // 2026-11-04
  assert.equal(sorted[sorted.length - 1].id, 'BRD-01'); // 2026-11-24
});

test('sortBrands sorts by agreementEndDate descending (furthest expiry first)', () => {
  const sorted = sortBrands(INITIAL_BRANDS, 'agreementEndDate', 'desc');
  assert.equal(sorted[0].id, 'BRD-01'); // 2026-11-24
  assert.equal(sorted[sorted.length - 1].id, 'BRD-07'); // 2026-11-01
});

test('sortBrands sorts by GMV descending (top grossing first)', () => {
  const sorted = sortBrands(INITIAL_BRANDS, 'gmv', 'desc');
  // UrbanKhadi: 38 * 2400 = 91,200
  assert.equal(sorted[0].name, 'UrbanKhadi Apparel');
  // KalaKriti: 26 * 1850 = 48,100
  assert.equal(sorted[1].name, 'KalaKriti Ceramics');
  // Lowest should be The Chai Collective (11 * 420 = 4,620)
  assert.equal(sorted[sorted.length - 1].name, 'The Chai Collective');
});

test('sortBrands sorts by GMV ascending (lowest grossing first)', () => {
  const sorted = sortBrands(INITIAL_BRANDS, 'gmv', 'asc');
  assert.equal(sorted[0].name, 'The Chai Collective');
  assert.equal(sorted[sorted.length - 1].name, 'UrbanKhadi Apparel');
});

test('sortBrands returns original array when field is default', () => {
  const sorted = sortBrands(INITIAL_BRANDS, 'default', 'asc');
  assert.equal(sorted[0].id, INITIAL_BRANDS[0].id);
  assert.equal(sorted.length, INITIAL_BRANDS.length);
});
