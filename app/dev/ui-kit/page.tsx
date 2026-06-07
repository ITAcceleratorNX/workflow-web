"use client";

import { useCallback, useState } from "react";
import { useIsDesktop } from "@/hooks/use-media-query";
import { MobilePageLayout } from "@/components/layout/MobilePageLayout";
import { PageLoader } from "@/components/ui/page-loader";
import { StatRow } from "@/components/ui/stat-row";

/**
 * Smoke-страница для UI Kit (2.1 + 2.2).
 * MobilePageLayout + ScreenHeader видны при viewport < 768px.
 */
export default function UiKitSmokePage() {
  const isDesktop = useIsDesktop();
  const [refreshCount, setRefreshCount] = useState(0);

  const handleRefresh = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 800));
    setRefreshCount((c) => c + 1);
  }, []);

  return (
    <>
      {isDesktop ? (
        <div className="mx-auto max-w-md p-4 text-sm text-muted-foreground">
          Desktop: уменьшите окно &lt;768px для MobilePageLayout smoke.
        </div>
      ) : null}
      <MobilePageLayout
        title="UI Kit"
        subtitle="Smoke test — MobilePageLayout"
        onRefresh={handleRefresh}
        padForBottomNav
        background="default"
        hideBackLabel
        onBack={() => window.history.back()}
      >
        <section className="mb-8 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">
            PageLoader
          </h2>
          <div className="flex items-center justify-around rounded-4pt-lg bg-black/20 p-6">
            <PageLoader size={64} variant="default" />
            <PageLoader size={56} variant="overlay" />
          </div>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">
            StatRow
          </h2>
          <div className="rounded-4pt-lg bg-black/20 p-4pt-lg">
            <StatRow
              label="Обновлений (pull)"
              value={refreshCount}
              valueClassName="text-white"
            />
            <StatRow label="Статус" value="OK" valueClassName="text-success" />
          </div>
        </section>

        <p className="text-sm text-white/70">
          Потяните вниз для PullToRefresh + PageLoader.
        </p>
      </MobilePageLayout>
    </>
  );
}
