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

export function validateAndNormalizePhone(phoneInput: string): PhoneValidationResult {
  const trimmed = (phoneInput || '').trim();
  if (!trimmed) {
    return { isValid: true, normalized: '' };
  }

  // Check valid characters: digits, plus, spaces, dashes, dots, parentheses
  if (!/^[+0-9\s\-().]{7,25}$/.test(trimmed)) {
    return {
      isValid: false,
      normalized: '',
      error: 'Phone number contains invalid characters.',
    };
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return {
      isValid: false,
      normalized: '',
      error: 'Phone number must have between 7 and 15 digits.',
    };
  }

  // Cambodian phone numbers: starts with country code 855 or domestic prefix 0
  if (digits.startsWith('855')) {
    const national = digits.substring(3).replace(/^0+/, '');
    if (national.length >= 7 && national.length <= 9) {
      return { isValid: true, normalized: `0${national}` };
    }
  } else if (digits.startsWith('0')) {
    const national = digits.replace(/^0+/, '');
    if (national.length >= 7 && national.length <= 9) {
      return { isValid: true, normalized: `0${national}` };
    }
  } else if (digits.length >= 7 && digits.length <= 9 && !digits.startsWith('1')) {
    // Domestic Cambodian without leading 0
    return { isValid: true, normalized: `0${digits}` };
  }

  // North American numbers
  if (digits.startsWith('1') && digits.length === 11) {
    return { isValid: true, normalized: `+1${digits.substring(1)}` };
  }

  // International format with leading +
  if (trimmed.startsWith('+')) {
    return { isValid: true, normalized: `+${digits}` };
  }

  return { isValid: true, normalized: trimmed };
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
