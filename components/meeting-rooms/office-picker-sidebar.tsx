"use client";

import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Office } from "@/lib/api";

interface OfficePickerSidebarProps {
  offices: Office[];
  selectedOffice: Office | null;
  onSelect: (office: Office) => void;
  loading?: boolean;
}

export function OfficePickerSidebar({
  offices,
  selectedOffice,
  onSelect,
  loading = false,
}: OfficePickerSidebarProps) {
  return (
    <div className="w-72 shrink-0 flex flex-col gap-2 overflow-y-auto">
      <h3 className="text-sm font-semibold text-muted-foreground">Офисы</h3>
      {loading || offices.length === 0 ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : (
        <div className="space-y-2">
          {offices.map((office) => (
            <Card
              key={office.id}
              className={cn(
                "cursor-pointer transition-all",
                selectedOffice?.id === office.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "hover:bg-muted/50",
              )}
              onClick={() => onSelect(office)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center bg-muted">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{office.name}</p>
                  <p className="text-xs truncate text-muted-foreground">{office.city}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
