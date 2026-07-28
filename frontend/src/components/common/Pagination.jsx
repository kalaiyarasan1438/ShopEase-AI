import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import clsx from 'clsx';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const range = 2; // pages around current

  for (let i = 0; i < totalPages; i++) {
    if (
      i === 0 ||
      i === totalPages - 1 ||
      (i >= page - range && i <= page + range)
    ) {
      pages.push(i);
    } else if (
      (i === page - range - 1 || i === page + range + 1) &&
      pages[pages.length - 1] !== '…'
    ) {
      pages.push('…');
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <FiChevronLeft size={15} />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-600 text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={clsx(
              'w-9 h-9 flex items-center justify-center rounded-xl border text-sm font-medium transition-all',
              p === page
                ? 'bg-brand-600 border-brand-500 text-white'
                : 'border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20'
            )}
          >
            {p + 1}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages - 1}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <FiChevronRight size={15} />
      </button>
    </div>
  );
}
