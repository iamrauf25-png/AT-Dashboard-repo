import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateReportSummary, generateBrandPerformancePDF } from './pdfExport';
import { INITIAL_BRANDS } from '../data/initialData';

test('calculateReportSummary accurately aggregates GMV, concession revenue and floor units', () => {
  const summary = calculateReportSummary(INITIAL_BRANDS);

  assert.equal(summary.totalBrands, INITIAL_BRANDS.length);
  assert.equal(summary.totalGMV > 0, true);
  assert.equal(summary.totalConcessionRevenue > 0, true);
  assert.equal(summary.totalUnitsSoldWeekly > 0, true);
  assert.equal(summary.lowStockCount >= 1, true);
  assert.notEqual(summary.topPerformingBrand, null);

  // Top brand should be UrbanKhadi (38 * 2400 = 91,200)
  assert.equal(summary.topPerformingBrand?.name, 'UrbanKhadi Apparel');
});

test('generateBrandPerformancePDF generates a valid jsPDF document without throwing', () => {
  const doc = generateBrandPerformancePDF(INITIAL_BRANDS, {
    period: 'Nov 2026 Audit',
    preparedBy: 'Test Officer',
    storeLocation: 'Bangalore Store #01',
  });

  assert.equal(typeof doc.save, 'function');
  assert.equal(typeof doc.output, 'function');

  // Verify PDF header bytes can be outputted
  const pdfOutput = doc.output();
  assert.equal(pdfOutput.startsWith('%PDF'), true);
});
