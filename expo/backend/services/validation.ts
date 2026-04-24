type ValidationRule = {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'email' | 'array';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
};

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validate(data: Record<string, any>, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    const value = data[rule.field];

    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(rule.message || `${rule.field} is required`);
      continue;
    }

    if (value === undefined || value === null || value === '') continue;

    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(rule.message || `${rule.field} must be a string`);
        } else {
          if (rule.min !== undefined && value.length < rule.min) {
            errors.push(rule.message || `${rule.field} must be at least ${rule.min} characters`);
          }
          if (rule.max !== undefined && value.length > rule.max) {
            errors.push(rule.message || `${rule.field} must be at most ${rule.max} characters`);
          }
          if (rule.pattern && !rule.pattern.test(value)) {
            errors.push(rule.message || `${rule.field} has invalid format`);
          }
        }
        break;

      case 'number':
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (typeof num !== 'number' || isNaN(num)) {
          errors.push(rule.message || `${rule.field} must be a number`);
        } else {
          if (rule.min !== undefined && num < rule.min) {
            errors.push(rule.message || `${rule.field} must be at least ${rule.min}`);
          }
          if (rule.max !== undefined && num > rule.max) {
            errors.push(rule.message || `${rule.field} must be at most ${rule.max}`);
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(rule.message || `${rule.field} must be a boolean`);
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !EMAIL_REGEX.test(value)) {
          errors.push(rule.message || `${rule.field} must be a valid email address`);
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(rule.message || `${rule.field} must be an array`);
        }
        break;
    }
  }

  return { valid: errors.length === 0, errors };
}

export const SEARCH_RULES: ValidationRule[] = [
  { field: 'destination', type: 'string', min: 1, max: 200, message: 'Destination is required' },
  { field: 'guests', type: 'number', min: 1, max: 99, message: 'Guests must be between 1 and 99' },
  { field: 'radiusKm', type: 'number', min: 1, max: 500, message: 'Radius must be between 1 and 500 km' },
];

export const CHECKOUT_RULES: ValidationRule[] = [
  { field: 'bookingId', type: 'string', required: true, min: 1, message: 'Booking ID is required' },
  { field: 'basePrice', type: 'number', required: true, min: 0.5, max: 100000, message: 'Price must be between 0.50 and 100,000' },
  { field: 'currency', type: 'string', required: true, min: 3, max: 3, message: 'Currency must be a 3-letter code' },
];

export const CONTACT_RULES: ValidationRule[] = [
  { field: 'name', type: 'string', required: true, min: 1, max: 200 },
  { field: 'email', type: 'email', required: true },
  { field: 'subject', type: 'string', required: true, min: 1, max: 500 },
  { field: 'message', type: 'string', required: true, min: 1, max: 5000 },
];

export const PAYMENT_INTENT_RULES: ValidationRule[] = [
  { field: 'activityId', type: 'string', required: true },
  { field: 'amount', type: 'number', required: true, min: 0.5, max: 100000 },
  { field: 'currency', type: 'string', required: true, min: 3, max: 3 },
];

export const REDIRECT_BOOK_RULES: ValidationRule[] = [
  { field: 'activityId', type: 'string', required: true },
];

export function sanitizeString(input: string | undefined | null): string {
  if (!input) return '';
  return String(input)
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 10000);
}
