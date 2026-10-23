"use client";

import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Form controls of the product dark UI (Figma «Новая задача (окно)»): a caption above, a dark box
 * with a thin border that turns accent on focus.
 */
const boxClass =
  "w-full rounded-xl border border-ui-fg/10 bg-ui-fg/[0.03] text-[15px] text-ui-fg placeholder:text-ui-fg/40 transition-colors focus-visible:border-ui-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ui-accent disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-ui-danger";

export function FieldLabel({ htmlFor, id, children }: { htmlFor?: string; id?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} id={id} className="text-[13px] font-medium text-ui-fg/55">
      {children}
    </label>
  );
}

export const FieldInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function FieldInput(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(boxClass, "h-[43px] px-3.5", className)} {...props} />;
});

export const FieldTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function FieldTextarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(boxClass, "min-h-[70px] resize-y px-3.5 py-3 leading-[18px]", className)} {...props} />;
  },
);

type FieldButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  /** Highlights the box while its picker is open. */
  active?: boolean;
};

/** A select-like box that opens a picker: icon, value, chevron. */
export const FieldButton = forwardRef<HTMLButtonElement, FieldButtonProps>(function FieldButton(
  { icon, active = false, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        boxClass,
        "flex h-[43px] items-center gap-2.5 pl-3.5 pr-3 text-left",
        active && "border-ui-accent ring-1 ring-ui-accent",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span aria-hidden className="flex size-4 shrink-0 items-center justify-center text-ui-fg/60 [&_svg]:size-4">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ChevronDown aria-hidden className="size-4 shrink-0 text-ui-fg/50" />
    </button>
  );
});
