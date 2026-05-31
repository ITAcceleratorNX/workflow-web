import { useCallback } from 'react';
import { useRequestStore, RequestGroup } from '@/stores/useRequestStore';
import { parseRequestGroupId } from '@/lib/requestNavigation';

/**
 * Поиск заявки в локальном store (для NotificationsSidebar и т.п.).
 * Навигация к заявке — через `getRequestNavigationUrl` / `useRequestSelectionFromUrl`.
 */
export function useRequestFromNotification() {
  const {
    requests,
    incomingRequests,
    myRequests,
    assignedRequests,
    completedRequests,
  } = useRequestStore();

  const findRequestInStore = useCallback((requestId: string): RequestGroup | null => {
    const allRequests = [
      ...requests,
      ...incomingRequests,
      ...myRequests,
      ...assignedRequests,
      ...completedRequests,
    ];

    const parsedId = parseRequestGroupId(requestId);

    return allRequests.find((request) => request.id === parsedId) || null;
  }, [requests, incomingRequests, myRequests, assignedRequests, completedRequests]);

  const getRequestById = useCallback(
    (requestId: string): RequestGroup | null => findRequestInStore(requestId),
    [findRequestInStore]
  );

  return {
    findRequestInStore,
    getRequestById,
  };
}
