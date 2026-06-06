"use client";

import { ProfileModal } from "@/components/ProfileModal";
import { useAdminWorkerProfile } from "@/hooks/use-admin-worker-profile";

export function AdminWorkerProfileView() {
  const { isDesktop } = useAdminWorkerProfile();

  if (!isDesktop) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] pb-20">
      <ProfileModal isOpen={true} onClose={() => {}} asSection={true} />
    </div>
  );
}
