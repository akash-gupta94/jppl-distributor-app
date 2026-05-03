import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in INR
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number with Indian numbering system
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Get quarter from date
 */
export function getQuarter(date: Date): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const month = date.getMonth() + 1; // 1-12

  // Financial year quarters (Apr-Mar)
  if (month >= 4 && month <= 6) return 'Q1'; // Apr-Jun
  if (month >= 7 && month <= 9) return 'Q2'; // Jul-Sep
  if (month >= 10 && month <= 12) return 'Q3'; // Oct-Dec
  return 'Q4'; // Jan-Mar
}

/**
 * Get financial year from date
 */
export function getFinancialYear(date: Date): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  if (month >= 4) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

/**
 * Get quarter date range
 */
export function getQuarterDateRange(quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4', financialYear: string): { start: Date; end: Date } {
  const [startYear] = financialYear.split('-').map(Number);

  const quarterMap = {
    Q1: { startMonth: 3, startDay: 1, endMonth: 5, endDay: 30 }, // Apr-Jun
    Q2: { startMonth: 6, startDay: 1, endMonth: 8, endDay: 30 }, // Jul-Sep
    Q3: { startMonth: 9, startDay: 1, endMonth: 11, endDay: 31 }, // Oct-Dec
    Q4: { startMonth: 0, startDay: 1, endMonth: 2, endDay: 31 }, // Jan-Mar
  };

  const { startMonth, startDay, endMonth, endDay } = quarterMap[quarter];

  const startDate = new Date(quarter === 'Q4' ? startYear + 1 : startYear, startMonth, startDay);
  const endDate = new Date(quarter === 'Q4' ? startYear + 1 : startYear, endMonth, endDay, 23, 59, 59);

  return { start: startDate, end: endDate };
}

/**
 * Calculate credit days
 */
export function calculateCreditDays(invoiceDate: Date, paymentDate: Date): number {
  const diffTime = paymentDate.getTime() - invoiceDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Format as +91 XXXXX XXXXX if 10 digits
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }

  // Format as +91 XXXXX XXXXX if starts with 91 and has 12 digits
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91'));
}

/**
 * Format date to DD/MM/YYYY
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Calculate achievement percentage
 */
export function calculateAchievementPercentage(achieved: number, target: number): number {
  if (target === 0) return 0;
  return Math.round((achieved / target) * 100);
}
