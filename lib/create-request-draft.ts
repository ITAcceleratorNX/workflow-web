import { z } from "zod";

const PREFIX = "workflow:create-request-draft:v1:";
const text = z.string();
const date = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date");
const subRequest = z.object({
  title: text,
  description: text,
  category_id: z.number().int().nonnegative(),
  subcategory_id: z.number().int().nonnegative().optional(),
  complexity: z.enum(["simple", "medium", "complex"]).optional(),
  sla: z.string().optional(),
  executors: z.array(z.object({ id: z.number().int(), role: z.enum(["executor", "leader"]) })).optional(),
});

/** Explicit whitelist: never persist files, previews, filenames, credentials or account details. */
const draftSchema = z.object({
  requestType: z.enum(["normal", "urgent", "planned", "recurring"]),
  locationDetails: text,
  plannedDate: z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/),
  subRequests: z.array(subRequest).min(1),
  isRecurringTask: z.boolean(),
  completionComment: text,
  completionDate: date,
  selectedOfficeId: z.number().int().positive().nullable(),
  locationSource: z.enum(["office", "cabinet"]),
  selectedCabinetRoomId: z.number().int().positive().nullable(),
  selectedBlock: text,
  selectedLocation: text,
  selectedRoom: text,
  customLocation: text,
  customRoom: text,
  currentStep: z.number().int().min(1).max(4),
  recurrenceType: z.enum(["daily", "weekly", "monthly", "yearly"]),
  recurrenceInterval: z.number().int().min(1).max(1000),
  recurrenceStartDate: date,
  createMode: z.enum(["create", "createAndComplete"]),
  hadAttachments: z.boolean(),
});

export type CreateRequestDraft = z.infer<typeof draftSchema>;
type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;
type DraftAuth = { token: string | null; user: { id: number } | null; role: string | null; isGuest: boolean };
const memoryDrafts = new Map<string, CreateRequestDraft>();

export function createRequestDraftScope(auth: DraftAuth): string | null {
  if (!auth.token || !auth.user || !auth.role) return null;
  return `${auth.isGuest ? "guest" : "user"}:${auth.user.id}:${auth.role}`;
}

function sessionStorage(): DraftStorage | null {
  try { return typeof window === "undefined" ? null : window.sessionStorage; } catch { return null; }
}

export function readCreateRequestDraft(scope: string | null, storage = sessionStorage()): CreateRequestDraft | null {
  if (!scope) return null;
  const cached = memoryDrafts.get(scope);
  if (cached) return cached;
  try {
    const raw = storage?.getItem(PREFIX + scope);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    if (stored.version !== 1 || stored.scope !== scope) return null;
    const result = draftSchema.safeParse(stored.draft);
    return result.success ? result.data : null;
  } catch { return null; }
}

export function saveCreateRequestDraft(scope: string | null, draft: CreateRequestDraft, storage = sessionStorage()): "session" | "memory" | "unavailable" {
  if (!scope) return "unavailable";
  const result = draftSchema.safeParse(draft);
  if (!result.success) return "unavailable";
  memoryDrafts.set(scope, result.data);
  try {
    if (!storage) return "memory";
    storage.setItem(PREFIX + scope, JSON.stringify({ version: 1, scope, draft: result.data }));
    return "session";
  } catch {
    // An older on-disk draft must not look like the latest version after a reload.
    try { storage?.removeItem(PREFIX + scope); } catch { /* storage is blocked */ }
    return "memory";
  }
}

export function clearCreateRequestDraft(scope: string | null, storage = sessionStorage()) {
  if (!scope) return;
  memoryDrafts.delete(scope);
  try { storage?.removeItem(PREFIX + scope); } catch { /* metadata cache is already cleared */ }
}

/** Called on sign-out/account switch even when the form route has been unmounted. */
export function clearCreateRequestDrafts(storage = sessionStorage()) {
  memoryDrafts.clear();
  try {
    if (!storage) return;
    for (let index = storage.length - 1; index >= 0; index--) {
      const key = storage.key(index);
      if (key?.startsWith(PREFIX)) storage.removeItem(key);
    }
  } catch { /* storage may be unavailable in private/embedded browsers */ }
}

/** Locks synchronously, including the period before React commits disabled button state. */
export function createRequestSubmitGate() {
  let pending = false;
  return {
    isPending: () => pending,
    async run<T>(submit: () => Promise<T>): Promise<T | undefined> {
      if (pending) return undefined;
      pending = true;
      try { return await submit(); } finally { pending = false; }
    },
  };
}
