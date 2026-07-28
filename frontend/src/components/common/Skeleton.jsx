import React from 'react';
import clsx from 'clsx';

const base = 'shimmer rounded-xl';

function SkeletonBox({ className }) {
  return <div className={clsx(base, className)} />;
}

/* ── Variants ─────────────────────────────────────────────────────────────── */

function ProductCardSkeleton() {
  return (
    <div className="bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden">
      <SkeletonBox className="w-full aspect-square rounded-none" />
      <div className="p-4 space-y-3">
        <SkeletonBox className="h-3 w-1/3" />
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-4/5" />
        <SkeletonBox className="h-3 w-1/2" />
        <SkeletonBox className="h-9 w-full mt-2" />
      </div>
    </div>
  );
}

function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="border-b border-dark-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBox className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <table className="w-full">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} cols={cols} />
        ))}
      </tbody>
    </table>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-dark-surface1 border border-dark-border rounded-2xl p-5 space-y-3">
      <SkeletonBox className="h-3 w-2/3" />
      <SkeletonBox className="h-8 w-1/2" />
      <SkeletonBox className="h-3 w-3/4" />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <SkeletonBox className="h-7 w-48" />
        <SkeletonBox className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
      </div>
      <ProductGridSkeleton count={8} />
    </div>
  );
}

/* ── Export ─────────────────────────────────────────────────────────────────── */
export default function Skeleton({ variant = 'box', className, ...props }) {
  switch (variant) {
    case 'product-card': return <ProductCardSkeleton />;
    case 'product-grid': return <ProductGridSkeleton {...props} />;
    case 'table':        return <TableSkeleton {...props} />;
    case 'stat-card':   return <StatCardSkeleton />;
    case 'page':         return <PageSkeleton />;
    default:             return <SkeletonBox className={clsx('h-4 w-full', className)} />;
  }
}
