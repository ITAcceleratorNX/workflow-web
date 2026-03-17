"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminActivityStatsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin-worker")
  }, [router])

  return null
}
