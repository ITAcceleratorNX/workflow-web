/**
 * Константы регистрации — aligned with workflow-mobile/lib/registration.ts
 */

export const REGISTRATION_ROLES = [
  { value: 'client', label: 'Клиент' },
  { value: 'executor', label: 'Исполнитель' },
] as const;

export type RegistrationRole = (typeof REGISTRATION_ROLES)[number]['value'];

/** Спец-значение в селекте «Компания»: «Другое». */
export const COMPANY_OTHER_VALUE = '__other__' as const;

export interface RegistrationFormData {
  phone: string;
  full_name: string;
  office_id: string;
  role: string;
  service_category_id: string;
  company_id: string;
  company_other_name: string;
  password: string;
  confirm_password: string;
}

export const INITIAL_REGISTRATION_FORM: RegistrationFormData = {
  phone: '',
  full_name: '',
  office_id: '',
  role: '',
  service_category_id: '',
  company_id: '',
  company_other_name: '',
  password: '',
  confirm_password: '',
};

export const REGISTER_STEP_TITLES = ['Регистрация', 'Верификация', 'Создание пароля'] as const;

export const REGISTER_STEP_SUBTITLES = [
  'Заполните форму для регистрации',
  'Введите код из SMS',
  'Придумайте надёжный пароль',
] as const;

export interface RegistrationOffice {
  id: number;
  name: string;
}

export interface RegistrationServiceCategory {
  id: number;
  name: string;
}

export interface RegistrationCompany {
  id: number;
  name: string;
}
