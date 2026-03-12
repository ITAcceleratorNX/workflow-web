'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from "@/stores/useAuthStore"
import { getQueryStringForRedirect, savePendingRequestQuery } from "@/lib/shareRequest"

export default function Home() {
    const router = useRouter()
    const { role } = useAuthStore()
    const [hasRedirected, setHasRedirected] = useState(false)

    useEffect(() => {
        if (hasRedirected) return
        const queryString = getQueryStringForRedirect()
        if (queryString) savePendingRequestQuery(queryString)

        if (role) {
            const base = role.toLowerCase().replace(/\s+/g, '-')
            const url = role.toLowerCase() === 'client'
                ? (queryString ? `/cabinet?${queryString}` : '/cabinet')
                : (queryString ? `/${base}?${queryString}` : `/${base}`)
            setHasRedirected(true)
            router.replace(url)
        } else {
            setHasRedirected(true)
            router.replace(queryString ? `/login?${queryString}` : '/login')
        }
    }, [router, role, hasRedirected])

    return null
}
