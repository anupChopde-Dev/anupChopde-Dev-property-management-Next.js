import { cn } from '../lib/utils';

const fieldClasses =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm shadow-slate-900/5 transition placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500';

export default function Input({ className = '', ...props }) {
  return <input className={cn(fieldClasses, className)} {...props} />;
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={cn(fieldClasses, 'resize-none', className)} {...props} />;
}

export function Label({ children, className = '', ...props }) {
  return (
    <label
      className={cn(
        'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300',
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}
