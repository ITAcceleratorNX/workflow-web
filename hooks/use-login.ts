'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, loginWithPhone } from '@/lib/auth';
import { formatPhone, PHONE_REGEX } from '@/lib/phone-utils';
import {
  clearPendingRequestId,
  getPendingRequestId,
  getRequestRedirectUrl,
} from '@/lib/shareRequest';
import { useIsDesktop } from '@/hooks/use-media-query';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useStatsStore } from '@/stores/statsStore';

export interface UseLoginResult {
  phone: string;
  password: string;
  phoneError: string;
  passwordError: string;
  formError: string;
  loading: boolean;
  showPassword: boolean;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleShowPassword: () => void;
  handleLogin: () => Promise<void>;
  handleRegister: () => void;
  handleGuestLogin: () => void;
}

export function useLogin(): UseLoginResult {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { role, token, setGuestAuth } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token || !role) return;

    const requestId = getPendingRequestId();
    const url = requestId
      ? getRequestRedirectUrl(role, requestId, isDesktop)
      : role.toLowerCase() === 'client'
        ? '/client'
        : `/${role?.toLowerCase().replace(' ', '-') || ''}`;

    if (requestId) clearPendingRequestId();
    router.replace(url);
  }, [token, role, router, isDesktop]);

  const validate = useCallback(() => {
    let isValid = true;
    setPhoneError('');
    setPasswordError('');
    setFormError('');

    if (!phone || !PHONE_REGEX.test(phone)) {
      setPhoneError('Введите корректный номер телефона в формате +7 XXX XXX XX XX');
      isValid = false;
    }

    if (!password || password.length < 6) {
      setPasswordError('Пароль должен содержать минимум 6 символов');
      isValid = false;
    }

    return isValid;
  }, [phone, password]);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
    setPhoneError('');
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordError('');
  }, []);

  const handleLogin = useCallback(async () => {
    if (!validate()) return;

    setLoading(true);
    setFormError('');

    try {
      const data = await loginWithPhone(phone, password);
      const userData = await getCurrentUser(data.token);
      const userRole = data.role || 'client';

      useAuthStore.getState().setAuth(data.token, userRole, userData);
      useStatsStore.getState().fetchStats(userRole);
      useCategoryStore.getState().fetchCategories(data.token);

      const requestId = getPendingRequestId();
      if (requestId) {
        const url = getRequestRedirectUrl(userRole, requestId, isDesktop);
        clearPendingRequestId();
        router.push(url);
        return;
      }

      if (userRole.toLowerCase() === 'client') {
        router.push('/client');
      } else {
        router.push(`/${userRole.toLowerCase().replace(' ', '-')}`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Произошла ошибка при входе. Попробуйте позже.';
      setFormError(message);
    } finally {
      setLoading(false);
    }
  }, [phone, password, validate, router, isDesktop]);

  const handleRegister = useCallback(() => {
    router.push('/register');
  }, [router]);

  const handleGuestLogin = useCallback(() => {
    setGuestAuth();
    router.push('/client');
  }, [router, setGuestAuth]);

  return {
    phone,
    password,
    phoneError,
    passwordError,
    formError,
    loading,
    showPassword,
    handlePhoneChange,
    handlePasswordChange,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    handleLogin,
    handleRegister,
    handleGuestLogin,
  };
}
