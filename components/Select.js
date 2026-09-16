import { cn } from '../lib/utils';

/**
 * Native select styled to match Input. Callers usually pass `w-full`
 * or drop it inside a responsive grid.
 */
export default function Select({ className = '', children, ...props }) {
  return (
    <select
      className={cn(
        'w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm shadow-slate-900/5 transition',
        'focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10',
        'dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:[color-scheme:dark]',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
