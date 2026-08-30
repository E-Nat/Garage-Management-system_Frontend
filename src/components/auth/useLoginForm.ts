import React, { useState, useCallback } from 'react';
import { LoginFormErrors, validateEmail, validatePassword, validateLoginForm } from './validation';

export interface UseLoginFormReturn {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  toggleShowPassword: () => void;
  isLoading: boolean;
  errors: LoginFormErrors;
  touched: { email?: boolean; password?: boolean };
  statusNotice: string | null;
  handleEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEmailBlur: () => void;
  handlePasswordBlur: () => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

/**
 * Custom hook to manage Login Form state and validation.
 */
export const useLoginForm = (): UseLoginFormReturn => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    setStatusNotice(null);
    if (touched.email || errors.email) {
      const err = validateEmail(val);
      setErrors((prev) => ({ ...prev, email: err }));
    }
  }, [touched.email, errors.email]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    setStatusNotice(null);
    if (touched.password || errors.password) {
      const err = validatePassword(val);
      setErrors((prev) => ({ ...prev, password: err }));
    }
  }, [touched.password, errors.password]);

  const handleEmailBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, email: true }));
    const err = validateEmail(email);
    setErrors((prev) => ({ ...prev, email: err }));
  }, [email]);

  const handlePasswordBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, password: true }));
    const err = validatePassword(password);
    setErrors((prev) => ({ ...prev, password: err }));
  }, [password]);

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatusNotice(null);

    // Validate all inputs on submission
    const formErrors = validateLoginForm({ email, password });
    setTouched({ email: true, password: true });
    setErrors(formErrors);

    // If validation fails, halt execution
    if (Object.keys(formErrors).length > 0) {
      return;
    }

    // Valid frontend state: show loading state without faking authentication
    setIsLoading(true);

    // TODO: Connect POST /api/auth/login
    setTimeout(() => {
      setIsLoading(false);
      setStatusNotice('Workstation credentials validated. Ready for backend authentication.');
    }, 1400);
  }, [email, password]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    showPassword,
    setShowPassword,
    toggleShowPassword,
    isLoading,
    errors,
    touched,
    statusNotice,
    handleEmailChange,
    handlePasswordChange,
    handleEmailBlur,
    handlePasswordBlur,
    handleSubmit,
  };
};
