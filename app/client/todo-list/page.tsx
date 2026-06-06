"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Legacy redirect — parity с workflow-mobile app/client/todo-list.tsx */
export default function ClientTodoListPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/client/tasks?tab=inbox&view=list");
    }, 200);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#1C1C1E] flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-10 w-10 animate-spin text-[#E25B21]" />
      <p className="text-sm text-[#8E8E93]">Переход к задачам…</p>
    </div>
  );
}
