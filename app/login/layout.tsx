import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вход",
  description: "Вход в Workflow — сервис заявок на уборку, ремонт и обслуживание офиса и бронирования переговорных.",
  alternates: { canonical: "/login" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
