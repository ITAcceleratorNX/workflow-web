import { apiTransport } from "@/lib/api-transport";
import { createTaskCommentsApi } from "@/lib/task-comments/api";

export const userTaskCommentsApi = createTaskCommentsApi(apiTransport);
