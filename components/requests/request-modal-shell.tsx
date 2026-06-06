"use client";

import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface RequestModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  overlayClassName?: string;
  usePortal?: boolean;
  closeOnOverlayClick?: boolean;
}

export function RequestModalShell({
  isOpen,
  onClose,
  children,
  overlayClassName,
  usePortal = false,
  closeOnOverlayClick = true,
}: RequestModalShellProps) {
  if (!isOpen) return null;

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  const content = (
    <div
      className={cn(
        "fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm",
        overlayClassName
      )}
      onClick={handleOverlayClick}
    >
      {children}
    </div>
  );

  if (usePortal && typeof document !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
}
