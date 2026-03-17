"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ActivityStatsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/client")
  }, [router])

  return null
}
