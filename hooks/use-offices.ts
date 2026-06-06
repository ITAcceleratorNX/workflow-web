"use client";

import { useEffect, useState } from "react";
import { getOffices, type Office } from "@/lib/api";

function parseOfficesResponse(raw: unknown): Office[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray((raw as { data?: Office[] })?.data)) {
    return (raw as { data: Office[] }).data;
  }
  return [];
}

interface UseOfficesOptions {
  enabled?: boolean;
}

export function useOffices({ enabled = true }: UseOfficesOptions = {}) {
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setOffices([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getOffices()
      .then((res) => {
        if (!cancelled) {
          setOffices(parseOfficesResponse(res.data));
        }
      })
      .catch(() => {
        if (!cancelled) setOffices([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { offices, loading };
}
