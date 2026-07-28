import React from 'react';
import clsx from 'clsx';

const VARIANTS = {
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  danger:  'bg-red-500/10  text-red-400  border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  info:    'bg-sky-500/10  text-sky-400  border-sky-500/20',
  purple:  'bg-brand-500/10 text-brand-300 border-brand-500/20',
  neutral: 'bg-white/5 text-gray-400 border-white/10',
};

export default function Badge({ children, variant = 'neutral', className, dot }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border',
        VARIANTS[variant] || VARIANTS.neutral,
        className,
      )}
    >
      {dot && (
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full',
          variant === 'success' ? 'bg-green-400' :
          variant === 'danger'  ? 'bg-red-400'   :
          variant === 'warning' ? 'bg-amber-400' :
          variant === 'info'    ? 'bg-sky-400'   : 'bg-gray-400'
        )} />
      )}
      {children}
    </span>
  );
}
