"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useIsDesktop } from "@/hooks/use-media-query";
import { BottomNav } from "@/components/BottomNav";
import { AdminManagerMessagesDesktop } from "@/components/layout/AdminManagerMessagesDesktop";
import { AdminMessages } from "@/components/support-chat/AdminMessages";

export default function AdminMessagesPage() {
    const router = useRouter();
    const { user, role } = useAuthStore();
    const isDesktop = useIsDesktop();

    useEffect(() => {
        const canAccessAdminMessages = role === "admin-worker";
        if (user && !canAccessAdminMessages) {
            router.push(role === "client" || role === "department-head" || role === "manager" ? "/chat-bot" : "/login");
        }
    }, [user, role, router]);

    if (isDesktop) {
        return <AdminManagerMessagesDesktop canRespond={true} />;
    }

    return (
        <div className="min-h-screen flex flex-col pb-20 bg-[#1A1A1A]">
            <div
                className="sticky top-0 z-10 shrink-0 px-4 py-3 border-b border-white/10"
            >
                <h1 className="font-semibold text-2xl text-white">Сообщения</h1>
            </div>
            <div className="flex-1 min-h-0 p-4 flex flex-col">
                <AdminMessages canRespond={true} />
            </div>
            <BottomNav activeTab="help" />
        </div>
    );
}
