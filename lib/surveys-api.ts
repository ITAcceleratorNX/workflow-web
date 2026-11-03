import { apiTransport } from "@/lib/api-transport";
import { createSurveysApi } from "@/lib/surveys/api";

export const surveysApi = createSurveysApi(apiTransport);
