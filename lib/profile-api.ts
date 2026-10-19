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

/** Первая ошибка поля из ответа `{ error, details: [{ field, message }] }`. */
function getFieldErrorMessage(error: unknown): string | undefined {
  return (error as { response?: { data?: { details?: { message?: string }[] } } })?.response?.data
    ?.details?.[0]?.message;
}

/** Свой профиль (любая роль): ФИО, телефон, должность. */
export async function updateProfile(data: {
  full_name: string;
  phone: string;
  position: string | null;
}): Promise<ProfileApiResult> {
  try {
    await api.put("/users/me/profile", data);
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

type NotificationEmailResult =
  | { ok: true; notificationEmail: string | null }
  | { ok: false; error: string };

/**
 * «Email для уведомлений» администратора из `GET /users/me`.
 * undefined — запрос не удался или сервер не вернул поле: локальное значение не трогаем.
 */
export async function fetchNotificationEmail(): Promise<string | null | undefined> {
  try {
    const { data } = await api.get<{ notification_email?: string | null }>("/users/me");
    return data?.notification_email;
  } catch {
    return undefined;
  }
}

/** Администратор (admin-worker): адрес для писем о новых заявках; null — очистить. */
export async function updateNotificationEmail(
  email: string | null,
): Promise<NotificationEmailResult> {
  try {
    const { data } = await api.put<{ notification_email: string | null }>(
      "/users/me/notification-email",
      { notification_email: email },
    );
    return { ok: true, notificationEmail: data?.notification_email ?? null };
  } catch (error) {
    return {
      ok: false,
      error: getFieldErrorMessage(error) || getErrorMessage(error, "Не удалось сохранить email"),
    };
  }
}
