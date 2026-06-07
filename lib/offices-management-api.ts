import api, {
  type MeetingRoom,
  createMeetingRoom as createMeetingRoomRequest,
  deleteMeetingRoom as deleteMeetingRoomRequest,
  updateMeetingRoom as updateMeetingRoomRequest,
} from "@/lib/api";

function extractError(error: unknown): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    "Ошибка запроса"
  );
}

export interface ManagedOffice {
  id: number;
  name: string;
  city?: string;
  address?: string;
  block?: string | null;
  floor?: number | null;
  lat?: number | null;
  lon?: number | null;
  photo?: string | null;
  working_hours_start?: string | null;
  working_hours_end?: string | null;
  auto_track_enabled?: boolean;
}

export type { MeetingRoom };

export async function fetchManagedOffices(): Promise<
  { ok: true; data: ManagedOffice[] } | { ok: false; error: string }
> {
  try {
    const res = await api.get<ManagedOffice[] | ManagedOffice>("/offices");
    const data = res.data;
    const list = Array.isArray(data) ? data : data ? [data] : [];
    return { ok: true, data: list };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function getOfficeRooms(
  officeId: number,
): Promise<{ ok: true; data: MeetingRoom[] } | { ok: false; error: string }> {
  try {
    const res = await api.get<MeetingRoom[]>(`/offices/${officeId}/rooms`);
    const list = Array.isArray(res.data) ? res.data : [];
    return { ok: true, data: list };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function updateOfficeWorkingHours(
  officeId: number,
  body: {
    working_hours_start: string;
    working_hours_end: string;
    auto_track_enabled: boolean;
  },
): Promise<{ ok: true; data: ManagedOffice } | { ok: false; error: string }> {
  try {
    const res = await api.patch<ManagedOffice>(`/offices/${officeId}/working-hours`, body);
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function updateOffice(
  id: number,
  body: Partial<
    Pick<
      ManagedOffice,
      | "name"
      | "city"
      | "address"
      | "block"
      | "floor"
      | "working_hours_start"
      | "working_hours_end"
      | "auto_track_enabled"
    >
  >,
): Promise<{ ok: true; data: ManagedOffice } | { ok: false; error: string }> {
  try {
    const res = await api.put<ManagedOffice>(`/offices/${id}`, body);
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function createOffice(body: {
  name: string;
  address: string;
  city: string;
  block?: string | null;
  floor?: number | null;
  working_hours_start?: string;
  working_hours_end?: string;
  auto_track_enabled?: boolean;
}): Promise<{ ok: true; data: ManagedOffice } | { ok: false; error: string }> {
  try {
    const res = await api.post<ManagedOffice>("/offices", body);
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function createOfficeWithPhoto(
  formData: FormData,
): Promise<{ ok: true; data: ManagedOffice } | { ok: false; error: string }> {
  try {
    const res = await api.post<ManagedOffice>("/offices", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function updateOfficeWithPhoto(
  id: number,
  formData: FormData,
): Promise<{ ok: true; data: ManagedOffice } | { ok: false; error: string }> {
  try {
    const res = await api.put<ManagedOffice>(`/offices/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function deleteOffice(
  id: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api.delete(`/offices/${id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function createMeetingRoom(body: {
  name: string;
  office_id: number;
  floor?: number;
  capacity?: number;
}): Promise<{ ok: true; data: MeetingRoom } | { ok: false; error: string }> {
  try {
    const res = await createMeetingRoomRequest({
      name: body.name.trim(),
      office_id: body.office_id,
      floor: body.floor ?? 0,
      capacity: body.capacity ?? 1,
      photos: [],
      status: "available",
      isActive: true,
    });
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function updateMeetingRoom(
  id: number,
  body: { name?: string; floor?: number; capacity?: number },
): Promise<{ ok: true; data: MeetingRoom } | { ok: false; error: string }> {
  try {
    const res = await updateMeetingRoomRequest(id, body);
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}

export async function deleteMeetingRoom(
  id: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await deleteMeetingRoomRequest(id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: extractError(error) };
  }
}
