"use client"

import React, { useState, useCallback } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Lock, Save, X, Loader2, Mail, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { sendEmailVerificationCode, verifyEmail } from "@/lib/api"
import {useNotificationStore} from "@/stores/notificationStore";
import {useRequestStore} from "@/stores/useRequestStore";
import {useStatsStore} from "@/stores/statsStore";
import {useAuthStore} from "@/stores/useAuthStore";
import Image from "next/image";
import { LogsViewer } from "@/components/logs-viewer";

const roleTranslations: Record<string, string> = {
    client: "Клиент",
    "admin-worker": "Администратор офиса",
    "department-head": "Офис менеджер",
    executor: "Исполнитель",
    manager: "Руководитель",
}

interface ProfileModalProps {
    isOpen: boolean
    onClose: () => void
    isFullScreen?: boolean
    /** Render as inline section (no modal) for admin/manager desktop */
    asSection?: boolean
}

export function ProfileModal({ isOpen, onClose, isFullScreen = false, asSection = false }: ProfileModalProps) {
    const {clearAuth, user, updateUser} = useAuthStore()
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isChanging, setIsChanging] = useState(false)
    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [profileError, setProfileError] = useState("")
    const [profileSuccess, setProfileSuccess] = useState("")
    const [isSavingNotifications, setIsSavingNotifications] = useState(false)
    const [notificationError, setNotificationError] = useState("")
    const [notificationSuccess, setNotificationSuccess] = useState("")
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [email, setEmail] = useState("")
    const [verificationCode, setVerificationCode] = useState("")
    const [isSendingCode, setIsSendingCode] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [emailError, setEmailError] = useState("")
    const [emailSuccess, setEmailSuccess] = useState("")

    // Инициализация email при монтировании
    React.useEffect(() => {
        if (user?.email) {
            setEmail(user.email)
        }
    }, [user?.email])


    // Форматирование номера телефона: +7 (___) ___-__-__
    const formatPhone = (value: string) => {
        // убираем всё, кроме цифр
        let numbers = value.replace(/\D/g, '');

        // если номер начинается с "8", заменяем на "7"
        if (numbers.startsWith('8')) {
            numbers = '7' + numbers.slice(1);
        }

        // если нет "7" в начале — добавляем
        if (!numbers.startsWith('7')) {
            numbers = '7' + numbers;
        }

        // оставляем максимум 11 цифр
        numbers = numbers.slice(0, 11);

        // форматируем
        if (numbers.length <= 1) return '+7 ';
        if (numbers.length <= 4) return `+7 ${numbers.slice(1)}`;
        if (numbers.length <= 7) return `+7 ${numbers.slice(1, 4)} ${numbers.slice(4)}`;
        if (numbers.length <= 9) return `+7 ${numbers.slice(1, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7)}`;
        return `+7 ${numbers.slice(1, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 9)} ${numbers.slice(9, 11)}`;
    };

    // Обработчик изменения телефона
    function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        const formatted = formatPhone(value);
        updateUser((prev) => prev ? { ...prev, phone: formatted } : null);
    }


    // Функция закрытия — централизованная
    const handleClose = useCallback(() => {
        if (onClose) onClose()
    }, [onClose])

    // Обработчики событий
    const handleSaveProfile = async () => {
        setProfileError("")
        setProfileSuccess("")
        if (!user || !user.full_name || !user.phone) {
            setProfileError("ФИО и Номер обязательны.")
            return
        }

        setIsSavingProfile(true)
        try {
            await api.put(`/users/${user.id}`, {
                full_name: user.full_name,
                phone: user.phone,
            })
            setProfileSuccess("Профиль обновлён.")
        } catch (err: any) {
            const message = err?.response?.data?.error || "Ошибка при сохранении профиля"
            setProfileError(message)
        } finally {
            setIsSavingProfile(false)
        }
    }

    const handleChangePassword = async () => {
        setProfileError("")
        setProfileSuccess("")
        if (!oldPassword || !newPassword || !confirmPassword) {
            setProfileError("Заполните все поля.")
            return
        }
        if (newPassword !== confirmPassword) {
            setProfileError("Пароли не совпадают.")
            return
        }
        if (newPassword.length < 6) {
            setProfileError("Пароль должен быть минимум 6 символов.")
            return
        }

        setIsChanging(true)
        try {
            await api.post("/users/change-password", {
                currentPassword: oldPassword,
                newPassword,
            })
            setProfileSuccess("Пароль изменён.")
            setOldPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } catch (err: any) {
            const message = err?.response?.data?.error || "Ошибка при смене пароля"
            setProfileError(message)
        } finally {
            setIsChanging(false)
        }
    }

    const handleSaveNotifications = async () => {
        if (!user) return

        setIsSavingNotifications(true)
        setNotificationError("")
        setNotificationSuccess("")
        try {
            await api.put("/users/notifications-settings", {
                emailNotifications: user.email_notifications,
                securityNotifications: user.security_notifications,
                marketingNotifications: user.marketing_notifications,
            })
            setNotificationSuccess("Настройки уведомлений сохранены")
        } catch (err) {
            console.error("Ошибка при сохранении уведомлений:", err)
            setNotificationError("Ошибка при сохранении настроек")
        } finally {
            setIsSavingNotifications(false)
        }
    }

    if (!isOpen && !asSection) return null

    const showLogsTab = !asSection && ["admin-worker", "department-head", "manager"].includes(user?.role || "")
    const tabCols = showLogsTab ? "grid-cols-4" : "grid-cols-3"

    // Режим секции для admin/manager desktop — на всю ширину, в стиле раздела Бронь/Заявки
    const sectionCl = "text-sm text-white/80"
    const fieldCl = "text-sm bg-[#2C2C2E] border border-white/10 text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-[#E85D2B]/50 focus-visible:border-[#E85D2B] rounded-lg px-3 py-2.5"
    if (asSection) {
        return (
            <div className="w-full min-h-full px-4 py-6 md:px-6 md:py-8">
                <div className="w-full max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-white mb-6">Профиль</h1>
                    <Tabs defaultValue="profile" className="space-y-6">
                        <TabsList className="bg-transparent">
                            <TabsTrigger value="profile" className="w-full rounded-md data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/70 text-sm py-2">
                                Профиль
                            </TabsTrigger>
                            <TabsTrigger value="password" className="w-full rounded-md data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/70 text-sm py-2">
                                Пароль
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="w-full rounded-md data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/70 text-sm py-2">
                                Уведомления
                            </TabsTrigger>
                            {showLogsTab && (
                                <TabsTrigger value="logs" className="w-full rounded-md data-[state=active]:bg-[#E85D2B] data-[state=active]:text-white data-[state=inactive]:text-white/70 text-sm py-2">
                                    Логи
                                </TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent value="profile" className="mt-0 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-5">
                                    <h2 className="text-base font-semibold text-white border-b border-white/10 pb-2">Личные данные</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <Label className={sectionCl}>ФИО</Label>
                                            <Input
                                                value={user?.full_name || ""}
                                                onChange={(e) => updateUser((prev) => prev ? { ...prev, full_name: e.target.value } : null)}
                                                className={fieldCl}
                                            />
                                        </div>
                                        <div>
                                            <Label className={sectionCl}>Телефон</Label>
                                            <Input type="tel" value={user?.phone || ""} onChange={handlePhoneChange} className={fieldCl} placeholder="+7 (999) 123-45-67" />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <Label className={sectionCl}>Email</Label>
                                                {user?.email_verified && (
                                                    <Badge variant="secondary" className="text-xs bg-[#E85D2B]/20 text-[#E85D2B] border-0">
                                                        <CheckCircle2 className="h-3 w-3 mr-0.5" /> Верифицирован
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="email"
                                                    value={email || user?.email || ""}
                                                    onChange={(e) => { setEmail(e.target.value); setEmailError(""); setEmailSuccess(""); }}
                                                    className={`flex-1 ${fieldCl}`}
                                                    placeholder="example@mail.com"
                                                    disabled={isSendingCode || isVerifying}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={async () => {
                                                        const emailToSend = email || user?.email
                                                        if (!emailToSend) { setEmailError("Введите email"); return }
                                                        if (user?.email_verified && emailToSend === user?.email) { setEmailError("Email уже верифицирован"); return }
                                                        setIsSendingCode(true); setEmailError(""); setEmailSuccess("")
                                                        try {
                                                            await sendEmailVerificationCode(emailToSend)
                                                            setEmailSuccess("Код отправлен"); setEmail(emailToSend)
                                                        } catch (err: any) { setEmailError(err.response?.data?.error || "Ошибка") }
                                                        finally { setIsSendingCode(false) }
                                                    }}
                                                    disabled={isSendingCode || isVerifying || (!email && !user?.email) || (user?.email_verified && (email || user?.email) === user?.email)}
                                                    className="shrink-0 border-[#E85D2B]/50 text-[#E85D2B] hover:bg-[#E85D2B]/10"
                                                >
                                                    {isSendingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Код"}
                                                </Button>
                                            </div>
                                            {((email || user?.email) && (!user?.email_verified || emailSuccess?.includes("Код"))) && (
                                                <div className="flex gap-2 mt-2">
                                                    <Input
                                                        type="text"
                                                        value={verificationCode}
                                                        onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setEmailError(""); }}
                                                        className={`flex-1 ${fieldCl}`}
                                                        placeholder="Код из письма"
                                                        maxLength={6}
                                                        disabled={isVerifying}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={async () => {
                                                            if (!verificationCode || verificationCode.length !== 6) { setEmailError("Введите 6 цифр"); return }
                                                            setIsVerifying(true); setEmailError("")
                                                            try {
                                                                await verifyEmail(verificationCode)
                                                                setEmailSuccess("Верифицирован"); setVerificationCode("")
                                                                const emailToUpdate = email || user?.email
                                                                updateUser((prev) => prev ? { ...prev, email: emailToUpdate || "", email_verified: true } : null)
                                                            } catch (err: any) { setEmailError(err.response?.data?.error || "Неверный код") }
                                                            finally { setIsVerifying(false) }
                                                        }}
                                                        disabled={isVerifying || verificationCode.length !== 6}
                                                        className="shrink-0 border-[#E85D2B]/50 text-[#E85D2B] hover:bg-[#E85D2B]/10"
                                                    >
                                                        {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "OK"}
                                                    </Button>
                                                </div>
                                            )}
                                            {(emailError || emailSuccess) && <p className={`text-xs mt-1 ${emailError ? "text-[#E85D2B]" : "text-[#E85D2B]"}`}>{emailError || emailSuccess}</p>}
                                        </div>
                                    </div>
                                    <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="bg-[#E85D2B] hover:bg-[#E85D2B]/90 text-white">
                                        {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        {isSavingProfile ? "Сохранение..." : "Сохранить"}
                                    </Button>
                                    {(profileError || profileSuccess) && <p className={`text-sm ${profileError ? "text-[#E85D2B]" : "text-[#E85D2B]"}`}>{profileError || profileSuccess}</p>}
                                </div>
                                <div className="lg:pl-4 border-t border-white/10 lg:border-t-0 lg:border-l pt-6 lg:pt-0">
                                    <h2 className="text-base font-semibold text-white border-b border-white/10 pb-2 mb-4">Информация</h2>
                                    <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-[#2C2C2E]/50 border border-white/10">
                                        <div>
                                            <Label className={sectionCl}>Роль</Label>
                                            <p className="text-white font-medium mt-1">{user ? roleTranslations[user.role] || user.role : "—"}</p>
                                        </div>
                                        <div>
                                            <Label className={sectionCl}>Офис</Label>
                                            <p className="text-white font-medium mt-1">{user?.office.name || "—"}</p>
                                        </div>
                                        <div>
                                            <Label className={sectionCl}>ID</Label>
                                            <p className="text-white/70 font-mono text-sm mt-1">#{user?.id}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="password" className="mt-0 space-y-6">
                            <div className="max-w-md p-6 rounded-xl bg-[#2C2C2E]/50 border border-white/10 space-y-5">
                                <h2 className="text-base font-semibold text-white border-b border-white/10 pb-2">Смена пароля</h2>
                                <div className="space-y-4">
                                    <div>
                                        <Label className={sectionCl}>Старый пароль</Label>
                                        <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className={fieldCl} />
                                    </div>
                                    <div>
                                        <Label className={sectionCl}>Новый пароль</Label>
                                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={fieldCl} />
                                    </div>
                                    <div>
                                        <Label className={sectionCl}>Подтверждение</Label>
                                        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={fieldCl} />
                                    </div>
                                </div>
                                <Button onClick={handleChangePassword} disabled={isChanging} className="bg-[#E85D2B] hover:bg-[#E85D2B]/90 text-white">
                                    <Lock className="h-4 w-4 mr-2" />
                                    {isChanging ? "Смена..." : "Сменить пароль"}
                                </Button>
                                {(profileError || profileSuccess) && <p className={`text-sm ${profileError ? "text-[#E85D2B]" : "text-[#E85D2B]"}`}>{profileError || profileSuccess}</p>}
                            </div>
                        </TabsContent>

                        <TabsContent value="notifications" className="mt-0 space-y-6">
                            <div className="max-w-xl p-6 rounded-xl bg-[#2C2C2E]/50 border border-white/10 space-y-4">
                                <h2 className="text-base font-semibold text-white border-b border-white/10 pb-2">Уведомления</h2>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-[#1A1A1A]/50 border border-white/5">
                                        <Label className={sectionCl}>Email уведомления</Label>
                                        <Switch
                                            checked={user?.email_notifications ?? false}
                                            onCheckedChange={(checked) => updateUser((prev) => prev ? { ...prev, email_notifications: checked } : null)}
                                            className="data-[state=unchecked]:bg-[#1A1A1A] data-[state=checked]:bg-[#E85D2B]"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-[#1A1A1A]/50 border border-white/5">
                                        <Label className={sectionCl}>Безопасность</Label>
                                        <Switch
                                            checked={user?.security_notifications ?? false}
                                            onCheckedChange={(checked) => updateUser((prev) => prev ? { ...prev, security_notifications: checked } : null)}
                                            className="data-[state=unchecked]:bg-[#1A1A1A] data-[state=checked]:bg-[#E85D2B]"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-[#1A1A1A]/50 border border-white/5">
                                        <Label className={sectionCl}>Маркетинг</Label>
                                        <Switch
                                            checked={user?.marketing_notifications ?? false}
                                            onCheckedChange={(checked) => updateUser((prev) => prev ? { ...prev, marketing_notifications: checked } : null)}
                                            className="data-[state=unchecked]:bg-[#1A1A1A] data-[state=checked]:bg-[#E85D2B]"
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleSaveNotifications} disabled={isSavingNotifications} className="bg-[#E85D2B] hover:bg-[#E85D2B]/90 text-white mt-2">
                                    {isSavingNotifications ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    {isSavingNotifications ? "Сохранение..." : "Сохранить"}
                                </Button>
                                {(notificationError || notificationSuccess) && <p className={`text-sm ${notificationError ? "text-[#E85D2B]" : "text-[#E85D2B]"}`}>{notificationError || notificationSuccess}</p>}
                            </div>
                        </TabsContent>

                        {showLogsTab && (
                            <TabsContent value="logs" className="mt-0">
                                <div className="p-6 rounded-xl bg-[#2C2C2E]/50 border border-white/10">
                                    <h2 className="text-base font-semibold text-white border-b border-white/10 pb-2 mb-4">История операций</h2>
                                    <LogsViewer userRole={user?.role || "admin-worker"} isDesktop={true} dark={true} />
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>
                    <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => {
                                clearAuth()
                                useNotificationStore.getState().clearNotifications()
                                useRequestStore.getState().clearRequests()
                                useStatsStore.getState().resetStats()
                                window.location.href = "/login"
                            }}
                            className="text-sm text-white/70 hover:text-[#E85D2B] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#E85D2B]/10"
                        >
                            {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> : null}
                            {isLoggingOut ? "Выходим..." : "Выйти из аккаунта"}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Полноэкранный режим для мобильных
    if (isFullScreen) {
        return (
            <div className="min-h-screen bg-white">
                {/* Заголовок с кнопкой назад */}
                <div className="sticky top-0 z-10 flex items-center border-b border-gray-200 px-4 py-3 bg-white">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="mr-2"
                        onClick={handleClose}
                        aria-label="Назад"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Button>
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                            <Image 
                                src="/app-icon.png" 
                                alt="App Icon" 
                                width={32} 
                                height={32} 
                                className="rounded-lg"
                            />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Профиль</h2>
                            <p className="text-xs text-gray-500">Управление данными и настройками</p>
                        </div>
                    </div>
                </div>

                {/* Контент с прокруткой */}
                <div className="overflow-y-auto pb-4" style={{ height: 'calc(100vh - 64px)' }}>
                    <div className="p-4">
                    <Tabs defaultValue="profile" className="px-6">
                        {/* Вкладки с stopPropagation */}
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger
                                value="profile"
                                className="text-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Профиль
                            </TabsTrigger>
                            <TabsTrigger
                                value="password"
                                className="text-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Пароль
                            </TabsTrigger>
                            <TabsTrigger
                                value="notifications"
                                className="text-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Уведомления
                            </TabsTrigger>
                        </TabsList>

                        {/* Вкладка: Профиль */}
                        <TabsContent value="profile" className="space-y-4">
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="p-0 mb-4">
                                    <CardTitle className="text-base">Данные профиля</CardTitle>
                                    <CardDescription>Редактируйте свои данные</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 p-0">
                                    <div className="space-y-1">
                                        <Label className="text-sm">ФИО</Label>
                                        <Input
                                            value={user?.full_name || ""}
                                            onChange={(e) =>
                                                updateUser((prev) => prev ? { ...prev, full_name: e.target.value } : null)
                                            }
                                            className="text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm">Номер телефона</Label>
                                        <Input
                                            type="tel"
                                            value={user?.phone || ""}
                                            onChange={handlePhoneChange}
                                            className="text-sm"
                                            placeholder="+7 (999) 123-45-67"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm">Email адрес</Label>
                                            {user?.email_verified && (
                                                <Badge className="text-xs bg-green-100 text-green-700 flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Верифицирован
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                type="email"
                                                value={email || user?.email || ""}
                                                onChange={(e) => {
                                                    setEmail(e.target.value)
                                                    setEmailError("")
                                                    setEmailSuccess("")
                                                }}
                                                className="text-sm flex-1"
                                                placeholder="example@mail.com"
                                                disabled={isSendingCode || isVerifying}
                                            />
                                            <Button
                                                type="button"
                                                onClick={async () => {
                                                    const emailToSend = email || user?.email
                                                    if (!emailToSend) {
                                                        setEmailError("Введите email адрес")
                                                        return
                                                    }
                                                    // Проверяем, что email отличается от текущего верифицированного
                                                    if (user?.email_verified && emailToSend === user?.email) {
                                                        setEmailError("Email уже верифицирован")
                                                        return
                                                    }
                                                    setIsSendingCode(true)
                                                    setEmailError("")
                                                    setEmailSuccess("")
                                                    try {
                                                        await sendEmailVerificationCode(emailToSend)
                                                        setEmailSuccess("Код верификации отправлен на email")
                                                        setEmail(emailToSend)
                                                    } catch (err: any) {
                                                        setEmailError(err.response?.data?.error || "Ошибка при отправке кода")
                                                    } finally {
                                                        setIsSendingCode(false)
                                                    }
                                                }}
                                                disabled={isSendingCode || isVerifying || (!email && !user?.email) || (user?.email_verified && (email || user?.email) === user?.email)}
                                                variant="outline"
                                                size="sm"
                                                className="whitespace-nowrap"
                                            >
                                                {isSendingCode ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                        Отправка...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mail className="h-4 w-4 mr-1" />
                                                        Отправить код
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        {emailSuccess && <p className="text-xs text-green-600">{emailSuccess}</p>}
                                        {emailError && <p className="text-xs text-[#B8400E]">{emailError}</p>}
                                        {((email || user?.email) && (!user?.email_verified || emailSuccess?.includes("Код верификации отправлен"))) && (
                                            <div className="space-y-2 mt-2 p-3">
                                                <Label className="text-sm">Код верификации</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="text"
                                                        value={verificationCode}
                                                        onChange={(e) => {
                                                            setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                                                            setEmailError("")
                                                        }}
                                                        className="text-sm flex-1"
                                                        placeholder="000000"
                                                        maxLength={6}
                                                        disabled={isVerifying}
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={async () => {
                                                            if (!verificationCode || verificationCode.length !== 6) {
                                                                setEmailError("Введите 6-значный код")
                                                                return
                                                            }
                                                            setIsVerifying(true)
                                                            setEmailError("")
                                                            try {
                                                                await verifyEmail(verificationCode)
                                                                setEmailSuccess("Email успешно верифицирован")
                                                                setVerificationCode("")
                                                                const emailToUpdate = email || user?.email
                                                                updateUser((prev) => prev ? { ...prev, email: emailToUpdate, email_verified: true } : null)
                                                            } catch (err: any) {
                                                                setEmailError(err.response?.data?.error || "Неверный код верификации")
                                                            } finally {
                                                                setIsVerifying(false)
                                                            }
                                                        }}
                                                        disabled={isVerifying || verificationCode.length !== 6}
                                                        variant="default"
                                                        size="sm"
                                                        className="whitespace-nowrap bg-[#B8400E] text-white"
                                                    >
                                                        {isVerifying ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                                Проверка...
                                                            </>
                                                        ) : (
                                                            "Подтвердить"
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm">Роль</Label>
                                        <Badge className="text-sm bg-[#B8400E] text-white border-transparent">
                                            {user ? roleTranslations[user.role] || user.role : "—"}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm">Офис</Label>
                                        <Input
                                            value={user?.office.name || ""}
                                            readOnly
                                            className="bg-muted cursor-not-allowed text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm">ID</Label>
                                        <p className="text-muted-foreground font-mono text-sm">#{user?.id}</p>
                                    </div>
                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={isSavingProfile}
                                        className="mt-4 w-full sm:w-auto bg-[#B8400E] text-white"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {isSavingProfile ? "Сохранение..." : "Сохранить"}
                                    </Button>
                                    {profileError && <p className="text-sm text-[#B8400E] mt-2">{profileError}</p>}
                                    {profileSuccess && <p className="text-sm text-[#114A65] mt-2">{profileSuccess}</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Вкладка: Пароль */}
                        <TabsContent value="password" className="space-y-4">
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="p-0 mb-4">
                                    <CardTitle className="text-base">Смена пароля</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-0">
                                    <div className="space-y-1">
                                        <Label className="text-sm">Старый пароль</Label>
                                        <Input
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm">Новый пароль</Label>
                                        <Input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm">Подтверждение</Label>
                                        <Input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="text-sm"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleChangePassword}
                                        disabled={isChanging}
                                        className="mt-4 w-full sm:w-auto bg-[#B8400E] text-white"
                                    >
                                        <Lock className="mr-2 h-4 w-4" />
                                        {isChanging ? "Смена..." : "Сменить пароль"}
                                    </Button>
                                    {profileError && <p className="text-sm text-[#B8400E] mt-2">{profileError}</p>}
                                    {profileSuccess && <p className="text-sm text-[#114A65] mt-2">{profileSuccess}</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Вкладка: Уведомления */}
                        <TabsContent value="notifications" className="space-y-4">
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="p-0 mb-4">
                                    <CardTitle className="text-base">Уведомления</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-0">
                                    <div className="flex items-center justify-between py-1">
                                        <Label className="text-sm">Email уведомления</Label>
                                        <Switch
                                            checked={user?.email_notifications ?? false}
                                            onCheckedChange={(checked) =>
                                                updateUser((prev) => prev ? { ...prev, email_notifications: checked } : null)
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <Label className="text-sm">Безопасность</Label>
                                        <Switch
                                            checked={user?.security_notifications ?? false}
                                            onCheckedChange={(checked) =>
                                                updateUser((prev) => prev ? { ...prev, security_notifications: checked } : null)
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <Label className="text-sm">Маркетинг</Label>
                                        <Switch
                                            checked={user?.marketing_notifications ?? false}
                                            onCheckedChange={(checked) =>
                                                updateUser((prev) => prev ? { ...prev, marketing_notifications: checked } : null)
                                            }
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSaveNotifications}
                                        disabled={isSavingNotifications}
                                        className="mt-4 w-full sm:w-auto bg-[#B8400E] text-white"
                                    >
                                        {isSavingNotifications ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Сохранение...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Сохранить
                                            </>
                                        )}
                                    </Button>
                                    {notificationError && <p className="text-sm text-[#B8400E] mt-2">{notificationError}</p>}
                                    {notificationSuccess && <p className="text-sm text-[#114A65] mt-2">{notificationSuccess}</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                    </div>

                    {/* Кнопка "Выйти" */}
                    <div className="border-t px-4 py-4 bg-gray-50 mt-4">
                        <Button
                            variant="outline"
                            className="w-full text-[#B8400E] border-[#B8400E] hover:bg-[#B8400E]/10"
                            onClick={() => {
                                clearAuth()
                                handleClose()
                                useNotificationStore.getState().clearNotifications()
                                useRequestStore.getState().clearRequests()
                                useStatsStore.getState().resetStats()
                                window.location.href = "/login"
                            }}
                        >
                            {isLoggingOut ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Выходим...
                                </>
                            ) : (
                                <>
                                    Выйти из аккаунта
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Модальный режим для десктопа
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Фон затемнения */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in"
                 onClick={(e) => {
                     e.stopPropagation()
                     handleClose()
                 }}/>

            {/* Модальное окно */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-gray-200">
                {/* Заголовок */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                            <Image 
                                src="/app-icon.png" 
                                alt="App Icon" 
                                width={40} 
                                height={40} 
                                className="rounded-lg"
                            />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Профиль</h2>
                            <p className="text-sm text-gray-500">Управление данными и настройками</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-gray-100"
                        onClick={handleClose}
                        aria-label="Закрыть модальное окно"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </Button>
                </div>

                {/* Контент с прокруткой */}
                <div className="max-h-[70vh] overflow-y-auto p-1">
                    <Tabs defaultValue="profile" className="px-6">
                        {/* Вкладки с stopPropagation */}
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger
                                value="profile"
                                className="text-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Профиль
                            </TabsTrigger>
                            <TabsTrigger
                                value="password"
                                className="text-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Пароль
                            </TabsTrigger>
                            <TabsTrigger
                                value="notifications"
                                className="text-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Уведомления
                            </TabsTrigger>
                        </TabsList>

                        {/* Вкладка: Профиль */}
                        <TabsContent value="profile" className="space-y-4">
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="p-0 mb-4">
                                    <CardTitle className="text-base">Данные профиля</CardTitle>
                                    <CardDescription>Редактируйте свои данные</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 p-0">
                                    <div className="space-y-1">
                                        <Label className="text-sm">ФИО</Label>
                                        <Input
                                            value={user?.full_name || ""}
                                            onChange={(e) =>
                                                updateUser((prev) => prev ? { ...prev, full_name: e.target.value } : null)
                                            }
                                            className="text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm">Номер телефона</Label>
                                        <Input
                                            type="tel"
                                            value={user?.phone || ""}
                                            onChange={handlePhoneChange}
                                            className="text-sm"
                                            placeholder="+7 (999) 123-45-67"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm">Email адрес</Label>
                                            {user?.email_verified && (
                                                <Badge className="text-xs bg-green-100 text-green-700 flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Верифицирован
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                type="email"
                                                value={email || user?.email || ""}
                                                onChange={(e) => {
                                                    setEmail(e.target.value)
                                                    setEmailError("")
                                                    setEmailSuccess("")
                                                }}
                                                className="text-sm flex-1"
                                                placeholder="example@mail.com"
                                                disabled={isSendingCode || isVerifying}
                                            />
                                            <Button
                                                type="button"
                                                onClick={async () => {
                                                    const emailToSend = email || user?.email
                                                    if (!emailToSend) {
                                                        setEmailError("Введите email адрес")
                                                        return
                                                    }
                                                    // Проверяем, что email отличается от текущего верифицированного
                                                    if (user?.email_verified && emailToSend === user?.email) {
                                                        setEmailError("Email уже верифицирован")
                                                        return
                                                    }
                                                    setIsSendingCode(true)
                                                    setEmailError("")
                                                    setEmailSuccess("")
                                                    try {
                                                        await sendEmailVerificationCode(emailToSend)
                                                        setEmailSuccess("Код верификации отправлен на email")
                                                        setEmail(emailToSend)
                                                    } catch (err: any) {
                                                        setEmailError(err.response?.data?.error || "Ошибка при отправке кода")
                                                    } finally {
                                                        setIsSendingCode(false)
                                                    }
                                                }}
                                                disabled={isSendingCode || isVerifying || (!email && !user?.email) || (user?.email_verified && (email || user?.email) === user?.email)}
                                                variant="outline"
                                                size="sm"
                                                className="whitespace-nowrap"
                                            >
                                                {isSendingCode ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                        Отправка...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mail className="h-4 w-4 mr-1" />
                                                        Отправить код
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        {emailSuccess && <p className="text-xs text-green-600">{emailSuccess}</p>}
                                        {emailError && <p className="text-xs text-[#B8400E]">{emailError}</p>}
                                        {((email || user?.email) && (!user?.email_verified || emailSuccess?.includes("Код верификации отправлен"))) && (
                                            <div className="space-y-2 mt-2 p-3">
                                                <Label className="text-sm">Код верификации</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="text"
                                                        value={verificationCode}
                                                        onChange={(e) => {
                                                            setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                                                            setEmailError("")
                                                        }}
                                                        className="text-sm flex-1"
                                                        placeholder="000000"
                                                        maxLength={6}
                                                        disabled={isVerifying}
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={async () => {
                                                            if (!verificationCode || verificationCode.length !== 6) {
                                                                setEmailError("Введите 6-значный код")
                                                                return
                                                            }
                                                            setIsVerifying(true)
                                                            setEmailError("")
                                                            try {
                                                                await verifyEmail(verificationCode)
                                                                setEmailSuccess("Email успешно верифицирован")
                                                                setVerificationCode("")
                                                                const emailToUpdate = email || user?.email
                                                                updateUser((prev) => prev ? { ...prev, email: emailToUpdate, email_verified: true } : null)
                                                            } catch (err: any) {
                                                                setEmailError(err.response?.data?.error || "Неверный код верификации")
                                                            } finally {
                                                                setIsVerifying(false)
                                                            }
                                                        }}
                                                        disabled={isVerifying || verificationCode.length !== 6}
                                                        variant="default"
                                                        size="sm"
                                                        className="whitespace-nowrap bg-[#B8400E] text-white"
                                                    >
                                                        {isVerifying ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                                Проверка...
                                                            </>
                                                        ) : (
                                                            "Подтвердить"
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm">Роль</Label>
                                        <Badge className="text-sm bg-[#B8400E] text-white border-transparent">
                                            {user ? roleTranslations[user.role] || user.role : "—"}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm">Офис</Label>
                                        <Input
                                            value={user?.office.name || ""}
                                            readOnly
                                            className="bg-muted cursor-not-allowed text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm">ID</Label>
                                        <p className="text-muted-foreground font-mono text-sm">#{user?.id}</p>
                                    </div>
                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={isSavingProfile}
                                        className="mt-4 w-full sm:w-auto bg-[#B8400E] text-white"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {isSavingProfile ? "Сохранение..." : "Сохранить"}
                                    </Button>
                                    {profileError && <p className="text-sm text-[#B8400E] mt-2">{profileError}</p>}
                                    {profileSuccess && <p className="text-sm text-[#114A65] mt-2">{profileSuccess}</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Вкладка: Пароль */}
                        <TabsContent value="password" className="space-y-4">
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="p-0 mb-4">
                                    <CardTitle className="text-base">Смена пароля</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-0">
                                    <div className="space-y-1">
                                        <Label className="text-sm">Старый пароль</Label>
                                        <Input
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm">Новый пароль</Label>
                                        <Input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm">Подтверждение</Label>
                                        <Input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="text-sm"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleChangePassword}
                                        disabled={isChanging}
                                        className="mt-4 w-full sm:w-auto bg-[#B8400E] text-white"
                                    >
                                        <Lock className="mr-2 h-4 w-4" />
                                        {isChanging ? "Смена..." : "Сменить пароль"}
                                    </Button>
                                    {profileError && <p className="text-sm text-[#B8400E] mt-2">{profileError}</p>}
                                    {profileSuccess && <p className="text-sm text-[#114A65] mt-2">{profileSuccess}</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Вкладка: Уведомления */}
                        <TabsContent value="notifications" className="space-y-4">
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="p-0 mb-4">
                                    <CardTitle className="text-base">Уведомления</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-0">
                                    <div className="flex items-center justify-between py-1">
                                        <Label className="text-sm">Email уведомления</Label>
                                        <Switch
                                            checked={user?.email_notifications ?? false}
                                            onCheckedChange={(checked) =>
                                                updateUser((prev) => prev ? { ...prev, email_notifications: checked } : null)
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <Label className="text-sm">Безопасность</Label>
                                        <Switch
                                            checked={user?.security_notifications ?? false}
                                            onCheckedChange={(checked) =>
                                                updateUser((prev) => prev ? { ...prev, security_notifications: checked } : null)
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <Label className="text-sm">Маркетинг</Label>
                                        <Switch
                                            checked={user?.marketing_notifications ?? false}
                                            onCheckedChange={(checked) =>
                                                updateUser((prev) => prev ? { ...prev, marketing_notifications: checked } : null)
                                            }
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSaveNotifications}
                                        disabled={isSavingNotifications}
                                        className="mt-4 w-full sm:w-auto bg-[#B8400E] text-white"
                                    >
                                        {isSavingNotifications ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Сохранение...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Сохранить
                                            </>
                                        )}
                                    </Button>
                                    {notificationError && <p className="text-sm text-[#B8400E] mt-2">{notificationError}</p>}
                                    {notificationSuccess && <p className="text-sm text-[#114A65] mt-2">{notificationSuccess}</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Кнопка "Выйти" */}
                <div className="border-t px-6 py-4 bg-gray-50">
                    <Button
                        variant="outline"
                        className="w-full text-[#B8400E] border-[#B8400E] hover:bg-[#B8400E]/10"
                        onClick={() => {
                            clearAuth()
                            handleClose()
                            useNotificationStore.getState().clearNotifications()
                            useRequestStore.getState().clearRequests()
                            useStatsStore.getState().resetStats()
                            window.location.href = "/login"
                        }}
                    >
                        {isLoggingOut ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Выходим...
                            </>
                        ) : (
                            <>
                                Выйти из аккаунта
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}