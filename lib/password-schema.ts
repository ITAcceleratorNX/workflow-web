import { z } from 'zod';
import { PHONE_REGEX } from '@/lib/phone-utils';

export const resetPasswordPhoneSchema = z.object({
  phone: z
    .string()
    .regex(PHONE_REGEX, 'Введите корректный номер телефона в формате +7 XXX XXX XX XX'),
});

export const resetPasswordOtpSchema = z.object({
  verificationCode: z.string().length(6, 'Введите код из 6 цифр'),
});

export const resetPasswordNewPasswordSchema = z
  .object({
    newPassword: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Заполните все поля.'),
    newPassword: z.string().min(6, 'Пароль должен быть минимум 6 символов.'),
    confirmPassword: z.string().min(1, 'Заполните все поля.'),
  })
  .superRefine((data, ctx) => {
    if (!data.oldPassword || !data.newPassword || !data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Заполните все поля.',
        path: ['oldPassword'],
      });
    }
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Пароли не совпадают.',
        path: ['confirmPassword'],
      });
    }
  });
