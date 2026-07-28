// ── Auth ──────────────────────────────────────────────────────────────────────
export const emailRules = {
  required: 'Email is required',
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'Please enter a valid email address',
  },
};

export const passwordRules = {
  required: 'Password is required',
  minLength: { value: 8, message: 'Password must be at least 8 characters' },
  pattern: {
    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: 'Password must contain uppercase, lowercase, and a number',
  },
};

export const nameRules = {
  required: 'This field is required',
  minLength: { value: 2, message: 'Must be at least 2 characters' },
  maxLength: { value: 50, message: 'Must be under 50 characters' },
};

export const phoneRules = {
  pattern: {
    value: /^\+?[\d\s\-()]{7,15}$/,
    message: 'Please enter a valid phone number',
  },
};

// ── Product ───────────────────────────────────────────────────────────────────
export const priceRules = {
  required: 'Price is required',
  min: { value: 0.01, message: 'Price must be greater than 0' },
  max: { value: 99999.99, message: 'Price too high' },
};

export const stockRules = {
  required: 'Stock quantity is required',
  min: { value: 0, message: 'Stock cannot be negative' },
};

// ── Address ───────────────────────────────────────────────────────────────────
export const addressRules = {
  required: 'Address is required',
  minLength: { value: 5, message: 'Please enter a full address' },
};

export const zipRules = {
  required: 'ZIP code is required',
  pattern: {
    value: /^\d{5}(-\d{4})?$/,
    message: 'Enter a valid ZIP code (e.g. 10001)',
  },
};

// ── Credit Card ───────────────────────────────────────────────────────────────
export const cardNumberRules = {
  required: 'Card number is required',
  pattern: {
    value: /^[\d\s]{13,19}$/,
    message: 'Enter a valid card number',
  },
};

export const cvvRules = {
  required: 'CVV is required',
  pattern: { value: /^\d{3,4}$/, message: 'CVV must be 3 or 4 digits' },
};

export const expiryRules = {
  required: 'Expiry date is required',
  pattern: {
    value: /^(0[1-9]|1[0-2])\/\d{2}$/,
    message: 'Format: MM/YY',
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export const confirmPasswordRules = (getValues) => ({
  required: 'Please confirm your password',
  validate: (val) => val === getValues('password') || 'Passwords do not match',
});
