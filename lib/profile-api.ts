import api from "@/lib/api";
import { sendEmailVerificationCode as sendCode, verifyEmail as verify } from "@/lib/api";

type ProfileApiResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function getErrorMessage(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data
      ?.error ||
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    fallback
  );
}

export async function updateProfile(
  userId: number,
  data: { full_name: string; phone: string },
): Promise<ProfileApiResult> {
  try {
    await api.put(`/users/${userId}`, data);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error, "Ошибка при сохранении профиля") };
  }
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<ProfileApiResult> {
  try {
    await api.post("/users/change-password", data);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error, "Ошибка при смене пароля") };
  }
}

export async function sendEmailVerificationCode(email: string): Promise<ProfileApiResult> {
  try {
    await sendCode(email);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error, "Ошибка при отправке кода") };
  }
}

export async function verifyEmailCode(code: string): Promise<ProfileApiResult> {
  try {
    await verify(code);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error, "Неверный код верификации") };
  }
}

export async function updateNotificationsSettings(data: {
  emailNotifications: boolean;
  securityNotifications: boolean;
  marketingNotifications: boolean;
}): Promise<ProfileApiResult> {
  try {
    await api.put("/users/notifications-settings", data);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: "Ошибка при сохранении настроек" };
  }
}
