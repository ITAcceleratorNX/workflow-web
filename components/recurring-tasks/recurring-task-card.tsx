"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Pause,
  Play,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import type { RecurringTask } from "@/lib/recurring-tasks-api";
import {
  formatNextDueDate,
  getCompletedInstancesCount,
  getRecurrenceText,
  getRecurrenceTitle,
  getRecurringStatusLabel,
} from "@/lib/recurring-tasks-utils";

type RecurringTaskCardProps = {
  task: RecurringTask;
  userRole?: string;
  onShowDetails: (task: RecurringTask) => void;
  onShowHistory: (task: RecurringTask) => void;
  onToggle: (taskId: number, action: "pause" | "resume") => void;
  onDelete?: (taskId: number) => void;
};

function StatusBadge({ status }: { status: RecurringTask["recurring_status"] }) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-green-100 text-green-800 whitespace-nowrap">
          {getRecurringStatusLabel(status)}
        </Badge>
      );
    case "paused":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 whitespace-nowrap">
          {getRecurringStatusLabel(status)}
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-gray-100 text-gray-800 whitespace-nowrap">
          {getRecurringStatusLabel(status)}
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="whitespace-nowrap">
          {status}
        </Badge>
      );
  }
}

export function RecurringTaskCard({
  task,
  userRole,
  onShowDetails,
  onShowHistory,
  onToggle,
  onDelete,
}: RecurringTaskCardProps) {
  const completedCount = getCompletedInstancesCount(task);
  const totalInstances = task.taskInstances?.length ?? 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base sm:text-lg break-words flex-1 min-w-0">
            {getRecurrenceTitle(task.recurrence_type)}
          </CardTitle>
          <div className="shrink-0 ml-2">
            <StatusBadge status={task.recurring_status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="break-words">
            {getRecurrenceText(task.recurrence_type, task.recurrence_interval)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="break-words">Следующая дата: {formatNextDueDate(task.next_due_date)}</span>
        </div>

        {task.client ? (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="break-words">{task.client.name}</span>
          </div>
        ) : null}

        <div className="flex items-center gap-2 text-sm">
          <UserPlus
            className={`h-4 w-4 shrink-0 ${
              task.executors?.length ? "text-green-500" : "text-orange-500"
            }`}
          />
          <span className="break-words">
            {task.executors?.length ? (
              <span className="flex flex-col gap-1">
                <span className="text-green-600 font-medium">Исполнитель назначен</span>
                <span className="text-xs text-gray-600">
                  {task.executors.map((exec) => exec.full_name).join(", ")}
                </span>
              </span>
            ) : (
              <span className="text-orange-600 font-medium">Исполнитель не назначен</span>
            )}
          </span>
        </div>

        {totalInstances > 0 ? (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            <span className="break-words">
              {completedCount} из {totalInstances} выполнено
            </span>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onShowDetails(task)} className="w-full">
            <FileText className="h-4 w-4 mr-1" />
            Подробнее
          </Button>

          <Button variant="outline" size="sm" onClick={() => onShowHistory(task)} className="w-full">
            История
          </Button>

          {task.recurring_status === "active" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggle(task.id, "pause")}
              className="w-full"
            >
              <Pause className="h-4 w-4 mr-1" />
              Приостановить
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggle(task.id, "resume")}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-1" />
              Возобновить
            </Button>
          )}

          {userRole === "admin-worker" && onDelete ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Удалить
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
