import type { Metadata } from "next";
import { GuestRequestPage } from "@/components/requests/guest-request-view";

export const metadata: Metadata = {
  title: "Заявка — Workflow",
  robots: { index: false, follow: false },
};

export default async function SharedRequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <GuestRequestPage token={token} />;
}
