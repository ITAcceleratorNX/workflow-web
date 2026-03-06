"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Редирект на /chat-bot — тот же функционал, что у клиента:
 * чат с ботом и техподдержка.
 */
export default function DepartmentHeadMessagesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/chat-bot");
  }, [router]);

  return null;
}
