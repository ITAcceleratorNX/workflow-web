'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  COMPANY_OTHER_VALUE,
  INITIAL_REGISTRATION_FORM,
  type RegistrationCompany,
  type RegistrationFormData,
  type RegistrationOffice,
  type RegistrationServiceCategory,
} from '@/constants/registration';
import { formatServiceCategoryDisplayName } from '@/constants/requests';
import { useSuccessModal } from '@/hooks/use-success-modal';
import { api, getOfficeCompanies, getServiceCategoriesPublic } from '@/lib/api';
import { formatPhone } from '@/lib/phone-utils';
import {
  getZodErrorMessage,
  registerOtpSchema,
  registerPasswordSchema,
  registerStep1Schema,
} from '@/lib/registration-schema';
import { sendVerificationCode, verifyCode } from '@/lib/mobizon';

export function useRegister() {
  const router = useRouter();
  const successModal = useSuccessModal();

  const [formData, setFormData] = useState<RegistrationFormData>(INITIAL_REGISTRATION_FORM);
  const [offices, setOffices] = useState<RegistrationOffice[]>([]);
  const [categories, setCategories] = useState<RegistrationServiceCategory[]>([]);
  const [companies, setCompanies] = useState<RegistrationCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    api
      .get<RegistrationOffice[]>('/offices')
      .then((response) => setOffices(response.data))
      .catch((error) => console.error('Ошибка при загрузке офисов:', error));
  }, []);

  useEffect(() => {
    const officeId = Number(formData.office_id);
    if (!officeId) {
      setCategories([]);
      return;
    }
    let cancelled = false;
    getServiceCategoriesPublic(officeId)
      .then((list) => {
        if (!cancelled) setCategories(list);
      })
      .catch((error) => {
        console.error('Ошибка при загрузке категорий:', error);
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [formData.office_id]);

  useEffect(() => {
    const officeId = formData.office_id;
    if (!officeId) {
      setCompanies([]);
      return;
    }
    let cancelled = false;
    getOfficeCompanies(Number(officeId))
      .then((list) => {
        if (!cancelled) setCompanies(list);
      })
      .catch((error) => {
        console.error('Ошибка при загрузке компаний:', error);
        if (!cancelled) setCompanies([]);
      });
    return () => {
      cancelled = true;
    };
  }, [formData.office_id]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const isStep1Valid = useMemo(
    () => registerStep1Schema.safeParse(formData).success,
    [formData]
  );

  const updateField = useCallback(
    <K extends keyof RegistrationFormData>(key: K, value: RegistrationFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData((prev) => ({ ...prev, phone: formatted }));
    setFormErrors(null);
    setCodeSent(false);
    setVerificationCode('');
  }, []);

  const sendCode = useCallback(async (): Promise<boolean> => {
    const phoneCheck = registerStep1Schema.shape.phone.safeParse(formData.phone);
    if (!phoneCheck.success) {
      setFormErrors(getZodErrorMessage(phoneCheck.error));
      return false;
    }

    setIsSendingCode(true);
    setFormErrors(null);

    try {
      const result = await sendVerificationCode(formData.phone, 'registration');
      if (result.success) {
        setCodeSent(true);
        setCountdown(60);
        return true;
      }
      setFormErrors(result.message || 'Ошибка при отправке SMS. Попробуйте позже.');
      return false;
    } catch {
      setFormErrors('Ошибка при отправке SMS. Попробуйте позже.');
      return false;
    } finally {
      setIsSendingCode(false);
    }
  }, [formData.phone]);

  /** Desktop: переход на шаг 2 сразу, SMS в фоне (прежнее поведение). */
  const handleDesktopStep1Next = useCallback(() => {
    const parsed = registerStep1Schema.safeParse(formData);
    if (!parsed.success) {
      setFormErrors(getZodErrorMessage(parsed.error));
      return;
    }
    setStep(2);
    setFormErrors(null);
    if (!codeSent) void sendCode();
  }, [formData, codeSent, sendCode]);

  /** Mobile: как RN — SMS успешно → шаг 2. */
  const handleMobileStep1Next = useCallback(async () => {
    const parsed = registerStep1Schema.safeParse(formData);
    if (!parsed.success) {
      setFormErrors(getZodErrorMessage(parsed.error));
      return;
    }
    const ok = await sendCode();
    if (ok) setStep(2);
  }, [formData, sendCode]);

  const handleVerifyCode = useCallback(async () => {
    const parsed = registerOtpSchema.safeParse({ verificationCode });
    if (!parsed.success) {
      setFormErrors(getZodErrorMessage(parsed.error));
      return;
    }

    setFormErrors(null);
    try {
      const result = await verifyCode(formData.phone, verificationCode, 'registration');
      if (result.success) {
        setStep(3);
      } else {
        setFormErrors(result.message || 'Неверный код верификации');
      }
    } catch {
      setFormErrors('Ошибка при проверке кода. Попробуйте позже.');
    }
  }, [formData.phone, verificationCode]);

  const handleResendCode = useCallback(async () => {
    if (isSendingCode || countdown > 0) return;
    await sendCode();
  }, [isSendingCode, countdown, sendCode]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const parsed = registerPasswordSchema.safeParse(formData);
      if (!parsed.success) {
        setFormErrors(getZodErrorMessage(parsed.error));
        return;
      }

      setFormErrors(null);
      setLoading(true);

      try {
        const {
          phone,
          full_name,
          office_id,
          role,
          service_category_id,
          company_id,
          company_other_name,
          password,
        } = formData;

        const requestData: Record<string, string | number> = {
          phone,
          full_name,
          office_id: parseInt(office_id, 10),
          role,
          password,
        };

        if (role === 'executor' && service_category_id) {
          requestData.service_category_id = parseInt(service_category_id, 10);
        }

        if (role === 'client') {
          if (company_id === COMPANY_OTHER_VALUE) {
            requestData.company_other_name = company_other_name.trim();
          } else if (company_id) {
            requestData.company_id = parseInt(company_id, 10);
          }
        }

        await api.post('/registration-requests', requestData);
        successModal.showSuccess();
        setFormData(INITIAL_REGISTRATION_FORM);
        setStep(1);
        setVerificationCode('');
        setCodeSent(false);
        setCountdown(0);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } } };
        setFormErrors(err.response?.data?.error || 'Произошла ошибка при отправке запроса');
      } finally {
        setLoading(false);
      }
    },
    [formData, successModal]
  );

  const handleSuccessClose = useCallback(() => {
    successModal.hideSuccess();
    router.push('/login');
  }, [router, successModal]);

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: c.id.toString(),
        label: formatServiceCategoryDisplayName(c.name),
      })),
    [categories]
  );

  return {
    formData,
    setFormData,
    updateField,
    offices,
    categories,
    companies,
    categoryOptions,
    loading,
    step,
    setStep,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    formErrors,
    setFormErrors,
    verificationCode,
    setVerificationCode,
    isSendingCode,
    codeSent,
    countdown,
    isStep1Valid,
    handlePhoneChange,
    handleDesktopStep1Next,
    handleMobileStep1Next,
    handleVerifyCode,
    handleResendCode,
    handleSubmit,
    successModal,
    handleSuccessClose,
  };
}

export type UseRegisterResult = ReturnType<typeof useRegister>;
