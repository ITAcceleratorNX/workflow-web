import {Bell, LogOut, User} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import React, {useState} from "react";
import {useRouter} from "next/navigation";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationCategoryList } from "@/components/notification/categories/category-list";
import { useNotificationSummary } from "@/hooks/use-notification-summary";
import { formatBadgeCount } from "@/lib/notification-categories";
import { useAuthStore } from "@/stores/useAuthStore";

/** «Айдана Касымова» → «Айдана К.» — подпись плашки пользователя в шапке. */
function formatShortUserName(fullName: string | null | undefined): string {
    const [first, second] = (fullName ?? "").trim().split(/\s+/);
    if (!first) return "";
    return second ? `${first} ${second[0].toUpperCase()}.` : first;
}


interface HeaderProps {
    handleLogout: () => void;
    notificationCount?: number;
    role?: string;
    variant?: "default" | "dark";
    /** Когда задан, кнопка «Профиль» ведёт сюда (для admin/manager desktop) */
    profileHref?: string;
    /**
     * Раньше — переход по номеру заявки из ленты в поповере. Поповер показывает категории,
     * переходы к заявкам выполняются в разделе «Уведомления».
     */
    requestsPathForNotification?: string;
}

const Header: React.FC<HeaderProps> = ({
                                           handleLogout,
                                           notificationCount = 0,
                                           role = "Клиент",
                                           variant = "default",
                                           profileHref,
                                       }) => {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    // Общий счётчик — сумма непрочитанных в категориях роли (GET /notifications/me/summary).
    const { summary, unreadCount: unreadNotificationCount, summaryLoading, reload } = useNotificationSummary();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const handleNotificationsOpenChange = (open: boolean) => {
        setNotificationsOpen(open);
        if (open) void reload();
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
                                        loading="eager"
                                        className="h-10 w-10 rounded-lg object-contain"
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
                                <Popover open={notificationsOpen} onOpenChange={handleNotificationsOpenChange}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="relative h-11 w-11 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
                                        >
                                            <Bell className="w-5 h-5" />
                                            {unreadNotificationCount > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-[#E85D2B] text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center font-bold shadow-lg">
                                                    {formatBadgeCount(unreadNotificationCount)}
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
                                        <div className="max-h-[420px] overflow-y-auto">
                                            {summaryLoading && !summary ? (
                                                <div className="py-8 text-center text-gray-400 text-sm">Загрузка...</div>
                                            ) : !summary ? (
                                                <div className="py-8 text-center text-gray-400 text-sm">Не удалось загрузить уведомления</div>
                                            ) : (
                                                <NotificationCategoryList
                                                    categories={summary.categories}
                                                    variant="popover"
                                                    onSelect={(category) => {
                                                        setNotificationsOpen(false);
                                                        router.push(`/notifications?category=${category}`);
                                                    }}
                                                />
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
                                            {formatBadgeCount(unreadNotificationCount)}
                                        </span>
                                    )}
                                </Button>
                            )}
                            {variant === "dark" ? (
                                <button
                                    type="button"
                                    onClick={() => router.push(profileHref ?? '/profile')}
                                    className="flex h-11 flex-col items-start justify-center gap-px rounded-[10px] border border-white/15 px-3 text-left transition-colors hover:bg-white/5"
                                    aria-label="Профиль"
                                >
                                    <span className="max-w-[160px] truncate text-[13px] font-semibold leading-4 text-white">
                                        {formatShortUserName(user?.full_name) || "Профиль"}
                                    </span>
                                    <span className="text-[11px] font-medium leading-[13px] text-[#4CD08A]">{role}</span>
                                </button>
                            ) : (
                                <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(profileHref ?? '/profile')}
                                    className="h-11 px-4 rounded-xl bg-gradient-to-br from-white to-[#114A65]/5 hover:from-[#114A65]/10 hover:to-[#114A65]/20 border border-[#114A65]/20 hover:border-[#114A65]/40 transition-all duration-300 shadow-sm hover:shadow-md"
                                >
                                    <User className="w-5 h-5 text-[#114A65] mr-2"/>
                                    <span className="text-sm font-semibold text-[#114A65]">Профиль</span>
                                </Button>
                                <Badge variant="secondary" className="bg-gradient-to-r from-[#114A65]/10 to-[#114A65]/5 text-[#114A65] border-[#114A65]/30 px-3 py-1.5 font-semibold shadow-sm">{role}</Badge>
                                </>
                            )}
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
                                        {formatBadgeCount(unreadNotificationCount)}
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
