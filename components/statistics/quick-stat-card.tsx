import type { ReactNode } from "react";

/** Плитка «число + подпись» в шапке мобильной статистики ролей. */
export function QuickStatCard({
  icon,
  value,
  label,
  className,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  className: string;
}) {
  return (
    <div className={`flex-1 min-w-[47%] max-w-[48%] rounded-xl p-3.5 ${className}`}>
      {icon}
      <p className="text-[22px] font-bold text-white mt-1.5">{value}</p>
      <p className="text-xs text-[#8E8E93] mt-0.5">{label}</p>
    </div>
  );
}
