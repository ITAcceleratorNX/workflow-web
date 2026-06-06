"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useRequestStore } from "@/stores/useRequestStore";
import { toast } from "@/hooks/use-toast";
import { getTypeLabel } from "@/constants/requests";
import {
  loadCreateRequestPageData,
  submitCreateRequestForm,
  type CreateRequestExecutor,
  type CreateRequestMode,
  type CreateRequestOffice,
} from "@/lib/create-request-flow";

export function useCreateRequestPage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { user, token, isGuest } = useAuthStore();
  const { categories, fetchCategories, updateCategories } = useCategoryStore();
  const addRequests = useRequestStore((s) => s.addRequests);

  const [isOpen, setIsOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [executors, setExecutors] = useState<CreateRequestExecutor[]>([]);
  const [offices, setOffices] = useState<CreateRequestOffice[]>([]);
  const [userCabinetRooms, setUserCabinetRooms] = useState<
    { id: number; name: string; office_id: number }[]
  >([]);
  const [createMode, setCreateMode] = useState<CreateRequestMode>("create");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await loadCreateRequestPageData({
          user,
          isGuest,
          token: token || "",
          fetchCategories,
          updateCategories,
        });
        setOffices(data.offices);
        setExecutors(data.executors);
        setUserCabinetRooms(data.userCabinetRooms);
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные для создания заявки",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, isGuest, token, fetchCategories, updateCategories, router]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    router.back();
  }, [router]);

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      if (!user) {
        setFormErrors("Пользователь не авторизован");
        return;
      }

      setIsSubmitting(true);
      setFormErrors(null);

      const result = await submitCreateRequestForm({
        user,
        formData,
        isGuest,
        createMode,
        addGuestRequest: (group) => addRequests([group]),
      });

      if (result.ok) {
        toast(result.toast);
        handleClose();
      } else {
        setFormErrors(result.error);
      }

      setIsSubmitting(false);
    },
    [user, isGuest, createMode, addRequests, handleClose]
  );

  const translateType = useCallback((type: string) => getTypeLabel(type), []);

  return {
    user,
    isDesktop,
    isLoading,
    isOpen,
    isSubmitting,
    formErrors,
    categories,
    executors,
    offices,
    userCabinetRooms,
    createMode,
    setCreateMode,
    handleSubmit,
    handleClose,
    translateType,
  };
}

export type UseCreateRequestPageResult = ReturnType<typeof useCreateRequestPage>;
