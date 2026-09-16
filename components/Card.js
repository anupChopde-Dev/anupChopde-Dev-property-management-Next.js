import { cn } from '../lib/utils';

/**
 * Soft rounded surface with a subtle shadow and dark-mode support.
 * Pass a hover shadow/translate via className when the card is clickable.
 */
export default function Card({ children, className = '' }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-900/5 transition-all duration-300',
        'dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/20',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6 dark:border-white/5',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={cn('p-5 sm:p-6', className)}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3
      className={cn(
        'text-base font-semibold tracking-tight text-slate-900 dark:text-white',
        className
      )}
    >
      {children}
    </h3>
  );
}
