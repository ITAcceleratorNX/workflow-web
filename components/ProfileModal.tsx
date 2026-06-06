"use client";

import { ProfileDesktopSection } from "@/components/profile/profile-desktop-section";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFullScreen?: boolean;
  asSection?: boolean;
}

/** Backward-compatible wrapper — логика и UI в components/profile/. */
export function ProfileModal({ isOpen, onClose, asSection = false }: ProfileModalProps) {
  void onClose;
  if (!isOpen && !asSection) return null;
  return <ProfileDesktopSection />;
}
