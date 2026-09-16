import { cn } from '../lib/utils';

export default function Card({ children, className = '' }) {
  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={cn('p-6 border-b border-gray-200', className)}>{children}</div>;
}

export function CardContent({ children, className = '' }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={cn('text-lg font-semibold text-gray-800', className)}>{children}</h3>;
}
