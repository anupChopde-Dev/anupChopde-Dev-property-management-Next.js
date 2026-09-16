import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Shared pill styling for rent/payment statuses. */
export function statusStyles(status) {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25';
    case 'Partial':
      return 'bg-amber-100 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25';
    case 'Pending':
      return 'bg-rose-100 text-rose-700 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/25';
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-white/10 dark:text-slate-300 dark:ring-white/15';
  }
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTHS = MONTH_NAMES;

/** "2026-09" -> "September 2026" */
export function monthLabel(billingMonth) {
  if (!billingMonth) return '';
  const [y, m] = billingMonth.split('-').map(Number);
  if (!y || !m) return billingMonth;
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

/** Current billing month as "YYYY-MM" */
export function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Options for month/year filter dropdowns */
export function monthOptions(back = 12, forward = 1) {
  const options = [];
  const now = new Date();
  for (let i = -back; i <= forward; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    options.push({ value, label: monthLabel(value) });
  }
  return options;
}
