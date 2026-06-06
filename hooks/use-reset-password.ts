'use client';

import { useCallback, useEffect, useState } from 'react';
import { resetPassword } from '@/lib/auth';
import { formatPhone, PHONE_REGEX } from '@/lib/phone-utils';
import {
  getZodErrorMessage,
  registerOtpSchema,
} from '@/lib/registration-schema';
import {
  resetPasswordNewPasswordSchema,
  resetPasswordPhoneSchema,
} from '@/lib/password-schema';
import { sendVerificationCode, verifyCode } from '@/lib/mobizon';

export function useResetPassword() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const isPhoneValid = PHONE_REGEX.test(phone);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
    setError('');
  }, []);

  const sendCode = useCallback(async (): Promise<boolean> => {
    const parsed = resetPasswordPhoneSchema.safeParse({ phone });
    if (!parsed.success) {
      setError(getZodErrorMessage(parsed.error));
      return false;
    }

    setIsSendingCode(true);
    setError('');

    try {
      const result = await sendVerificationCode(phone, 'password_reset');
      if (result.success) {
        setCountdown(60);
        return true;
      }
      setError(result.message || 'Ошибка при отправке SMS. Попробуйте позже.');
      return false;
    } catch {
      setError('Ошибка при отправке SMS. Попробуйте позже.');
      return false;
    } finally {
      setIsSendingCode(false);
    }
  }, [phone]);

  const handleSendVerificationCode = useCallback(async () => {
    const ok = await sendCode();
    if (ok) setStep(2);
  }, [sendCode]);

  const handleVerifyCode = useCallback(async () => {
    const parsed = registerOtpSchema.safeParse({ verificationCode });
    if (!parsed.success) {
      setError(getZodErrorMessage(parsed.error));
      return;
    }

    setError('');
    try {
      const result = await verifyCode(phone, verificationCode, 'password_reset');
      if (result.success) {
        setStep(3);
      } else {
        setError(result.message || 'Неверный код верификации');
      }
    } catch {
      setError('Ошибка при проверке кода. Попробуйте позже.');
    }
  }, [phone, verificationCode]);

  const handleResendCode = useCallback(async () => {
    if (isSendingCode || countdown > 0) return;
    await sendCode();
  }, [isSendingCode, countdown, sendCode]);

  const handleResetPassword = useCallback(async () => {
    const parsed = resetPasswordNewPasswordSchema.safeParse({
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      setError(getZodErrorMessage(parsed.error));
      return;
    }

    setError('');
    setLoading(true);

    try {
      await resetPassword(phone, verificationCode, newPassword);
      setStep(4);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ошибка при сбросе пароля. Попробуйте позже.'
      );
    } finally {
      setLoading(false);
    }
  }, [phone, verificationCode, newPassword, confirmPassword]);

  const goBackToPhone = useCallback(() => {
    setStep(1);
    setError('');
    setVerificationCode('');
  }, []);

  const goBackToOtp = useCallback(() => {
    setStep(2);
    setError('');
  }, []);

  return {
    step,
    phone,
    verificationCode,
    setVerificationCode,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    isSendingCode,
    countdown,
    error,
    setError,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isPhoneValid,
    handlePhoneChange,
    handleSendVerificationCode,
    handleVerifyCode,
    handleResendCode,
    handleResetPassword,
    goBackToPhone,
    goBackToOtp,
  };
}

export type UseResetPasswordResult = ReturnType<typeof useResetPassword>;
