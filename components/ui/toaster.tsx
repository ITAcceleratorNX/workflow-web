"use client"

import { AlertCircle, CheckCircle2 } from "lucide-react"
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

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, icon, ...props }) {
        // Toasts of the product dark UI: an icon in front, the close button in the row.
        const product = props.variant === "success" || props.variant === "error"
        return (
          <Toast key={id} {...props}>
            {product ? (
              <span
                aria-hidden
                className={cn(
                  "flex size-[26px] shrink-0 items-center justify-center [&_svg]:size-6",
                  props.variant === "error" ? "text-ui-danger" : "text-ui-fg",
                )}
              >
                {icon ?? (props.variant === "error" ? <AlertCircle /> : <CheckCircle2 />)}
              </span>
            ) : null}
            <div className={cn("grid gap-1", product && "min-w-0 flex-1 gap-0.5")}>
              {title && <ToastTitle className={cn(product && "text-sm font-medium md:text-[15px] md:font-semibold")}>{title}</ToastTitle>}
              {description && (
                <ToastDescription className={cn(product && "text-[13px] text-ui-fg/75 opacity-100")}>
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            {product ? (
              action ? null : (
                <ToastClose className="static shrink-0 p-0.5 text-ui-fg opacity-100 hover:text-ui-fg focus:ring-ui-fg/70" />
              )
            ) : (
              <ToastClose />
            )}
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
