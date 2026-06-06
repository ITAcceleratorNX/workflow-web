"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  changePassword,
  sendEmailVerificationCode,
  updateNotificationsSettings,
  updateProfile,
  verifyEmailCode,
} from "@/lib/profile-api";
import { formatPhone } from "@/lib/phone-utils";
import { getRequestNavigationUrl } from "@/lib/requestNavigation";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useRequestStore } from "@/stores/useRequestStore";
import { useStatsStore } from "@/stores/statsStore";

const PAGE_SIZE = 10;

export function useProfilePage() {
  const { clearAuth, user, updateUser, role, isGuest } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const { clearNotifications, setNotifications, appendNotifications, updateNotification, setNotificationLoading } =
    useNotificationStore();
  const { clearRequests } = useRequestStore();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  const [selectedNotification, setSelectedNotification] = useState<{
    id: number;
    title: string;
    content: string;
    is_read: boolean;
    created_at: string;
  } | null>(null);
  const [notifPage, setNotifPage] = useState(1);
  const [notifTotalPages, setNotifTotalPages] = useState(1);
  const [notifLoadingMore, setNotifLoadingMore] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  useEffect(() => {
    if (!user?.id && !isGuest) return;
    if (isGuest) {
      setNotifications([]);
      setNotificationLoading(false);
      return;
    }

    let cancelled = false;
    setNotificationLoading(true);
    api
      .get(`/notifications/me?page=1&pageSize=${PAGE_SIZE}`)
      .then((res) => {
        if (!cancelled) {
          const list = res.data?.notifications ?? [];
          setNotifications(list);
          setNotifTotalPages(res.data?.totalPages ?? (list.length >= PAGE_SIZE ? 2 : 1));
          setNotifPage(1);
        }
      })
      .catch(() => {
        if (!cancelled) setNotifications([]);
      })
      .finally(() => {
        if (!cancelled) setNotificationLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, isGuest, setNotificationLoading, setNotifications]);

  const loadMoreNotifications = useCallback(async () => {
    if (notifLoadingMore || notifPage >= notifTotalPages || isGuest) return;
    setNotifLoadingMore(true);
    try {
      const nextPage = notifPage + 1;
      const res = await api.get(`/notifications/me?page=${nextPage}&pageSize=${PAGE_SIZE}`);
      appendNotifications(res.data?.notifications ?? []);
      setNotifPage(nextPage);
    } finally {
      setNotifLoadingMore(false);
    }
  }, [appendNotifications, isGuest, notifLoadingMore, notifPage, notifTotalPages]);

  const handlePhoneChange = useCallback(
    (value: string) => {
      updateUser((prev) => (prev ? { ...prev, phone: formatPhone(value) } : null));
    },
    [updateUser],
  );

  const handleLogout = useCallback(() => {
    setIsLoggingOut(true);
    clearAuth();
    clearRequests();
    useStatsStore.getState().resetStats();
    clearNotifications();
    router.push("/login");
  }, [clearAuth, clearNotifications, clearRequests, router]);

  const handleSaveProfile = useCallback(async (): Promise<boolean> => {
    setProfileError("");
    setProfileSuccess("");
    if (!user?.full_name || !user.phone) {
      setProfileError("ФИО и Номер обязательны.");
      return false;
    }

    if (isGuest) {
      setProfileSuccess("Демо: профиль обновлён локально.");
      toast({ title: "Демо режим", description: "Изменения сохранены только на этом устройстве." });
      return true;
    }

    setIsSavingProfile(true);
    const result = await updateProfile(user.id, {
      full_name: user.full_name,
      phone: user.phone,
    });
    setIsSavingProfile(false);

    if (!result.ok) {
      setProfileError(result.error);
      return false;
    }

    setProfileSuccess("Профиль обновлён.");
    toast({ title: "Успешно", description: "Профиль обновлён." });
    return true;
  }, [isGuest, toast, user]);

  const handleChangePassword = useCallback(async () => {
    setPasswordError("");
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Заполните все поля.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Пароли не совпадают.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Пароль должен быть минимум 6 символов.");
      return;
    }

    if (isGuest) {
      toast({ title: "Демо режим", description: "Смена пароля недоступна в демо-версии." });
      return;
    }

    setIsChangingPassword(true);
    const result = await changePassword({
      currentPassword: oldPassword,
      newPassword,
    });
    setIsChangingPassword(false);

    if (!result.ok) {
      setPasswordError(result.error);
      return;
    }

    toast({ title: "Успешно", description: "Пароль изменён." });
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }, [confirmPassword, isGuest, newPassword, oldPassword, toast]);

  const handleSaveNotifications = useCallback(async () => {
    if (!user) return;

    setIsSavingNotifications(true);
    setNotificationError("");
    const result = await updateNotificationsSettings({
      emailNotifications: user.email_notifications ?? false,
      securityNotifications: user.security_notifications ?? false,
      marketingNotifications: user.marketing_notifications ?? false,
    });
    setIsSavingNotifications(false);

    if (!result.ok) {
      setNotificationError(result.error);
      return;
    }

    toast({ title: "Успешно", description: "Настройки уведомлений сохранены" });
  }, [toast, user]);

  const handleSendVerificationCode = useCallback(async () => {
    const emailToSend = email || user?.email;
    if (!emailToSend) {
      setEmailError("Введите email");
      return;
    }
    if (user?.email_verified && emailToSend === user?.email) {
      setEmailError("Email уже верифицирован");
      return;
    }

    if (isGuest) {
      setEmailSuccess('Демо: код "отправлен" (заглушка).');
      toast({ title: "Демо режим", description: "Код не отправляется на сервер в демо-версии." });
      return;
    }

    setIsSendingCode(true);
    setEmailError("");
    setEmailSuccess("");
    const result = await sendEmailVerificationCode(emailToSend);
    setIsSendingCode(false);

    if (!result.ok) {
      setEmailError(result.error);
      return;
    }

    setEmail(emailToSend);
    setEmailSuccess("Код верификации отправлен на email");
    toast({ title: "Успешно", description: "Код верификации отправлен на email" });
  }, [email, isGuest, toast, user?.email, user?.email_verified]);

  const handleVerifyEmail = useCallback(async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setEmailError("Введите 6-значный код");
      return;
    }

    if (isGuest) {
      const emailToUpdate = email || user?.email;
      updateUser((prev) =>
        prev ? { ...prev, email: emailToUpdate ?? "", email_verified: true } : null,
      );
      setVerificationCode("");
      setEmailSuccess("Демо: email помечен как верифицированный.");
      toast({ title: "Демо режим", description: "Статус верификации изменён только локально." });
      return;
    }

    setIsVerifying(true);
    setEmailError("");
    const result = await verifyEmailCode(verificationCode);
    setIsVerifying(false);

    if (!result.ok) {
      setEmailError(result.error);
      return;
    }

    const emailToUpdate = email || user?.email;
    updateUser((prev) =>
      prev ? { ...prev, email: emailToUpdate ?? "", email_verified: true } : null,
    );
    setVerificationCode("");
    setEmailSuccess("Email верифицирован");
    toast({ title: "Успешно", description: "Email верифицирован" });
  }, [email, isGuest, toast, updateUser, user?.email, verificationCode]);

  const handleNotificationClick = useCallback(
    async (notification: { id: number; is_read: boolean; title: string; content: string; created_at: string }) => {
      if (!notification.is_read) {
        updateNotification(notification.id, { is_read: true });
        setSelectedNotification({ ...notification, is_read: true });
        try {
          await api.patch(`/notifications/${notification.id}/read`);
        } catch {
          updateNotification(notification.id, { is_read: false });
          setSelectedNotification({ ...notification, is_read: false });
        }
      } else {
        setSelectedNotification(notification);
      }
    },
    [updateNotification],
  );

  const handleRequestClick = useCallback(
    (requestId: string, isDesktop: boolean) => {
      const url = getRequestNavigationUrl({
        role: role || "client",
        isDesktop,
        requestId,
      });
      if (url) router.push(url);
      setSelectedNotification(null);
      return true;
    },
    [role, router],
  );

  const showEmailVerificationBlock =
    Boolean(email || user?.email) &&
    (!user?.email_verified || emailSuccess?.includes("Код верификации отправлен"));

  return {
    user,
    role,
    isGuest,
    isEditingProfile,
    setIsEditingProfile,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    isChangingPassword,
    isSavingProfile,
    profileError,
    profileSuccess,
    isSavingNotifications,
    notificationError,
    isLoggingOut,
    email,
    setEmail,
    verificationCode,
    setVerificationCode,
    isSendingCode,
    isVerifying,
    emailError,
    emailSuccess,
    setEmailError,
    setEmailSuccess,
    selectedNotification,
    setSelectedNotification,
    notifPage,
    notifTotalPages,
    notifLoadingMore,
    showEmailVerificationBlock,
    updateUser,
    handlePhoneChange,
    handleLogout,
    handleSaveProfile,
    handleChangePassword,
    handleSaveNotifications,
    handleSendVerificationCode,
    handleVerifyEmail,
    handleNotificationClick,
    handleRequestClick,
    loadMoreNotifications,
  };
}

export type UseProfilePageResult = ReturnType<typeof useProfilePage>;
