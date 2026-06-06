import { z } from 'zod';
import { COMPANY_OTHER_VALUE } from '@/constants/registration';
import { PHONE_REGEX } from '@/lib/phone-utils';

export const registerStep1Schema = z
  .object({
    phone: z
      .string()
      .regex(PHONE_REGEX, 'Введите корректный номер телефона в формате +7 XXX XXX XX XX'),
    full_name: z.string().trim().min(1, 'Введите ФИО'),
    office_id: z.string().min(1, 'Выберите офис'),
    role: z.enum(['client', 'executor'], { message: 'Выберите роль' }),
    service_category_id: z.string().optional(),
    company_id: z.string().optional(),
    company_other_name: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'executor' && !data.service_category_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Выберите категорию услуг',
        path: ['service_category_id'],
      });
    }
    if (data.role === 'client') {
      if (!data.company_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Выберите компанию',
          path: ['company_id'],
        });
      }
      if (
        data.company_id === COMPANY_OTHER_VALUE &&
        !data.company_other_name?.trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Укажите название компании',
          path: ['company_other_name'],
        });
      }
    }
  });

export const registerOtpSchema = z.object({
  verificationCode: z.string().length(6, 'Введите код из 6 цифр'),
});

export const registerPasswordSchema = z
  .object({
    password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Пароли не совпадают',
    path: ['confirm_password'],
  });

export function getZodErrorMessage(error: z.ZodError): string {
  return error.errors[0]?.message ?? 'Проверьте данные формы';
}
