import api from "@/lib/api";

export interface UserSearchItem {
  id: number;
  full_name: string;
  phone?: string;
}

export function normalizeUserSearchItem(raw: unknown): UserSearchItem {
  if (!raw || typeof raw !== "object") {
    return { id: 0, full_name: "Пользователь" };
  }
  const o = raw as Record<string, unknown>;
  const id = Number(o.id);
  const first = typeof o.first_name === "string" ? o.first_name.trim() : "";
  const last = typeof o.last_name === "string" ? o.last_name.trim() : "";
  const combined = [first, last].filter(Boolean).join(" ");
  const name =
    (typeof o.full_name === "string" && o.full_name.trim()) ||
    (typeof o.fullName === "string" && o.fullName.trim()) ||
    (typeof o.name === "string" && o.name.trim()) ||
    combined ||
    "";
  const safeId = Number.isFinite(id) ? id : 0;
  return {
    id: safeId,
    full_name: name || (safeId > 0 ? `Пользователь #${safeId}` : "Пользователь"),
    phone: typeof o.phone === "string" ? o.phone : undefined,
  };
}

function extractError(error: unknown): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    "Ошибка запроса"
  );
}

export async function searchUsersForAssign(
  query: string,
): Promise<{ ok: true; data: UserSearchItem[] } | { ok: false; error: string }> {
  const q = query?.trim();
  if (!q) return { ok: true, data: [] };
  try {
    const res = await api.get<{ success: boolean; users: unknown[] }>("/users/search", {
      params: { q },
    });
    const list = Array.isArray(res.data?.users) ? res.data.users : [];
    return {
      ok: true,
      data: list.map(normalizeUserSearchItem).filter((u) => u.id > 0),
    };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}
