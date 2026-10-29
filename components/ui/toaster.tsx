"use client"

import { AlertCircle, CheckCircle2, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { cn } from "@/lib/utils"

const DEFAULT_ICONS = {
  success: <CheckCircle2 />,
  error: <AlertCircle />,
  info: <Info />,
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, icon, ...props }) {
        // An icon in front; the close button in the row unless the toast has its own action.
        return (
          <Toast key={id} {...props}>
            <span
              aria-hidden
              className={cn(
                "flex size-[26px] shrink-0 items-center justify-center [&_svg]:size-6",
                props.variant === "error" ? "text-ui-danger" : "text-ui-fg",
              )}
            >
              {icon ?? DEFAULT_ICONS[props.variant]}
            </span>
            <div className="grid min-w-0 flex-1 gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action ?? <ToastClose />}
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
