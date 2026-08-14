// ── Currency ──────────────────────────────────────────────────────────────────
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount ?? 0);

export const formatCompact = (amount) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(amount);

// ── Date & Time ───────────────────────────────────────────────────────────────
export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export const formatDateTime = (dateStr) =>
  new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export const timeAgo = (dateStr) => {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// ── Numbers ───────────────────────────────────────────────────────────────────
export const formatNumber = (n) =>
  new Intl.NumberFormat('en-US').format(n ?? 0);

export const calcDiscount = (price, oldPrice) =>
  oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

// ── Strings ───────────────────────────────────────────────────────────────────
export const truncate = (str, n = 60) =>
  str?.length > n ? str.slice(0, n) + '…' : str;

export const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

export const initials = (name) =>
  name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

// ── Order Status ──────────────────────────────────────────────────────────────
export const ORDER_STATUS_CONFIG = {
  ORDER_PLACED:     { label: 'Order Placed',     color: 'info',    icon: '✅' },
  CONFIRMED:        { label: 'Order Confirmed',  color: 'info',    icon: '📝' },
  PROCESSING:       { label: 'Processing',       color: 'warning', icon: '⚙️' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'info',    icon: '🚚' },
  DELIVERED:        { label: 'Delivered',        color: 'success', icon: '📦' },
  CANCELLED:        { label: 'Cancelled',        color: 'danger',  icon: '❌' },
  REFUND_REQUESTED: { label: 'Refund Requested', color: 'warning', icon: '🔄' },
  REFUNDED:         { label: 'Refunded',         color: 'neutral', icon: '↩️' },
  REFUND_REJECTED:  { label: 'Refund Rejected',  color: 'danger',  icon: '🚫' },
};

export const getStatusConfig = (status) =>
  ORDER_STATUS_CONFIG[status?.toUpperCase()] ?? { label: status, color: 'neutral', icon: '•' };
