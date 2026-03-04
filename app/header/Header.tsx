import {Bell, LogOut, User} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import React, {useCallback, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import api from "@/lib/api";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createClickableRequestIds } from "@/lib/notificationUtils";

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_read: boolean;
}


interface HeaderProps {
    handleLogout: () => void;
    notificationCount?: number;
    role?: string;
    variant?: "default" | "dark";
    /** Когда задан, кнопка «Профиль» ведёт сюда (для admin/manager desktop) */
    profileHref?: string;
    /** Путь к разделу заявок для перехода по клику на номер заявки в уведомлении (например /manager/requests) */
    requestsPathForNotification?: string;
}

const PAGE_SIZE = 10;

const Header: React.FC<HeaderProps> = ({
                                           handleLogout,
                                           notificationCount = 0,
                                           role = "Клиент",
                                           variant = "default",
                                           profileHref,
                                           requestsPathForNotification,
                                       }) => {
    const router = useRouter();
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [notificationsPage, setNotificationsPage] = useState(1);
    const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const loadNotificationCount = async () => {
        try {
            const res = await api.get('/notifications/me?page=1&pageSize=100');
            const unread = res.data.notifications.filter((n: any) => !n.is_read).length;
            setUnreadNotificationCount(unread);
        } catch (err) {
            console.error("Ошибка загрузки уведомлений:", err);
        }
    };

    useEffect(() => {
        loadNotificationCount();
    }, []);

    const loadNotificationsList = useCallback(async (page: number, append: boolean) => {
        if (append) setLoadingMore(true);
        else setNotificationsLoading(true);
        try {
            const res = await api.get(`/notifications/me?page=${page}&pageSize=${PAGE_SIZE}`);
            const list = res.data.notifications || [];
            const totalPages = res.data.totalPages ?? 1;
            setHasMoreNotifications(page < totalPages);
            setNotificationsList((prev) => (append ? [...prev, ...list.filter((n: NotificationItem) => !prev.some((p) => p.id === n.id))] : list));
        } catch (err) {
            console.error("Ошибка загрузки уведомлений:", err);
        } finally {
            if (append) setLoadingMore(false);
            else setNotificationsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (notificationsOpen && variant === "dark") {
            setNotificationsPage(1);
            setHasMoreNotifications(true);
            loadNotificationsList(1, false);
        }
    }, [notificationsOpen, variant]);

    const handleNotificationScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (!hasMoreNotifications || loadingMore || notificationsLoading) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        if (scrollHeight - (scrollTop + clientHeight) < 80) {
            const nextPage = notificationsPage + 1;
            setNotificationsPage(nextPage);
            setLoadingMore(true);
            loadNotificationsList(nextPage, true);
        }
    }, [hasMoreNotifications, loadingMore, notificationsLoading, notificationsPage, loadNotificationsList]);

    const markAsRead = useCallback(async (notification: NotificationItem) => {
        if (notification.is_read) return;
        setNotificationsList((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)));
        setUnreadNotificationCount((c) => Math.max(0, c - 1));
        try {
            await api.patch(`/notifications/${notification.id}/read`);
        } catch (err) {
            setNotificationsList((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: false } : n)));
            setUnreadNotificationCount((c) => c + 1);
        }
    }, []);

    const handleRequestIdClick = useCallback((requestId: string) => {
        const groupId = requestId.split("/")[0];
        setNotificationsOpen(false);
        if (requestsPathForNotification) {
            router.push(`${requestsPathForNotification}?requestId=${groupId}`);
        }
    }, [requestsPathForNotification, router]);

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        if (diffInMinutes < 1) return "только что";
        if (diffInMinutes < 60) return `${diffInMinutes} мин`;
        if (diffInHours < 24) return `${diffInHours} ч`;
        if (diffInDays < 7) return `${diffInDays} дн`;
        return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    return (
        <>
            <style>{`
                html { scrollbar-gutter: stable; }
            `}</style>

            <header
                className={variant === "dark"
                    ? "hidden md:block border-b border-white/10"
                    : "hidden md:block bg-gradient-to-r from-white via-white to-gray-50/50 shadow-md border-b border-gray-200/50 backdrop-blur-sm"
                }
                style={variant === "dark" ? { backgroundColor: "#1A1A1A" } : undefined}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3 group">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden p-1 shadow-lg transition-transform duration-300 group-hover:scale-105 bg-white`}>
                                <div className={`w-full h-full rounded-lg flex items-center justify-center bg-white`}>
                                    <Image 
                                        src="/app-icon.png" 
                                        alt="App Icon" 
                                        width={40} 
                                        height={40} 
                                        className="rounded-lg"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className={`font-bold text-xl ${variant === "dark" ? "text-white" : "bg-gradient-to-r from-[#114A65] to-[#B8400E] bg-clip-text text-transparent"}`}>WorkFlow</span>
                                <span className={`text-xs -mt-1 ${variant === "dark" ? "text-white/60" : "text-gray-500"}`}>Система управления</span>
                            </div>
                        </div>
                        {/* DESKTOP */}
                        <div className="hidden md:flex flex-row space-x-3 items-center">
                            {variant === "dark" ? (
                                <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="relative h-11 w-11 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
                                        >
                                            <Bell className="w-5 h-5" />
                                            {unreadNotificationCount > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-[#E85D2B] text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center font-bold shadow-lg">
                                                    {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                                                </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        align="end"
                                        side="bottom"
                                        sideOffset={8}
                                        className="w-[360px] p-0 rounded-xl border border-white/10 bg-[#1A1A1A] shadow-xl"
                                    >
                                        <div className="border-b border-white/10 px-4 py-3">
                                            <h3 className="font-semibold text-white text-sm">Уведомления</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {unreadNotificationCount > 0
                                                    ? `Непрочитанных: ${unreadNotificationCount}`
                                                    : "Нет новых"}
                                            </p>
                                        </div>
                                        <div
                                            className="max-h-[320px] overflow-y-auto"
                                            onScroll={handleNotificationScroll}
                                        >
                                            {notificationsLoading ? (
                                                <div className="py-8 text-center text-gray-400 text-sm">Загрузка...</div>
                                            ) : notificationsList.length === 0 ? (
                                                <div className="py-8 text-center text-gray-400 text-sm">Пока нет уведомлений</div>
                                            ) : (
                                                <ul className="py-1">
                                                    {notificationsList.map((n) => (
                                                        <li
                                                            key={n.id}
                                                            role="button"
                                                            tabIndex={0}
                                                            className={`px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer ${!n.is_read ? "bg-[#E85D2B]/5" : ""}`}
                                                            onClick={() => markAsRead(n)}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0 flex-1">
                                                                    <p className={`text-sm font-medium truncate ${n.is_read ? "text-gray-400" : "text-white"}`}>
                                                                        {n.title}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                                        {createClickableRequestIds(n.content, handleRequestIdClick, "text-[#E85D2B] underline cursor-pointer hover:text-orange-300")}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-500 mt-1">
                                                                        {formatTimeAgo(n.created_at)}
                                                                    </p>
                                                                </div>
                                                                {!n.is_read && (
                                                                    <span className="shrink-0 w-2 h-2 rounded-full bg-[#E85D2B] mt-1.5" />
                                                                )}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {loadingMore && (
                                                <div className="py-3 text-center text-gray-500 text-xs">Загрузка...</div>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push("/notifications")}
                                    className="relative h-11 w-11 rounded-xl border-2 border-[#E25B21]/20 bg-gradient-to-br from-white to-[#E25B21]/5 hover:from-[#E25B21]/10 hover:to-[#E25B21]/20 hover:border-[#E25B21]/40 transition-all duration-300 shadow-sm hover:shadow-md"
                                >
                                    <Bell className="w-5 h-5 text-[#E25B21]" />
                                    {unreadNotificationCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-[#E85D2B] text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center font-bold shadow-lg animate-pulse">
                                            {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                                        </span>
                                    )}
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(profileHref ?? '/profile')}
                                className={variant === "dark"
                                    ? "h-11 px-4 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
                                    : "h-11 px-4 rounded-xl bg-gradient-to-br from-white to-[#114A65]/5 hover:from-[#114A65]/10 hover:to-[#114A65]/20 border border-[#114A65]/20 hover:border-[#114A65]/40 transition-all duration-300 shadow-sm hover:shadow-md"
                                }
                            >
                                <User className={variant === "dark" ? "w-5 h-5 mr-2" : "w-5 h-5 text-[#114A65] mr-2"}/>
                                <span className={`text-sm font-semibold ${variant === "dark" ? "" : "text-[#114A65]"}`}>Профиль</span>
                            </Button>
                            <Badge variant="secondary" className={variant === "dark"
                                ? "bg-[#2A9D8F]/20 text-[#2A9D8F] border-[#2A9D8F]/30 px-3 py-1.5 font-semibold"
                                : "bg-gradient-to-r from-[#114A65]/10 to-[#114A65]/5 text-[#114A65] border-[#114A65]/30 px-3 py-1.5 font-semibold shadow-sm"
                            }>{role}</Badge>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleLogout} 
                                className={variant === "dark"
                                    ? "h-11 w-11 rounded-xl text-white/80 hover:bg-red-500/20 hover:text-red-400"
                                    : "h-11 w-11 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                                }
                            >
                                <LogOut className="w-5 h-5"/>
                            </Button>
                        </div>
                        {/* MOBILE */}
                        <div className="flex md:hidden items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/notifications')}
                                className="relative h-11 w-11 rounded-xl border-2 border-[#E25B21]/20 bg-gradient-to-br from-white to-[#E25B21]/5 hover:from-[#E25B21]/10 hover:to-[#E25B21]/20 hover:border-[#E25B21]/40 transition-all duration-300 shadow-sm"
                            >
                                <Bell className="w-5 h-5 text-[#E25B21]"/>
                                {unreadNotificationCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center font-bold shadow-lg animate-pulse">
                                        {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;
