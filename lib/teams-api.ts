import api from "@/lib/api";
import { useTeamsInvalidateStore } from "@/stores/teams-invalidate-store";

export interface TeamUserRef {
  id: number;
  full_name: string;
}

export interface Team {
  id: number;
  name: string;
  leader_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  leader?: TeamUserRef;
  teamCreator?: TeamUserRef;
  members?: TeamUserRef[];
}

export interface TeamsListResponse {
  teams: Team[];
}

function unwrapTeamPayload(raw: unknown): Team {
  if (raw && typeof raw === "object" && "team" in raw) {
    const t = (raw as { team?: Team }).team;
    if (t) return t;
  }
  return raw as Team;
}

function normalizeUserRef(u: unknown): TeamUserRef | null {
  if (!u || typeof u !== "object") return null;
  const o = u as Record<string, unknown>;
  const id = Number(o.id);
  if (!Number.isFinite(id)) return null;
  const raw =
    (typeof o.full_name === "string" && o.full_name.trim()) ||
    (typeof o.fullName === "string" && o.fullName.trim()) ||
    "";
  return { id, full_name: raw || `Пользователь #${id}` };
}

function normalizeTeam(team: Team): Team {
  const out = {
    ...team,
    leader_id: Number(team.leader_id),
    created_by: Number(team.created_by),
  };
  if (team.leader != null) {
    out.leader =
      normalizeUserRef(team.leader) ?? {
        id: team.leader_id,
        full_name: `Пользователь #${team.leader_id}`,
      };
  }
  if (team.members != null) {
    out.members = team.members.map(
      (m) =>
        normalizeUserRef(m) ?? {
          id: m.id,
          full_name: `Пользователь #${m.id}`,
        },
    );
  }
  return out;
}

function extractError(error: unknown): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    "Ошибка запроса"
  );
}

export async function getTeams(): Promise<
  { ok: true; data: TeamsListResponse } | { ok: false; error: string }
> {
  try {
    const res = await api.get<TeamsListResponse>("/teams");
    return {
      ok: true,
      data: {
        teams: (res.data.teams ?? []).map((t) => normalizeTeam(t)),
      },
    };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function getTeam(
  id: number,
): Promise<{ ok: true; data: Team } | { ok: false; error: string }> {
  try {
    const res = await api.get<{ team: Team } | Team>(`/teams/${id}`);
    return { ok: true, data: normalizeTeam(unwrapTeamPayload(res.data)) };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function createTeam(body: {
  name: string;
  leader_id: number;
  member_ids: number[];
}): Promise<{ ok: true; data: Team } | { ok: false; error: string }> {
  try {
    const res = await api.post<{ team: Team } | Team>("/teams", body);
    return { ok: true, data: normalizeTeam(unwrapTeamPayload(res.data)) };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function updateTeam(
  id: number,
  body: Partial<{
    name: string;
    leader_id: number;
    member_ids: number[];
  }>,
): Promise<{ ok: true; data: Team } | { ok: false; error: string }> {
  try {
    const res = await api.patch<{ team: Team } | Team>(`/teams/${id}`, body);
    return { ok: true, data: normalizeTeam(unwrapTeamPayload(res.data)) };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function deleteTeam(
  id: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api.delete(`/teams/${id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export function bumpTeamsCache() {
  useTeamsInvalidateStore.getState().bump();
}

export function membersPluralRu(n: number): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return "участник";
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return "участника";
  return "участников";
}
