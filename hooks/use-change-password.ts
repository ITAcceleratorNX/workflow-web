'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { changePassword } from '@/lib/auth';
import { getZodErrorMessage } from '@/lib/registration-schema';
import { changePasswordSchema } from '@/lib/password-schema';

export function useChangePassword(options?: { onSuccess?: () => void }) {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const handleChangePassword = useCallback(async () => {
    const parsed = changePasswordSchema.safeParse({
      oldPassword,
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      setPasswordError(getZodErrorMessage(parsed.error));
      setPasswordSuccess('');
      return;
    }

    setPasswordError('');
    setPasswordSuccess('');
    setIsChanging(true);

    try {
      await changePassword({
        currentPassword: oldPassword,
        newPassword,
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Пароль изменён.');
      options?.onSuccess?.();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Ошибка при смене пароля';
      setPasswordError(message);
    } finally {
      setIsChanging(false);
    }
  }, [oldPassword, newPassword, confirmPassword, options]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return {
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    setPasswordError,
    passwordSuccess,
    isChanging,
    handleChangePassword,
    handleBack,
  };
}

export type UseChangePasswordResult = ReturnType<typeof useChangePassword>;
