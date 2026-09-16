import { cn } from '../lib/utils';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary:
      'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-600 hover:shadow-md hover:shadow-emerald-500/30',
    secondary:
      'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10',
    danger:
      'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-sm shadow-rose-500/30 hover:from-rose-600 hover:to-red-600',
    outline:
      'border border-brand-500/60 text-brand-700 hover:bg-brand-50 dark:border-brand-400/40 dark:text-brand-300 dark:hover:bg-brand-500/10',
    ghost:
      'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
