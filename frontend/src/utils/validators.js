// ── Auth ──────────────────────────────────────────────────────────────────────
export const GMAIL_REGEX = /^[A-Z0-9._%+-]+@gmail\.com$/i;
export const ADMIN_EMAIL = 'admin@shopeasy.in';

export const emailRules = {
  required: 'Email is required',
  validate: (val) => {
    if (!val) return 'Email is required';
    const trimmed = val.trim();
    if (trimmed.toLowerCase() === ADMIN_EMAIL) return true;
    if (trimmed.toLowerCase().includes('admin') || trimmed.toLowerCase().endsWith('@shopeasy.in') || trimmed.toLowerCase().endsWith('@shopeasy.com')) {
      return 'Invalid Admin credentials.';
    }
    if (!GMAIL_REGEX.test(trimmed)) {
      return 'Only Gmail addresses (@gmail.com) are allowed';
    }
    return true;
  },
};

export const gmailOnlyRules = {
  required: 'Email is required',
  validate: (val) => {
    if (!val) return 'Email is required';
    const trimmed = val.trim();
    if (!GMAIL_REGEX.test(trimmed)) {
      return 'Only Gmail addresses (@gmail.com) are allowed';
    }
    return true;
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

export const getPostalCodeLabel = (country = '') => {
  const c = String(country || '').trim().toLowerCase();
  if (c === 'india' || c === 'in') {
    return 'POSTAL CODE / PIN CODE';
  }
  if (c === 'united states' || c === 'us' || c === 'usa') {
    return 'ZIP CODE';
  }
  return 'POSTAL CODE / ZIP CODE';
};

export const zipRules = {
  required: 'Postal/ZIP code is required',
  validate: (val, formValues) => {
    if (!val || !String(val).trim()) return 'Postal/ZIP code is required';
    const trimmed = String(val).trim();
    const country = String(formValues?.shippingCountry || '').trim().toLowerCase();

    if (country === 'india' || country === 'in') {
      if (!/^\d{6}$/.test(trimmed)) {
        return 'Enter a valid 6-digit PIN code';
      }
      return true;
    }

    if (country === 'united states' || country === 'us' || country === 'usa') {
      if (!/^\d{5}(-\d{4})?$/.test(trimmed)) {
        return 'Enter a valid ZIP code (e.g. 10001)';
      }
      return true;
    }

    if (country === 'united kingdom' || country === 'uk' || country === 'gb') {
      if (!/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(trimmed)) {
        return 'Enter a valid UK postal code';
      }
      return true;
    }

    if (country === 'canada' || country === 'ca') {
      if (!/^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i.test(trimmed)) {
        return 'Enter a valid Canadian postal code';
      }
      return true;
    }

    if (country === 'australia' || country === 'au') {
      if (!/^\d{4}$/.test(trimmed)) {
        return 'Enter a valid 4-digit postal code';
      }
      return true;
    }

    // Default fallback for other countries
    if (!/^[A-Z0-9\s\-]{3,10}$/i.test(trimmed)) {
      return 'Enter a valid postal code';
    }
    return true;
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
