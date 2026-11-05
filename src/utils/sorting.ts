import { Brand } from '../types/index';
import { parseLocalDate } from './billing';

export type SortField = 'agreementEndDate' | 'gmv' | 'default';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

/**
 * Calculates Gross Merchandise Value (GMV) for a brand
 */
export const getBrandGMV = (brand: Pick<Brand, 'unitsSoldWeekly' | 'unitPrice'>): number => {
  return (brand.unitsSoldWeekly || 0) * (brand.unitPrice || 0);
};

/**
 * Extracts normalized Date object for agreement end date
 */
export const getBrandAgreementEndDate = (
  brand: Pick<Brand, 'agreementEndDate' | 'renewalDeadlineDay'>,
  referenceYear = 2026,
  referenceMonth = 10
): Date => {
  if (brand.agreementEndDate) {
    return parseLocalDate(brand.agreementEndDate);
  }
  return new Date(referenceYear, referenceMonth, brand.renewalDeadlineDay || 24);
};

/**
 * Pure function to sort brands by Agreement End Date or GMV Performance
 */
export const sortBrands = (
  brands: Brand[],
  field: SortField,
  direction: SortDirection = 'asc'
): Brand[] => {
  if (field === 'default') {
    return brands;
  }

  return [...brands].sort((a, b) => {
    if (field === 'agreementEndDate') {
      const dateA = getBrandAgreementEndDate(a).getTime();
      const dateB = getBrandAgreementEndDate(b).getTime();
      return direction === 'asc' ? dateA - dateB : dateB - dateA;
    }

    if (field === 'gmv') {
      const gmvA = getBrandGMV(a);
      const gmvB = getBrandGMV(b);
      return direction === 'asc' ? gmvA - gmvB : gmvB - gmvA;
    }

    return 0;
  });
};
