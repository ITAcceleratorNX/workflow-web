"use client";

import { CreateRequestView } from "@/components/create-request/create-request-view";
import { useCreateRequestPage } from "@/hooks/use-create-request-page";

export default function CreateRequestPage() {
  const state = useCreateRequestPage();
  return <CreateRequestView {...state} />;
}
