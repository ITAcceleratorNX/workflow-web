import { api, getClientRoomSubscriptions } from "@/lib/api";
import type { RequestGroup, SubRequest } from "@/stores/useRequestStore";

export interface CreateRequestOffice {
  id: number;
  name: string;
  city: string;
  address: string;
  lat?: number | null;
  lon?: number | null;
  photo?: string | null;
}

export interface CreateRequestExecutor {
  id: number;
  executor_id: number;
  user: {
    id: number;
    full_name: string;
    phone?: string;
  };
  specialty: string;
  workload: number;
}

export interface CreateRequestUser {
  id: number;
  role: string;
  service_category_id?: number;
}

const GUEST_DEMO_CATEGORIES = [
  { id: 1, name: "Уборка", subcategories: [{ id: 1, name: "Ежедневная", category_id: 1 }] },
  { id: 2, name: "IT", subcategories: [{ id: 2, name: "Компьютер", category_id: 2 }] },
];

const GUEST_DEMO_OFFICES: CreateRequestOffice[] = [
  { id: 1, name: "Teniz Towers", city: "Алматы", address: "Teniz Towers (демо)" },
];

const ROLES_WITH_CABINET_ROOMS = ["admin-worker", "department-head", "executor", "manager"];

export function buildGuestMockRequestGroup(formData: FormData): RequestGroup {
  const requestType = (formData.get("request_type") as string) || "normal";
  const location = (formData.get("location") as string) || "";
  const locationDetail = (formData.get("location_detail") as string) || "";
  const status = (formData.get("status") as string) || "in_progress";
  const officeId = formData.get("office_id");
  const subRequestsJson = formData.get("sub_requests") as string;
  let subRequestsData: Array<{ title: string; description: string; category_id: number; status: string }> = [];
  try {
    subRequestsData = JSON.parse(subRequestsJson || "[]");
  } catch {
    subRequestsData = [];
  }
  const now = new Date().toISOString();
  const groupId = -Date.now();
  return {
    id: groupId,
    client_id: 0,
    office_id: officeId ? parseInt(String(officeId), 10) : 0,
    location,
    location_detail: locationDetail,
    status,
    request_type: requestType,
    created_date: now,
    requests: subRequestsData.map((sub, i) => ({
      id: groupId * 100 - i,
      title: sub.title,
      description: sub.description,
      status: sub.status || "in_progress",
      category_id: sub.category_id,
      created_date: now,
    })) as SubRequest[],
  };
}

export async function loadCreateRequestPageData(options: {
  user: CreateRequestUser;
  isGuest: boolean;
  token: string;
  fetchCategories: (token: string) => Promise<void>;
  updateCategories: (categories: typeof GUEST_DEMO_CATEGORIES) => void;
}): Promise<{
  offices: CreateRequestOffice[];
  executors: CreateRequestExecutor[];
  userCabinetRooms: { id: number; name: string; office_id: number }[];
}> {
  const { user, isGuest, token, fetchCategories, updateCategories } = options;

  if (isGuest) {
    updateCategories(GUEST_DEMO_CATEGORIES);
    return {
      offices: GUEST_DEMO_OFFICES,
      executors: [],
      userCabinetRooms: [],
    };
  }

  await fetchCategories(token || "");

  const [executors, offices, userCabinetRooms] = await Promise.all([
    user.role === "department-head" ? fetchExecutors() : Promise.resolve([]),
    fetchOffices(),
    ROLES_WITH_CABINET_ROOMS.includes(user.role) && user.id
      ? fetchUserCabinetRooms(user.id)
      : Promise.resolve([]),
  ]);

  return { offices, executors, userCabinetRooms };
}

async function fetchExecutors(): Promise<CreateRequestExecutor[]> {
  try {
    const response = await api.get("/executors");
    return response.data;
  } catch (error) {
    console.error("Ошибка загрузки исполнителей:", error);
    return [];
  }
}

async function fetchOffices(): Promise<CreateRequestOffice[]> {
  try {
    const response = await api.get("/offices");
    return response.data;
  } catch (error) {
    console.error("Ошибка загрузки офисов:", error);
    return [];
  }
}

async function fetchUserCabinetRooms(
  userId: number
): Promise<{ id: number; name: string; office_id: number }[]> {
  try {
    const res = await getClientRoomSubscriptions(userId);
    const subs = res.data?.subscriptions ?? [];
    return subs
      .filter((s: any) => s.meetingRoom?.room_type === "cabinet")
      .map((s: any) => ({
        id: s.meetingRoom.id,
        name: s.meetingRoom.name,
        office_id: s.meetingRoom.office_id ?? 0,
      }))
      .filter((c: any) => c.office_id > 0);
  } catch {
    return [];
  }
}

export type CreateRequestMode = "create" | "createAndComplete";

export interface SubmitCreateRequestOptions {
  user: CreateRequestUser;
  formData: FormData;
  isGuest: boolean;
  createMode: CreateRequestMode;
  addGuestRequest: (group: RequestGroup) => void;
}

export type SubmitCreateRequestResult =
  | { ok: true; toast: { title: string; description: string } }
  | { ok: false; error: string };

/** Отправка формы создания заявки — общая логика для /create-request и client dashboard. */
export async function submitCreateRequestForm(
  options: SubmitCreateRequestOptions
): Promise<SubmitCreateRequestResult> {
  const { user, formData, isGuest, createMode, addGuestRequest } = options;

  if (isGuest) {
    addGuestRequest(buildGuestMockRequestGroup(formData));
    return {
      ok: true,
      toast: {
        title: "Демо",
        description: "Заявка создана локально и отображается в списке заявок",
      },
    };
  }

  try {
    switch (user.role) {
      case "client": {
        await api.post("/request-groups", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return {
          ok: true,
          toast: {
            title: "Успешно!",
            description: "Заявка создана и отправлена на рассмотрение",
          },
        };
      }
      case "admin-worker": {
        await api.post("/request-groups", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return {
          ok: true,
          toast: {
            title: "Заявка создана!",
            description: "Заявка отправлена на назначение исполнителей",
          },
        };
      }
      case "department-head": {
        const requestType = formData.get("request_type") as string;
        const location = formData.get("location") as string;
        const locationDetail = formData.get("location_detail") as string;
        const status = formData.get("status") as string;
        const subRequestsJson = formData.get("sub_requests") as string;
        const photos = formData.getAll("photos") as File[];
        const subRequests = JSON.parse(subRequestsJson);

        const apiFormData = new FormData();
        apiFormData.append("request_type", requestType);
        apiFormData.append("location", location);
        apiFormData.append("location_detail", locationDetail);
        apiFormData.append("status", status);
        apiFormData.append("sub_requests", JSON.stringify(subRequests));
        photos.forEach((photo) => apiFormData.append("photos", photo));

        await api.post("/request-groups", apiFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const hasExecutors = subRequests.some(
          (subReq: any) => subReq.executors && subReq.executors.length > 0
        );
        return {
          ok: true,
          toast: hasExecutors
            ? {
                title: "Заявка создана и исполнители назначены!",
                description: "Заявка успешно создана и передана исполнителям",
              }
            : {
                title: "Заявка создана!",
                description: "Заявка отправлена на рассмотрение администратора",
              },
        };
      }
      case "executor": {
        const afterPhotos = formData.getAll("after_photos");
        formData.delete("after_photos");

        const response = await api.post("/request-groups", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const newRequestGroup = response.data;

        if (afterPhotos.length > 0) {
          const afterFormData = new FormData();
          afterPhotos.forEach((photo) => afterFormData.append("photos", photo));
          afterFormData.append("type", "after");
          try {
            await api.post(`/request-photos/${newRequestGroup.id}/photos`, afterFormData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          } catch (photoError) {
            console.error("Ошибка при загрузке after_photos:", photoError);
          }
        }

        return createMode === "createAndComplete"
          ? {
              ok: true,
              toast: {
                title: "Заявка создана и завершена!",
                description: "Заявка успешно создана, выполнена и закрыта с отчётом",
              },
            }
          : {
              ok: true,
              toast: {
                title: "Заявка создана!",
                description: "Заявка успешно создана и взята в работу",
              },
            };
      }
      case "manager": {
        await api.post("/request-groups", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return {
          ok: true,
          toast: {
            title: "Заявка создана!",
            description: "Заявка успешно создана",
          },
        };
      }
      default: {
        await api.post("/request-groups", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return {
          ok: true,
          toast: {
            title: "Успешно!",
            description: "Заявка создана успешно",
          },
        };
      }
    }
  } catch (error: any) {
    console.error("Ошибка создания заявки:", error);
    return {
      ok: false,
      error:
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Произошла ошибка при создании заявки",
    };
  }
}

/** Client-only submit — для dashboard modal (добавляет заявку в store). */
export async function submitClientCreateRequestForm(
  formData: FormData
): Promise<
  | { ok: true; requestGroup: RequestGroup; toast: { title: string; description: string } }
  | { ok: false; error: string }
> {
  try {
    const response = await api.post("/request-groups", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return {
      ok: true,
      requestGroup: response.data,
      toast: { title: "Успешно", description: "Заявка создана" },
    };
  } catch (error: any) {
    console.error("Ошибка при создании группы заявок:", error);
    return {
      ok: false,
      error:
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Не удалось создать заявку. Повторите попытку.",
    };
  }
}
