/**
 * Authentication Form Validation Utilities
 */

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
}

/**
 * Validates a work email address.
 * Rule: Required, must match valid email format regex.
 */
export const validateEmail = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Work email is required';
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid work email address';
  }
  return undefined;
};

/**
 * Validates a password.
 * Rule: Required, minimum reasonable length (at least 6 characters).
 */
export const validatePassword = (value: string): string | undefined => {
  if (!value) {
    return 'Password is required';
  }
  if (value.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return undefined;
};

/**
 * Validates all login form fields.
 */
export const validateLoginForm = (values: { email: string; password: string }): LoginFormErrors => {
  const errors: LoginFormErrors = {};
  const emailError = validateEmail(values.email);
  const passwordError = validatePassword(values.password);

  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;

  return errors;
};
