import { Brand } from '../types/index';

/**
 * Generate a standardized retail SKU for a brand and slot
 */
export const generateRetailSKU = (brand: Brand): string => {
  const brandCode = brand.id.replace('BRD-', '');
  const cleanCategory = brand.category.slice(0, 3).toUpperCase();
  const slotClean = brand.slotId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `ALT-${brandCode}${cleanCategory}-${slotClean}`;
};

/**
 * Generate a 12-digit UPC/EAN representation from brand ID and price
 */
export const generateEAN13 = (brand: Brand): string => {
  const brandNum = brand.id.replace('BRD-', '').padStart(3, '0');
  const priceNum = String(Math.floor(brand.unitPrice)).padStart(5, '0').slice(-5);
  const base = `890${brandNum}${priceNum}`; // 890 is India EAN country code
  
  // Calculate check digit (mod 10)
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(base[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${base}${checkDigit}`;
};

/**
 * Generates deterministic vertical barcode stripes (1s and 0s) for Code-128 style SVG rendering
 */
export const generateBarcodePattern = (codeStr: string): number[] => {
  const pattern: number[] = [2, 1, 1, 2]; // Start sentinel
  for (let i = 0; i < codeStr.length; i++) {
    const charCode = codeStr.charCodeAt(i);
    const w1 = ((charCode * 3) % 3) + 1;
    const w2 = ((charCode * 7) % 2) + 1;
    const w3 = ((charCode * 11) % 3) + 1;
    pattern.push(w1, w2, w3, 1);
  }
  pattern.push(2, 3, 1, 2); // Stop sentinel
  return pattern;
};

/**
 * Generate Zebra Programming Language (ZPL) code for industrial thermal label printers
 */
export const generateZPL = (brand: Brand, quantity = 1): string => {
  const sku = generateRetailSKU(brand);
  const ean = generateEAN13(brand);
  return `^XA
^PW400
^LL300
^FO30,30^A0N,22,22^FDALT.TRIBE CONCEPT STORE^FS
^FO30,60^A0N,28,28^FD${brand.name.slice(0, 24)}^FS
^FO30,95^A0N,20,20^FDBay: ${brand.slotId} | ${brand.category}^FS
^FO30,130^BY2,2.5,60^BCN,60,Y,N,N^FD${sku}^FS
^FO30,225^A0N,32,32^FDINR ${brand.unitPrice.toLocaleString('en-IN')}/-^FS
^FO260,225^A0N,18,18^FD(Incl. All Taxes)^FS
^PQ${quantity}
^XZ`;
};
