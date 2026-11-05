import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Printer,
  Barcode as BarcodeIcon,
  QrCode,
  Copy,
  Check,
  Download,
  Layers,
  Sparkles,
  Search,
  Tag,
  Package,
  Store,
  Sliders,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Brand, LabelPreset, BarcodeType } from '../types/index';
import { formatINR } from '../utils/billing';
import {
  generateRetailSKU,
  generateEAN13,
  generateBarcodePattern,
  generateZPL
} from '../utils/barcode';

interface BarcodePrinterTabProps {
  brands: Brand[];
  onTriggerNotification: (text: string, type?: 'info' | 'success' | 'warning') => void;
}

export const BarcodePrinterTab: React.FC<BarcodePrinterTabProps> = ({
  brands,
  onTriggerNotification,
}) => {
  const [selectedBrandId, setSelectedBrandId] = useState<string>(brands[0]?.id || '');
  const [labelPreset, setLabelPreset] = useState<LabelPreset>('shelf-50x30');
  const [barcodeType, setBarcodeType] = useState<BarcodeType>('dual');
  const [printQuantity, setPrintQuantity] = useState<number>(6);
  const [includeStoreName, setIncludeStoreName] = useState<boolean>(true);
  const [includePrice, setIncludePrice] = useState<boolean>(true);
  const [includeTaxText, setIncludeTaxText] = useState<boolean>(true);
  const [includeSlot, setIncludeSlot] = useState<boolean>(true);
  const [filterLowStockOnly, setFilterLowStockOnly] = useState<boolean>(false);
  const [searchSKU, setSearchSKU] = useState<string>('');
  const [copiedZPL, setCopiedZPL] = useState<boolean>(false);

  const selectedBrand = useMemo(() => {
    return brands.find((b) => b.id === selectedBrandId) || brands[0];
  }, [brands, selectedBrandId]);

  const displayBrands = useMemo(() => {
    return brands.filter((b) => {
      const matchesLowStock = !filterLowStockOnly || b.stockOnHand < 5;
      const q = searchSKU.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.slotId.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q);
      return matchesLowStock && matchesSearch;
    });
  }, [brands, filterLowStockOnly, searchSKU]);

  const currentSKU = useMemo(() => {
    return selectedBrand ? generateRetailSKU(selectedBrand) : 'ALT-01CRA-C04';
  }, [selectedBrand]);

  const currentEAN = useMemo(() => {
    return selectedBrand ? generateEAN13(selectedBrand) : '890001018507';
  }, [selectedBrand]);

  const barcodeStripes = useMemo(() => {
    return generateBarcodePattern(currentSKU);
  }, [currentSKU]);

  const handleCopyZPL = () => {
    if (!selectedBrand) return;
    const zpl = generateZPL(selectedBrand, printQuantity);
    navigator.clipboard.writeText(zpl);
    setCopiedZPL(true);
    onTriggerNotification(
      `Zebra ZPL Thermal code for ${selectedBrand.name} copied to clipboard!`,
      'success'
    );
    setTimeout(() => setCopiedZPL(false), 2500);
  };

  const handlePrintSheet = () => {
    window.print();
  };

  const handleBatchAllLowStock = () => {
    const lowStock = brands.filter((b) => b.stockOnHand < 5);
    if (lowStock.length === 0) {
      onTriggerNotification('All shelf bays currently have healthy stock (>5 units)!', 'info');
      return;
    }
    setFilterLowStockOnly(true);
    setSelectedBrandId(lowStock[0].id);
    setPrintQuantity(lowStock.length * 2);
    onTriggerNotification(
      `Auto-queued ${lowStock.length} low-stock bay tags for instant batch printing!`,
      'success'
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Top Banner & Quick Actions */}
      <div className="bg-white/95 rounded-2xl p-5 border border-pink-200/80 shadow-md shadow-pink-100/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-pink-500 to-rose-400 rounded-xl text-white shadow-md shadow-pink-200">
              <BarcodeIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                Barcode & Price Tag Studio
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 border border-pink-200">
                  Thermal & Sheet Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Generate GS1-compliant retail barcodes, QR tags, and shelf shelf-talkers with real-time preview
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBatchAllLowStock}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Batch Low-Stock Tags</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCopyZPL}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            {copiedZPL ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-pink-500 shrink-0" />}
            <span>{copiedZPL ? 'ZPL Copied!' : 'Copy Zebra ZPL'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrintSheet}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white transition-all shadow-md shadow-pink-200 cursor-pointer shrink-0"
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            <span>Print Label Sheet</span>
          </motion.button>
        </div>
      </div>

      {/* Main Studio Grid: Controls & Real-Time Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Controls & Brand Picker (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: Select Brand & Item */}
          <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-sm shadow-pink-100/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-pink-50">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-pink-500" />
                <span>1. Select Brand & Slot</span>
              </span>
              <span className="text-[11px] text-pink-600 font-semibold bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
                {displayBrands.length} Available
              </span>
            </div>

            {/* Quick Filter & Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter brand or bay..."
                  value={searchSKU}
                  onChange={(e) => setSearchSKU(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-pink-50/40 border border-pink-100 rounded-lg text-xs placeholder:text-slate-400 text-slate-800 focus:outline-none focus:border-pink-400 transition-colors"
                />
              </div>
              <button
                onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  filterLowStockOnly
                    ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                    : 'bg-white text-slate-600 border-pink-100 hover:bg-pink-50'
                }`}
                title="Filter brands with stock < 5"
              >
                &lt;5 Stock
              </button>
            </div>

            {/* Brand Cards Carousel / List */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {displayBrands.map((b) => {
                const isSelected = b.id === selectedBrandId;
                const isLow = b.stockOnHand < 5;

                return (
                  <motion.div
                    key={b.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedBrandId(b.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-50 to-rose-50/60 border-pink-400 text-slate-900 shadow-xs'
                        : 'bg-white hover:bg-pink-50/30 border-pink-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>{b.name}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-pink-600"></span>}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-pink-700 bg-pink-100/60 px-1.5 py-0.2 rounded">
                          {b.slotId}
                        </span>
                        <span>•</span>
                        <span>{b.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 font-mono block">
                        {formatINR(b.unitPrice)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                          isLow
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}
                      >
                        {b.stockOnHand} left
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Tag Specifications & Print Options */}
          <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-sm shadow-pink-100/40 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-pink-50">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-pink-500" />
                <span>2. Label Format & Dimension</span>
              </span>
            </div>

            {/* Label Size Presets */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                Label Size Preset
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'shelf-50x30', label: 'Shelf Tag', dim: '50 × 30 mm' },
                  { id: 'jewel-35x20', label: 'Price Jewel Tag', dim: '35 × 20 mm' },
                  { id: 'apparel-60x40', label: 'Apparel Hangtag', dim: '60 × 40 mm' },
                  { id: 'carton-70x50', label: 'Bay Sticker', dim: '70 × 50 mm' }
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setLabelPreset(preset.id as LabelPreset)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      labelPreset === preset.id
                        ? 'bg-pink-100/70 border-pink-400 text-pink-900 font-semibold shadow-xs'
                        : 'bg-pink-50/30 hover:bg-pink-50/70 border-pink-100 text-slate-600'
                    }`}
                  >
                    <div className="font-medium text-xs">{preset.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{preset.dim}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Barcode Encoding Mode */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                Symbology
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'dual', label: 'Dual (Code + QR)', icon: Layers },
                  { id: 'code128', label: 'Linear Code-128', icon: BarcodeIcon },
                  { id: 'qr', label: '2D QR Code', icon: QrCode }
                ].map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setBarcodeType(type.id as BarcodeType)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                        barcodeType === type.id
                          ? 'bg-pink-100/70 border-pink-400 text-pink-900 font-semibold shadow-xs'
                          : 'bg-pink-50/30 hover:bg-pink-50/70 border-pink-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-pink-600" />
                      <span className="text-[10px]">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Elements Toggle Checklist */}
            <div className="pt-2 border-t border-pink-50 space-y-2 text-xs">
              <span className="text-[11px] font-semibold text-slate-600 block">
                Printed Label Data Fields
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer hover:text-pink-700">
                  <input
                    type="checkbox"
                    checked={includeStoreName}
                    onChange={(e) => setIncludeStoreName(e.target.checked)}
                    className="rounded text-pink-600 focus:ring-pink-400 border-pink-200 cursor-pointer"
                  />
                  <span>Alt.Tribe Branding</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-pink-700">
                  <input
                    type="checkbox"
                    checked={includeSlot}
                    onChange={(e) => setIncludeSlot(e.target.checked)}
                    className="rounded text-pink-600 focus:ring-pink-400 border-pink-200 cursor-pointer"
                  />
                  <span>Bay / Slot ID</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-pink-700">
                  <input
                    type="checkbox"
                    checked={includePrice}
                    onChange={(e) => setIncludePrice(e.target.checked)}
                    className="rounded text-pink-600 focus:ring-pink-400 border-pink-200 cursor-pointer"
                  />
                  <span>Price (INR ₹)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-pink-700">
                  <input
                    type="checkbox"
                    checked={includeTaxText}
                    onChange={(e) => setIncludeTaxText(e.target.checked)}
                    className="rounded text-pink-600 focus:ring-pink-400 border-pink-200 cursor-pointer"
                  />
                  <span>Incl. All Taxes</span>
                </label>
              </div>
            </div>

            {/* Quantity Slider / Stepper */}
            <div className="pt-2 border-t border-pink-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700">Print Run Copies</span>
                <span className="text-[11px] text-slate-400 block font-mono">Die-cut label sheets</span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 6, 12, 24].map((qty) => (
                  <button
                    key={qty}
                    onClick={() => setPrintQuantity(qty)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                      printQuantity === qty
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200'
                    }`}
                  >
                    {qty}×
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Realistic Live Tag Card & Sheet Layout Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card 3: Real-Time High-Fidelity Single Label Card */}
          <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm shadow-pink-100/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-pink-50">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-pink-500" />
                <span>Real-Time Die-Cut Tag Preview (1:1 Scale)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                SKU: <span className="font-bold text-pink-700">{currentSKU}</span>
              </span>
            </div>

            {/* Realistic Physical Sticker Renderer */}
            <div className="p-6 bg-gradient-to-br from-pink-50/50 via-rose-50/30 to-pink-100/40 rounded-xl border border-dashed border-pink-200 flex justify-center items-center">
              <motion.div
                layout
                className="bg-white rounded-xl shadow-xl shadow-pink-200/50 border border-pink-200 p-4 max-w-sm w-full font-sans text-slate-900 select-none relative overflow-hidden transition-all"
                style={{
                  minHeight: labelPreset === 'jewel-35x20' ? '140px' : '190px'
                }}
              >
                {/* Decorative Top Hole for Hangtags */}
                {labelPreset === 'apparel-60x40' && (
                  <div className="w-3 h-3 rounded-full border border-slate-300 bg-pink-50 mx-auto -mt-1 mb-2"></div>
                )}

                {/* Brand & Store Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                  <div>
                    {includeStoreName && (
                      <div className="text-[9px] font-black uppercase tracking-widest text-pink-600">
                        ALT.TRIBE CONCEPT SPACE
                      </div>
                    )}
                    <h3 className="font-extrabold text-sm text-slate-950 tracking-tight leading-tight">
                      {selectedBrand.name}
                    </h3>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                      <span>{selectedBrand.category}</span>
                      {includeSlot && (
                        <>
                          <span>•</span>
                          <span className="font-bold font-mono text-slate-700 bg-slate-100 px-1 rounded">
                            {selectedBrand.slotId}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {includePrice && (
                    <div className="text-right">
                      <div className="text-base font-black text-slate-950 font-mono tracking-tight leading-none">
                        {formatINR(selectedBrand.unitPrice)}
                      </div>
                      {includeTaxText && (
                        <span className="text-[9px] text-slate-500 block uppercase font-medium">
                          Incl. All Taxes
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Barcode & QR Code Section */}
                <div className="py-3 flex items-center justify-between gap-4">
                  {/* Linear Barcode */}
                  {(barcodeType === 'dual' || barcodeType === 'code128') && (
                    <div className="flex-1 flex flex-col items-center">
                      <div className="flex items-end justify-center h-12 w-full gap-[1.5px] px-2 bg-white">
                        {barcodeStripes.map((width, idx) => (
                          <div
                            key={idx}
                            className={`h-full ${idx % 2 === 0 ? 'bg-slate-950' : 'bg-transparent'}`}
                            style={{ width: `${Math.max(1, width * 1.5)}px` }}
                          />
                        ))}
                      </div>
                      <div className="text-[10px] font-mono tracking-wider text-slate-800 font-bold mt-1">
                        {currentEAN}
                      </div>
                    </div>
                  )}

                  {/* 2D QR Code */}
                  {(barcodeType === 'dual' || barcodeType === 'qr') && (
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-white p-1 rounded border border-slate-300 flex items-center justify-center shadow-2xs">
                        <svg className="w-full h-full text-slate-950" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14-2h4v2h-4v-2zm-4 0h2v4h-2v-4zm2 4h4v4h-2v-2h-2v-2zm-2 2h2v2h-2v-2zm4-6h2v2h-2v-2z" />
                        </svg>
                      </div>
                      <span className="text-[8px] font-mono uppercase text-slate-500 mt-0.5">Scan Bay</span>
                    </div>
                  )}
                </div>

                {/* Footer Meta */}
                <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1.5 border-t border-slate-100 font-mono">
                  <span>Bangalore Store #01</span>
                  <span>GST: {selectedBrand.gstin.slice(0, 10)}••</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Card 4: Multi-Tag Sheet Grid (Print Layout) */}
          <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm shadow-pink-100/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-pink-50">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-pink-500" />
                <span>Printable Sheet Grid Preview ({printQuantity} Labels Ready)</span>
              </span>
              <span className="text-[11px] text-pink-700 bg-pink-50 font-semibold px-2 py-0.5 rounded-full border border-pink-200">
                A4 / Thermal Roll Ready
              </span>
            </div>

            {/* The Print Container (Optimized for window.print()) */}
            <div
              id="printable-barcode-sheet"
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-pink-50/30 rounded-xl border border-pink-100 max-h-72 overflow-y-auto"
            >
              {Array.from({ length: printQuantity }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white p-2.5 rounded-lg border border-pink-200/80 shadow-2xs text-[10px] flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[8px] font-bold text-pink-600 block uppercase">
                        ALT.TRIBE
                      </span>
                      <span className="font-bold text-slate-900 block truncate max-w-[100px]">
                        {selectedBrand.name}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">{selectedBrand.slotId}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {formatINR(selectedBrand.unitPrice)}
                    </span>
                  </div>

                  <div className="my-2 flex flex-col items-center">
                    <div className="flex items-end justify-center h-7 w-full gap-[1px]">
                      {barcodeStripes.slice(0, 24).map((w, idx) => (
                        <div
                          key={idx}
                          className={`h-full ${idx % 2 === 0 ? 'bg-slate-950' : 'bg-transparent'}`}
                          style={{ width: `${Math.max(1, w)}px` }}
                        />
                      ))}
                    </div>
                    <span className="text-[8px] font-mono text-slate-600 mt-0.5 font-bold">
                      {currentSKU}
                    </span>
                  </div>

                  <div className="flex justify-between text-[8px] text-slate-400 border-t border-slate-100 pt-1 font-mono">
                    <span>Tag #{index + 1}</span>
                    <span>Store #01</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick helper note */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Calibrated for standard Avery / Zebra 50x30mm thermal rolls</span>
              </span>
              <button
                onClick={handlePrintSheet}
                className="text-pink-600 hover:text-pink-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Launch Print Dialog</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
