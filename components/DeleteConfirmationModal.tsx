"use client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (() => void) | ((arg: any) => Promise<void>)
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  variant?: "default" | "dark"
}

export function DeleteConfirmationModal({
                                          isOpen,
                                          onClose,
                                          onConfirm,
                                          title,
                                          description,
                                          confirmText = "Удалить",
                                          cancelText = "Отмена",
                                          isLoading = false,
                                          variant = "default",
                                        }: DeleteConfirmationModalProps) {
  const isDark = variant === "dark";
  return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
          <AlertDialogContent className={cn(
            "w-[calc(100vw-2rem)] max-w-[400px] mx-auto rounded-xl shadow-2xl p-0 overflow-hidden",
            isDark ? "border-[#3A3A3C] bg-[#1A1A1A]" : "border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
          )}>
              <AlertDialogHeader className="px-6 pt-6 pb-4 space-y-4">
            <AlertDialogTitle className={cn(
              "text-xl sm:text-2xl font-semibold leading-tight text-center",
              isDark ? "text-white" : "text-neutral-900 dark:text-neutral-100"
            )}>
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(
              "text-sm sm:text-base leading-relaxed text-center max-w-sm mx-auto",
              isDark ? "text-white/70" : "text-neutral-600 dark:text-neutral-400"
            )}>
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="px-6 pb-6 pt-2 flex flex-col gap-3 sm:flex-row sm:gap-3 sm:justify-end">
            <AlertDialogCancel
                className={cn(
                  "w-full sm:w-auto sm:min-w-[100px] h-12 sm:h-10 rounded-lg font-medium transition-all duration-200 text-base sm:text-sm order-2 sm:order-1",
                  isDark ? "bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white border-[#3A3A3C]" : "bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                )}
            >
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
                className={cn(
                  "w-full sm:w-auto sm:min-w-[100px] h-12 sm:h-10 rounded-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 text-base sm:text-sm order-1 sm:order-2 shadow-sm",
                  confirmText.includes("Забронировать") || confirmText.includes("бронирова")
                    ? "bg-[#E85D2B] hover:bg-[#D94F15] text-white"
                    : isDark
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-red-700 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900"
                )}
                onClick={onConfirm}
                disabled={isLoading}
            >
              {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
                    <span className="text-sm sm:text-sm">Удаление...</span>
                  </div>
              ) : (
                  confirmText
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
  )
}
