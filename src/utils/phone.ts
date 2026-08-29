/**
 * Phone Number Validation and Normalization Utility
 * Supports Cambodian domestic numbers (e.g. 086401600, 0123456789, 0971234567)
 * and international formats (e.g. +85586401600, +855 86 401 600)
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Sanitizes input to accept digits only with maximum length limit.
 * Blocks letters, special characters, spaces, and hyphens.
 */
export function sanitizePhoneDigits(input: string, maxDigits: number = 10): string {
  if (!input) return '';
  return input.replace(/\D/g, '').slice(0, maxDigits);
}

export function validateAndNormalizePhone(phoneInput: string): PhoneValidationResult {
  const trimmed = (phoneInput || '').trim();
  if (!trimmed) {
    return { isValid: true, normalized: '' };
  }

  // Extract digits
  const digits = trimmed.replace(/\D/g, '');

  // 1. Cambodian numbers starting with +855 or 855
  if (digits.startsWith('855')) {
    const national = digits.substring(3).replace(/^0+/, '');
    if (national.length >= 7 && national.length <= 9) {
      return { isValid: true, normalized: `+855${national}` };
    }
  }

  // 2. Local Cambodian numbers starting with 0 (e.g. 086401600, 0123456789, 0971234567)
  if (digits.startsWith('0')) {
    const national = digits.replace(/^0+/, '');
    if (national.length >= 7 && national.length <= 9 && digits.length <= 10) {
      return { isValid: true, normalized: `+855${national}` };
    }
  }

  // 3. 8-9 digits without leading 0
  if (digits.length >= 7 && digits.length <= 9 && !digits.startsWith('1')) {
    return { isValid: true, normalized: `+855${digits}` };
  }

  // If input does not match valid Cambodian formats
  return {
    isValid: false,
    normalized: '',
    error: 'Please enter a valid Cambodian phone number.',
  };
}

/**
 * Validates whether a given string is a valid personal name
 * and ensures it is not an email address.
 */
export function validatePersonName(nameInput: string): { isValid: boolean; error?: string } {
  const trimmed = (nameInput || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Full Name is required.' };
  }

  if (trimmed.includes('@') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { isValid: false, error: "Full Name must be a person's name, not an email address." };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Full Name must be at least 2 characters long.' };
  }

  return { isValid: true };
}

/**
 * Validates email format.
 */
export function validateEmail(emailInput: string): { isValid: boolean; error?: string } {
  const trimmed = (emailInput || '').trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. user@gmail.com).' };
  }

  return { isValid: true };
}
