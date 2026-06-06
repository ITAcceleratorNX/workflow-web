import { User, MessageCircle, House, Wrench, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { MOBILE_BOTTOM_NAV_LABELS } from "@/constants/mobile-layout";
import { getRequestsListPath } from "@/constants/roles";

interface BottomNavProps {
    activeTab?: 'home' | 'booking' | 'requests' | 'help' | 'profile' | 'history' | 'chat' | 'statistics';
    hidden?: boolean;
    /** Тёмный фон под панелью (для страниц с тёмной темой, напр. заявки клиента) */
    darkBackground?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab: activeTabProp, hidden = false, darkBackground = false }) => {
    const { role } = useAuthStore()
    const pathname = usePathname()

    if (hidden) {
        return null;
    }

    // URLs для навигации (BottomNav только на мобильных)
    const homeHref = role === 'client' ? '/client'
        : role === 'manager' ? '/manager/cabinet'
        : role === 'admin-worker' ? '/admin-worker'
        : role === 'department-head' ? '/department-head'
        : role === 'executor' ? '/executor' : '/home'
    const bookingHref = '/meeting-rooms'
    const requestsHref = getRequestsListPath(role);
    const helpHref = role === 'admin-worker' ? '/admin-worker/messages' : '/chat-bot'
    const profileHref = role === 'department-head' ? '/department-head/profile' : role === 'admin-worker' ? '/admin-worker/profile' : role === 'manager' ? '/manager/profile' : '/profile'

    // Цвета: активная вкладка — ярко белая, неактивные — приглушённые (хорошо видно на оранжевом)
    const activeColor = '#FFFFFF'
    const inactiveColor = 'rgba(255, 255, 255, 0.55)'

    const navItems = [
        { 
            key: 'home', 
            label: MOBILE_BOTTOM_NAV_LABELS.home, 
            href: homeHref, 
            icon: House,
            width: 'w-[65px]'
        },
        { 
            key: 'booking', 
            label: MOBILE_BOTTOM_NAV_LABELS.booking, 
            href: bookingHref, 
            icon: LayoutGrid,
            width: 'w-[31px]'
        },
        { 
            key: 'requests', 
            label: MOBILE_BOTTOM_NAV_LABELS.requests, 
            href: requestsHref, 
            icon: Wrench,
            width: 'w-[36px]'
        },
        { 
            key: 'help', 
            label: MOBILE_BOTTOM_NAV_LABELS.help, 
            href: helpHref, 
            icon: MessageCircle,
            width: 'w-[52px]'
        },
        { 
            key: 'profile', 
            label: MOBILE_BOTTOM_NAV_LABELS.profile, 
            href: profileHref, 
            icon: User,
            width: 'w-[46px]'
        },
    ]

    // Определяем активную вкладку: из пропса или по текущему pathname (чтобы цвета не «залипали»)
    const getActiveTabFromPath = (): string | undefined => {
        const path = pathname?.split('?')[0] || ''
        const isHomePath =
            path === '/cabinet' ||
            path === '/client' ||
            path === '/home' ||
            path === '/admin-worker' ||
            (role && path === `/${role}`) ||
            (role === 'admin-worker' && path.startsWith('/admin-worker/management')) ||
            (role === 'department-head' && path.startsWith('/department-head/management')) ||
            (role === 'manager' && path.startsWith('/manager/cabinet'))
        if (isHomePath) return 'home'
        if (path === bookingHref || path.startsWith('/meeting-rooms')) return 'booking'
        if (
            path === requestsHref ||
            path === '/requests' ||
            path.startsWith('/client/requests') ||
            path === '/create-request' ||
            path.startsWith('/admin-worker/requests') ||
            path.startsWith('/department-head/requests') ||
            path.startsWith('/executor/requests') ||
            path.startsWith('/manager/requests')
        ) {
            return 'requests'
        }
        if (path === helpHref || path.startsWith('/chat-bot') || path.startsWith('/admin-worker/messages') || path.startsWith('/manager/messages') || path.startsWith('/department-head/messages')) return 'help'
        if (path === profileHref || path.startsWith('/profile') || path.startsWith('/department-head/profile') || path.startsWith('/admin-worker/profile') || path.startsWith('/manager/profile')) return 'profile'
        return undefined
    }
    const normalizeActiveTab = (tab: string | undefined): string | undefined => {
        if (!tab) return undefined
        const mapping: Record<string, string> = {
            'history': 'home',
            'chat': 'help',
            'statistics': 'home',
        }
        return mapping[tab] || tab
    }
    const activeTab = normalizeActiveTab(activeTabProp) ?? getActiveTabFromPath()
    const normalizedActiveTab = activeTab

    const getItemColor = (itemKey: string) => {
        return normalizedActiveTab === itemKey ? activeColor : inactiveColor
    }

    return (
        <>
        {/* Фон под навбаром и safe area — тёмный на странице заявок, иначе прозрачный */}
        <div 
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none"
            style={{
                height: 'calc(73px + env(safe-area-inset-bottom, 0px))',
                background: darkBackground ? '#1C1C1E' : 'transparent',
            }}
        />
        <nav 
            className="md:hidden fixed z-50"
            style={{
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px 20px',
                gap: '8px',
                height: '70px',
                background: 'hsl(var(--brand-error))',
                borderRadius: '25px',
                left: '12px',
                right: '12px',
                bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
            }}
        >
            {navItems.map((item) => {
                const Icon = item.icon
                const color = getItemColor(item.key)
                
                return (
                    <Link 
                        key={item.key}
                        href={item.href}
                        className="flex flex-col justify-center items-center gap-1 mx-auto"
                        style={{
                            padding: '0px',
                            height: '40px',
                            flex: 'none',
                            flexGrow: 0,
                        }}
                    >
                        <Icon 
                            className="w-6 h-6 flex-none"
                            style={{ color }}
                        />
                        <span 
                            className="text-[10px] font-medium text-center leading-3"
                            style={{ 
                                color,
                                fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
                            }}
                        >
                            {item.label}
                        </span>
                    </Link>
                )
            })}
        </nav>
        </>
    );
};