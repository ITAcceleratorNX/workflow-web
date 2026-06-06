"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { ProfileModal } from "@/components/ProfileModal";

export default function DepartmentHeadProfilePage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  // На мобилке — тот же дизайн, что у клиента (общая страница /profile без вкладки «Логи»).
  // Редирект только при реальной ширине < 768, иначе useMediaQuery до гидрации даёт false и с десктопа уходили на /profile с модалкой.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      router.replace("/profile");
    }
  }, [router]);

  if (!isDesktop) {
    return null;
  }

  // Десктоп без изменений
  return (
    <div className="min-h-screen bg-[#1A1A1A] pb-20">
      <ProfileModal isOpen={true} onClose={() => {}} asSection={true} />
    </div>
  );
}
