import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Регистрация",
  description: "Регистрация в Workflow: сотрудники и исполнители офиса подают заявку на доступ к сервису обслуживания офиса.",
  alternates: { canonical: "/register" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
