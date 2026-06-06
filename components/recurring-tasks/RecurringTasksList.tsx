"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CommentsModal } from "@/components/CommentsModal";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRecurringTasksList } from "@/hooks/use-recurring-tasks-list";
import type { RecurringTask } from "@/lib/recurring-tasks-api";
import { RecurringTaskCard } from "./recurring-task-card";
import { RecurringTaskDetails } from "./RecurringTaskDetails";
import { TaskInstancesList } from "./TaskInstancesList";

interface RecurringTasksListProps {
  userRole?: string;
  isDesktop?: boolean;
  onRateRequest?: (request: unknown) => void;
  onRedirectToOtherDepartment?: (request: unknown) => void;
  onAssignExecutor?: (request: unknown) => void;
  onShowMap?: (location: { lat: number; lon: number; accuracy: number }) => void;
  onDeleteTask?: (taskId: number) => void;
  openModal?: (name: string) => void;
  closeModalWithHistory?: () => void;
}

export function RecurringTasksList({
  userRole,
  isDesktop = false,
  onRateRequest,
  onRedirectToOtherDepartment,
  onAssignExecutor,
  onShowMap,
  onDeleteTask,
  openModal,
  closeModalWithHistory,
}: RecurringTasksListProps) {
  const { tasks, loading, fetchTasks, handleToggleTask } = useRecurringTasksList();
  const { user } = useAuthStore();

  const [showInstances, setShowInstances] = useState(false);
  const [selectedTask, setSelectedTask] = useState<RecurringTask | null>(null);
  const [showComments, setShowComments] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (selectedTask && !event.state?.modal) {
        setSelectedTask(null);
        setShowComments(null);
        setFormErrors(null);
      }
      if (showInstances && !event.state?.modal) {
        setShowInstances(false);
        setSelectedTask(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedTask, showInstances]);

  const handleDeleteClick = (taskId: number) => {
    setTaskToDelete(taskId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (taskToDelete && onDeleteTask) {
      try {
        await onDeleteTask(taskToDelete);
        setShowDeleteConfirm(false);
        setTaskToDelete(null);
        await fetchTasks();
      } catch {
        // toast handled in parent hook
      }
    }
  };

  const openDetails = (task: RecurringTask) => {
    setSelectedTask(task);
    openModal?.("recurringTaskDetails");
  };

  const openHistory = (task: RecurringTask) => {
    setSelectedTask(task);
    setShowInstances(true);
    openModal?.("taskHistory");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#114A65] mx-auto" />
          <p className="mt-2 text-gray-600">Загрузка задач...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 px-4">
            <div className="text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2 text-lg">Повторяющихся задач пока нет</p>
              <p className="text-sm text-muted-foreground">
                Создавайте повторяющиеся задачи через форму создания заявок
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <RecurringTaskCard
              key={task.id}
              task={task}
              userRole={userRole}
              onShowDetails={openDetails}
              onShowHistory={openHistory}
              onToggle={handleToggleTask}
              onDelete={userRole === "admin-worker" && onDeleteTask ? handleDeleteClick : undefined}
            />
          ))}
        </div>
      )}

      <Dialog
        open={showInstances}
        onOpenChange={(open) => {
          setShowInstances(open);
          if (!open) closeModalWithHistory?.();
        }}
      >
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">История выполнения:</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            {selectedTask ? <TaskInstancesList taskId={selectedTask.id} /> : null}
          </div>
        </DialogContent>
      </Dialog>

      {selectedTask ? (
        <RecurringTaskDetails
          task={selectedTask}
          userRole={userRole || ""}
          isDesktop={isDesktop}
          onClose={() => {
            setSelectedTask(null);
            setShowComments(null);
            setFormErrors(null);
            closeModalWithHistory?.();
          }}
          onRateRequest={onRateRequest}
          onRedirectToOtherDepartment={onRedirectToOtherDepartment}
          onAssignExecutor={onAssignExecutor}
          onDeleteTask={onDeleteTask}
          showComments={showComments}
          setShowComments={setShowComments}
          formErrors={formErrors}
          onShowMap={onShowMap}
          onRefreshTask={fetchTasks}
        />
      ) : null}

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Вы уверены, что хотите удалить эту повторяющуюся задачу? Это действие нельзя отменить.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setTaskToDelete(null);
              }}
            >
              Отмена
            </Button>
            <Button variant="destructive" onClick={() => void handleConfirmDelete()}>
              Удалить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isDesktop ? (
        <CommentsModal
          isOpen={!!showComments}
          onClose={() => setShowComments(null)}
          requestId={showComments}
          currentUserId={user?.id || null}
          isDesktop={isDesktop}
        />
      ) : (
        mounted &&
        showComments &&
        createPortal(
          <CommentsModal
            isOpen={!!showComments}
            onClose={() => setShowComments(null)}
            requestId={showComments}
            currentUserId={user?.id || null}
            isDesktop={isDesktop}
          />,
          document.body
        )
      )}
    </div>
  );
}
