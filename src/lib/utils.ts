import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Arabic month names
const arabicMonths = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// Arabic day names
const arabicDays = [
  'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
];

/**
 * Format date in Arabic (Egyptian) format
 * @param date - Date object or string
 * @param includeTime - Whether to include time
 * @returns Formatted Arabic date string
 */
export function formatDateArabic(date: Date | string, includeTime: boolean = false): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const day = d.getDate();
  const month = arabicMonths[d.getMonth()];
  const year = d.getFullYear();
  
  if (includeTime) {
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    const formattedHours = hours % 12 || 12;
    return `${day} ${month} ${year}، ${formattedHours}:${minutes} ${ampm}`;
  }
  
  return `${day} ${month} ${year}`;
}

/**
 * Format date for input fields (YYYY-MM-DD format)
 * @param date - Date object or string
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/**
 * Format date and time in Arabic (Egyptian) format
 * @param date - Date object or string
 * @returns Formatted Arabic date and time string
 */
export function formatDateTimeArabic(date: Date | string): string {
  return formatDateArabic(date, true);
}

/**
 * Format number with thousand separators for better readability
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string with separators
 * 
 * @example
 * formatNumber(1000000) // "1,000,000"
 * formatNumber(1234567.89, 2) // "1,234,567.89"
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format currency in Arabic (Egyptian Pounds) with thousand separators
 * @param amount - Amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1000000) // "1,000,000 ج.م"
 * formatCurrency(1234567.89) // "1,234,567.89 ج.م"
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formatted} ج.م`;
}

/**
 * Format currency using Intl.NumberFormat with Arabic locale
 * @param amount - Amount to format
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrencyIntl(1000000) // "١٬٠٠٠٬٠٠٠٫٠٠ ج.م.إ."
 */
export function formatCurrencyIntl(amount: number): string {
  return new Intl.NumberFormat('ar-EG', { 
    style: 'currency', 
    currency: 'EGP' 
  }).format(amount);
}
