// ── Roles ─────────────────────────────────────────────────────────────────────
export const ROLES = {
  USER:   'USER',
  VENDOR: 'VENDOR',
  ADMIN:  'ADMIN',
};

// ── Order Statuses ────────────────────────────────────────────────────────────
export const ORDER_STATUSES = [
  'ORDER_PLACED', 'CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED',
  'CANCELLED', 'REFUND_REQUESTED', 'REFUNDED', 'REFUND_REJECTED',
];


// ── Sort Options ──────────────────────────────────────────────────────────────
export const SORT_OPTIONS = [
  { value: 'createdAt,desc',  label: 'Newest First'      },
  { value: 'price,asc',       label: 'Price: Low → High' },
  { value: 'price,desc',      label: 'Price: High → Low' },
  { value: 'ratingAvg,desc',  label: 'Best Rated'        },
  { value: 'ratingCount,desc',label: 'Most Reviewed'     },
];

// ── Payment Methods ───────────────────────────────────────────────────────────
export const PAYMENT_METHODS = [
  { id: 'CARD',   label: 'Credit / Debit Card', icon: '💳' },
  { id: 'UPI',    label: 'UPI',                 icon: '📱' },
  { id: 'COD',    label: 'Cash on Delivery',    icon: '💵' },
];

// ── Shipping Options ──────────────────────────────────────────────────────────
export const SHIPPING_OPTIONS = [
  { id: 'STANDARD', label: 'Standard',  desc: '5-7 business days', price: 0,   threshold: 999 },
  { id: 'EXPRESS',  label: 'Express',   desc: '2-3 business days', price: 299, threshold: null },
  { id: 'OVERNIGHT',label: 'Overnight', desc: 'Next day delivery', price: 599, threshold: null },
];

// ── Pagination ────────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 12;

// ── Local Storage Keys ────────────────────────────────────────────────────────
export const LS_KEYS = {
  ACCESS_TOKEN:  'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  CART:          'shopeasy_cart',
  WISHLIST:      'shopeasy_wishlist',
  THEME:         'shopeasy_theme',
};
