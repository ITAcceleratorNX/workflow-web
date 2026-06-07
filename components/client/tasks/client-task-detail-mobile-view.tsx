"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteUserTask, getUserTask, updateUserTask, type UserTask } from "@/lib/user-tasks-api";
import { useUserTasksInvalidateStore } from "@/stores/user-tasks-invalidate-store";

type ClientTaskDetailMobileViewProps = {
  taskId: number;
};

/** Mobile task detail — базовый parity с workflow-mobile tasks/details. */
export function ClientTaskDetailMobileView({ taskId }: ClientTaskDetailMobileViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const bump = useUserTasksInvalidateStore((s) => s.bump);
  const [task, setTask] = useState<UserTask | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getUserTask(taskId).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setTask(res.data);
        setTitle(res.data.title);
      } else {
        toast({ title: "Ошибка", description: res.error, variant: "destructive" });
        router.back();
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [taskId, router, toast]);

  const handleToggle = async () => {
    if (!task) return;
    const res = await updateUserTask(task.id, { completed: !task.completed });
    if (res.ok) {
      setTask(res.data);
      bump();
    }
  };

  const handleSaveTitle = async () => {
    if (!task || title.trim() === task.title) return;
    setSaving(true);
    const res = await updateUserTask(task.id, { title: title.trim() });
    setSaving(false);
    if (res.ok) {
      setTask(res.data);
      bump();
      toast({ title: "Сохранено", duration: 2000 });
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    const res = await deleteUserTask(task.id);
    if (res.ok) {
      bump();
      router.replace("/client/tasks");
    } else {
      toast({ title: "Ошибка", description: res.error, variant: "destructive" });
    }
  };

  return (
    <>
      <div
        className="min-h-screen bg-background"
        
      >
        <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center text-[#E25B21] mb-4 min-h-11"
          >
            <ChevronLeft className="h-7 w-7" />
            <span className="text-base font-medium ml-0.5">Назад</span>
          </button>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-[#E25B21]" />
            </div>
          ) : task ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => void handleToggle()}
                  className={`w-[22px] h-[22px] mt-1 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    task.completed ? "bg-[#E25B21] border-[#E25B21]" : "border-[#3A3A3C]"
                  }`}
                >
                  {task.completed ? <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} /> : null}
                </button>
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => void handleSaveTitle()}
                  rows={3}
                  className="flex-1 bg-transparent text-xl font-semibold text-white outline-none resize-none"
                />
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveTitle()}
                className="w-full rounded-xl bg-[#2C2C2E] border border-[#3A3A3C] py-3 text-white font-medium"
              >
                {saving ? "Сохранение…" : "Сохранить название"}
              </button>

              <button
                type="button"
                onClick={() => void handleDelete()}
                className="w-full rounded-xl border border-red-500/40 bg-red-500/10 py-3 text-red-400 font-medium flex items-center justify-center gap-2"
              >
                <Trash2 className="h-5 w-5" />
                Удалить задачу
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
