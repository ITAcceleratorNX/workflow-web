import { API_BASE_URL, api } from '@/lib/api';

export interface LoginResponse {
  token: string;
  role?: string;
}

export interface AuthUser {
  id: number;
  full_name: string;
  phone?: string;
  email?: string;
  email_verified?: boolean;
  office_id: number;
  office: { name: string; photo?: string | null };
  role: string;
  email_notifications: boolean;
  security_notifications: boolean;
  marketing_notifications: boolean;
  push_notifications: boolean;
  service_category_id?: number;
  company_id?: number | null;
  company?: { id: number; name: string } | null;
}

function parseAuthError(data: unknown, fallback: string): string {
  const err = data as {
    details?: { message?: string }[];
    message?: string;
  };
  return err?.details?.[0]?.message || err?.message || fallback;
}

export async function loginWithPhone(
  phone: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseAuthError(data, 'Ошибка входа'));
  }

  return data as LoginResponse;
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseAuthError(data, 'Не удалось получить данные пользователя'));
  }

  return data as AuthUser;
}

export async function resetPassword(
  phone: string,
  verificationCode: string,
  newPassword: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone,
      verification_code: verificationCode,
      new_password: newPassword,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseAuthError(data, 'Ошибка при сбросе пароля'));
  }
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await api.post('/users/change-password', {
    currentPassword: data.currentPassword,
    newPassword: data.newPassword,
  });
}
