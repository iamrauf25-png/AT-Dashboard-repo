import { jsPDF } from 'jspdf';
import { Brand } from '../types/index';
import { formatINR } from './billing';

export interface ReportOptions {
  period?: string;
  preparedBy?: string;
  storeLocation?: string;
  confidential?: boolean;
}

export interface ReportSummary {
  totalBrands: number;
  totalUnitsSoldWeekly: number;
  totalGMV: number;
  totalConcessionRevenue: number;
  totalFloorRent: number;
  totalStockOnHand: number;
  lowStockCount: number;
  topPerformingBrand: Brand | null;
  avgGrossPerBrand: number;
}

/**
 * Computes pure executive summary statistics for stakeholder reporting
 */
export const calculateReportSummary = (brands: Brand[]): ReportSummary => {
  const totalBrands = brands.length;
  const totalUnitsSoldWeekly = brands.reduce((acc, b) => acc + (b.unitsSoldWeekly || 0), 0);
  const totalGMV = brands.reduce(
    (acc, b) => acc + (b.unitsSoldWeekly || 0) * (b.unitPrice || 0),
    0
  );
  const totalConcessionRevenue = brands.reduce(
    (acc, b) => acc + (b.unitsSoldWeekly || 0) * (b.unitPrice || 0) * (b.commissionRate || 0.15),
    0
  );
  const totalFloorRent = brands.reduce((acc, b) => acc + (b.monthlyRent || 0), 0);
  const totalStockOnHand = brands.reduce((acc, b) => acc + (b.stockOnHand || 0), 0);
  const lowStockCount = brands.filter((b) => b.stockOnHand < 5).length;

  // Sort brands descending by weekly GMV
  const sorted = [...brands].sort((a, b) => {
    const gmvA = (a.unitsSoldWeekly || 0) * (a.unitPrice || 0);
    const gmvB = (b.unitsSoldWeekly || 0) * (b.unitPrice || 0);
    return gmvB - gmvA;
  });

  const topPerformingBrand = sorted[0] || null;
  const avgGrossPerBrand = totalBrands > 0 ? Math.round(totalGMV / totalBrands) : 0;

  return {
    totalBrands,
    totalUnitsSoldWeekly,
    totalGMV,
    totalConcessionRevenue,
    totalFloorRent,
    totalStockOnHand,
    lowStockCount,
    topPerformingBrand,
    avgGrossPerBrand,
  };
};

/**
 * Generates an executive-grade, landscape PDF report using jsPDF
 */
export const generateBrandPerformancePDF = (
  brands: Brand[],
  options: ReportOptions = {}
): jsPDF => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4', // 297mm x 210mm
  });

  const summary = calculateReportSummary(brands);
  const period = options.period || 'Q4 2026 Audit Cycle (01 Nov - 07 Nov 2026)';
  const preparedBy = options.preparedBy || 'Retail Operations & Concession Floor Management';
  const location = options.storeLocation || 'Alt.Tribe Flagship Space #01 (Bangalore)';

  // Page dimensions
  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 14;

  // --- 1. HEADER SECTION ---
  // Top brand accent bar
  doc.setFillColor(219, 39, 119); // #db2777
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Monogram Box
  doc.setFillColor(244, 114, 182); // #f472b6
  doc.roundedRect(margin, 10, 12, 12, 2.5, 2.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('A•T', margin + 6, 17.5, { align: 'center' });

  // Main Header Text
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('Alt.Tribe Concept Spaces — Executive Brand Performance Report', margin + 16, 15);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    `Store: ${location}   |   Audit Period: ${period}   |   Currency: INR (₹) Enforced`,
    margin + 16,
    20.5
  );

  // Confidential Badge on Right
  doc.setFillColor(253, 242, 248); // pink-50
  doc.setDrawColor(244, 114, 182); // pink-400
  doc.roundedRect(pageWidth - margin - 48, 10, 48, 11, 2, 2, 'FD');
  doc.setTextColor(190, 24, 93); // pink-700
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENTIAL • STAKEHOLDER REVIEW', pageWidth - margin - 24, 15.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin - 24, 19, {
    align: 'center',
  });

  // Separator Line
  doc.setDrawColor(251, 207, 232); // pink-200
  doc.setLineWidth(0.4);
  doc.line(margin, 25, pageWidth - margin, 25);

  // --- 2. EXECUTIVE KPI CARDS (4 TILES) ---
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardY = 28;
  const cardHeight = 19;

  const kpis = [
    {
      title: 'TOTAL FLOOR GMV (WK)',
      val: formatINR(summary.totalGMV),
      sub: `${summary.totalUnitsSoldWeekly} units sold floor-wide`,
      color: [16, 185, 129], // emerald
    },
    {
      title: 'EST. CONCESSION REVENUE',
      val: formatINR(summary.totalConcessionRevenue),
      sub: 'Avg 15% revenue share retained',
      color: [219, 39, 119], // pink
    },
    {
      title: 'MONTHLY FIXED SPACE RENT',
      val: formatINR(summary.totalFloorRent),
      sub: `${summary.totalBrands} consignment bays occupied`,
      color: [15, 23, 42], // slate
    },
    {
      title: 'INVENTORY & REPLENISHMENT',
      val: `${summary.totalStockOnHand} Units`,
      sub: `${summary.lowStockCount} brands below safety buffer (<5)`,
      color: summary.lowStockCount > 0 ? [217, 119, 6] : [16, 185, 129], // amber
    },
  ];

  kpis.forEach((kpi, index) => {
    const x = margin + index * (cardWidth + 3);
    // Background card
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(249, 168, 212); // pink-300
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'FD');

    // Title
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, x + 3.5, cardY + 5);

    // Value
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 3.5, cardY + 11.5);

    // Subtitle
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, x + 3.5, cardY + 16);
  });

  // --- 3. BRAND PERFORMANCE TABLE ---
  const tableStartY = 50;
  const colWidths = {
    rank: 10,
    name: 58,
    slot: 24,
    price: 24,
    sales: 24,
    gmv: 35,
    comm: 25,
    yield: 35,
    stock: 22,
    status: 12,
  };

  // Table Header Background
  doc.setFillColor(253, 242, 248); // pink-50
  doc.rect(margin, tableStartY, pageWidth - margin * 2, 7, 'F');
  doc.setDrawColor(244, 114, 182); // pink-400
  doc.setLineWidth(0.3);
  doc.line(margin, tableStartY + 7, pageWidth - margin, tableStartY + 7);

  // Table Header Labels
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(157, 23, 77); // pink-900

  let colX = margin + 2;
  doc.text('#', colX, tableStartY + 4.5);
  colX += colWidths.rank;

  doc.text('BRAND & CONCESSION CATEGORY', colX, tableStartY + 4.5);
  colX += colWidths.name;

  doc.text('SLOT / BAY', colX, tableStartY + 4.5);
  colX += colWidths.slot;

  doc.text('UNIT PRICE', colX, tableStartY + 4.5);
  colX += colWidths.price;

  doc.text('WK UNITS', colX, tableStartY + 4.5);
  colX += colWidths.sales;

  doc.text('GROSS GMV', colX, tableStartY + 4.5);
  colX += colWidths.gmv;

  doc.text('COMM %', colX, tableStartY + 4.5);
  colX += colWidths.comm;

  doc.text('CONCESSION YIELD', colX, tableStartY + 4.5);
  colX += colWidths.yield;

  doc.text('STOCK', colX, tableStartY + 4.5);
  colX += colWidths.stock;

  doc.text('STATUS', colX, tableStartY + 4.5);

  // Sort brands by Gross Revenue (GMV)
  const rankedBrands = [...brands].sort((a, b) => {
    const gmvA = (a.unitsSoldWeekly || 0) * (a.unitPrice || 0);
    const gmvB = (b.unitsSoldWeekly || 0) * (b.unitPrice || 0);
    return gmvB - gmvA;
  });

  let rowY = tableStartY + 7;
  const rowHeight = 8.5;

  rankedBrands.forEach((b, idx) => {
    const weeklyGMV = (b.unitsSoldWeekly || 0) * (b.unitPrice || 0);
    const commissionYield = weeklyGMV * (b.commissionRate || 0.15);
    const isEven = idx % 2 === 0;

    // Alternate row fill
    if (isEven) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(254, 247, 251); // soft blush
    }
    doc.rect(margin, rowY, pageWidth - margin * 2, rowHeight, 'F');

    // Row divider
    doc.setDrawColor(243, 232, 238);
    doc.setLineWidth(0.2);
    doc.line(margin, rowY + rowHeight, pageWidth - margin, rowY + rowHeight);

    colX = margin + 2;

    // Rank
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(219, 39, 119);
    doc.text(`${idx + 1}`, colX, rowY + 5.5);
    colX += colWidths.rank;

    // Name & Category
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(b.name, colX, rowY + 4);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${b.category} • ${b.id}`, colX, rowY + 7);
    colX += colWidths.name;

    // Slot
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(157, 23, 77);
    doc.text(b.slotId, colX, rowY + 5.5);
    colX += colWidths.slot;

    // Price
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(formatINR(b.unitPrice), colX, rowY + 5.5);
    colX += colWidths.price;

    // Sales Units
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${b.unitsSoldWeekly} pcs`, colX, rowY + 5.5);
    colX += colWidths.sales;

    // GMV
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // emerald
    doc.text(formatINR(weeklyGMV), colX, rowY + 5.5);
    colX += colWidths.gmv;

    // Comm Rate
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${((b.commissionRate || 0.15) * 100).toFixed(0)}%`, colX, rowY + 5.5);
    colX += colWidths.comm;

    // Yield
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(219, 39, 119);
    doc.text(formatINR(commissionYield), colX, rowY + 5.5);
    colX += colWidths.yield;

    // Stock
    doc.setFont('helvetica', 'bold');
    if (b.stockOnHand === 0) {
      doc.setTextColor(225, 29, 72); // red
      doc.text('0 (Out)', colX, rowY + 5.5);
    } else if (b.stockOnHand < 5) {
      doc.setTextColor(217, 119, 6); // amber
      doc.text(`${b.stockOnHand} (Low)`, colX, rowY + 5.5);
    } else {
      doc.setTextColor(15, 23, 42);
      doc.text(`${b.stockOnHand} pcs`, colX, rowY + 5.5);
    }
    colX += colWidths.stock;

    // Status
    doc.setFontSize(6.5);
    if (b.status === 'Active') {
      doc.setTextColor(5, 150, 105);
      doc.text('Active', colX, rowY + 5.5);
    } else if (b.status === 'Grace Period') {
      doc.setTextColor(217, 119, 6);
      doc.text('Grace', colX, rowY + 5.5);
    } else if (b.status === 'Overdue') {
      doc.setTextColor(225, 29, 72);
      doc.text('Overdue', colX, rowY + 5.5);
    } else {
      doc.setTextColor(100, 116, 139);
      doc.text(b.status, colX, rowY + 5.5);
    }

    rowY += rowHeight;
  });

  // Table Totals Footer Row
  doc.setFillColor(253, 242, 248);
  doc.rect(margin, rowY, pageWidth - margin * 2, 8, 'F');
  doc.setDrawColor(244, 114, 182);
  doc.setLineWidth(0.3);
  doc.line(margin, rowY, pageWidth - margin, rowY);
  doc.line(margin, rowY + 8, pageWidth - margin, rowY + 8);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CONSOLIDATED FLOOR TOTALS', margin + colWidths.rank + 2, rowY + 5.5);

  doc.setTextColor(15, 23, 42);
  doc.text(
    `${summary.totalUnitsSoldWeekly} pcs`,
    margin + colWidths.rank + colWidths.name + colWidths.slot + colWidths.price + 2,
    rowY + 5.5
  );

  doc.setTextColor(16, 185, 129);
  doc.text(
    formatINR(summary.totalGMV),
    margin + colWidths.rank + colWidths.name + colWidths.slot + colWidths.price + colWidths.sales + 2,
    rowY + 5.5
  );

  doc.setTextColor(219, 39, 119);
  doc.text(
    formatINR(summary.totalConcessionRevenue),
    margin +
      colWidths.rank +
      colWidths.name +
      colWidths.slot +
      colWidths.price +
      colWidths.sales +
      colWidths.gmv +
      colWidths.comm +
      2,
    rowY + 5.5
  );

  doc.setTextColor(15, 23, 42);
  doc.text(
    `${summary.totalStockOnHand} units`,
    margin +
      colWidths.rank +
      colWidths.name +
      colWidths.slot +
      colWidths.price +
      colWidths.sales +
      colWidths.gmv +
      colWidths.comm +
      colWidths.yield +
      2,
    rowY + 5.5
  );

  // --- 4. STRATEGIC INSIGHTS & SIGN-OFF BOXES ---
  const signOffY = Math.min(rowY + 12, pageHeight - 38);
  const signOffBoxWidth = (pageWidth - margin * 2 - 8) / 3;

  // Box 1: Operations Audit
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, signOffY, signOffBoxWidth, 24, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. CONCESSION VELOCITY AUDIT', margin + 3.5, signOffY + 5);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const topName = summary.topPerformingBrand ? summary.topPerformingBrand.name : 'N/A';
  const topGmv = summary.topPerformingBrand
    ? formatINR(summary.topPerformingBrand.unitsSoldWeekly * summary.topPerformingBrand.unitPrice)
    : '₹0';
  doc.text(`• Top Volume Generator: ${topName} (${topGmv}/wk)`, margin + 3.5, signOffY + 10);
  doc.text(
    `• Replenishment Action: ${summary.lowStockCount} brand bays require restock alert`,
    margin + 3.5,
    signOffY + 14
  );
  doc.text(
    `• Floor Concession Yield: ${(
      (summary.totalConcessionRevenue / (summary.totalGMV || 1)) *
      100
    ).toFixed(1)}% effective revenue capture`,
    margin + 3.5,
    signOffY + 18
  );

  // Box 2: Prepared By
  doc.roundedRect(margin + signOffBoxWidth + 4, signOffY, signOffBoxWidth, 24, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. PREPARED & AUDITED BY', margin + signOffBoxWidth + 7.5, signOffY + 5);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Lead Officer: ${preparedBy}`, margin + signOffBoxWidth + 7.5, signOffY + 10);
  doc.text('System: Alt.Tribe POS & Concession Ledger v3.5', margin + signOffBoxWidth + 7.5, signOffY + 14);
  doc.text('Signature: _______________________', margin + signOffBoxWidth + 7.5, signOffY + 19);

  // Box 3: Stakeholder Board Approval
  doc.roundedRect(margin + (signOffBoxWidth + 4) * 2, signOffY, signOffBoxWidth, 24, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. STAKEHOLDER BOARD ENDORSEMENT', margin + (signOffBoxWidth + 4) * 2 + 3.5, signOffY + 5);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Reviewed By: Partner / Investment Director', margin + (signOffBoxWidth + 4) * 2 + 3.5, signOffY + 10);
  doc.text('Date of Review: _____ / _____ / 2026', margin + (signOffBoxWidth + 4) * 2 + 3.5, signOffY + 14);
  doc.text('Endorsement: [  ] Approved  [  ] Re-allocation', margin + (signOffBoxWidth + 4) * 2 + 3.5, signOffY + 19);

  // Footer bar
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Alt.Tribe Retail Technologies • Confidential Executive Stakeholder Report • Generated directly from live counter telemetry',
    margin,
    pageHeight - 4
  );
  doc.text(`Page 1 of 1`, pageWidth - margin, pageHeight - 4, { align: 'right' });

  return doc;
};
