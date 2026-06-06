'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from "@/stores/useAuthStore"
import { useIsDesktop } from "@/hooks/use-media-query";
import {
  parseRequestDeepLinkUrl,
  savePendingRequestId,
  getRequestRedirectUrl,
} from "@/lib/shareRequest"

export default function Home() {
    const router = useRouter()
    const { role } = useAuthStore()
    const isDesktop = useIsDesktop()
    const [hasRedirected, setHasRedirected] = useState(false)

    useEffect(() => {
        if (hasRedirected) return
        const parsed = typeof window !== "undefined"
            ? parseRequestDeepLinkUrl(window.location.href)
            : null
        const requestId = parsed?.requestId
        if (requestId) savePendingRequestId(requestId)

        if (role) {
            const url = requestId
                ? getRequestRedirectUrl(role, requestId, isDesktop)
                : role.toLowerCase() === "client"
                    ? "/client"
                    : `/${role.toLowerCase().replace(/\s+/g, "-")}`
            setHasRedirected(true)
            router.replace(url)
        } else {
            setHasRedirected(true)
            router.replace("/login")
        }
    }, [router, role, isDesktop, hasRedirected])

    return null
}
