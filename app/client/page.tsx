"use client"

import React, {useCallback, useEffect, useRef, useState, useMemo} from "react"
import { createPortal } from "react-dom"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Badge} from "@/components/ui/badge"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  MessageCircle,
  Plus,
  Star,
  User,
  XCircle,
  Zap,
  Hourglass,
  ChevronUp,
  ChevronDown,
  Users,
  Calendar as CalendarLucid,
  Building2,
  BarChart3,
  Settings,
  Wrench,
  Bell,
  Ruler,
  Activity,
  Home,
} from "lucide-react"
import api, { getOffices } from "@/lib/api";
import {useRouter, useSearchParams} from "next/navigation";
import {useNotificationStore} from "@/stores/notificationStore";
import { useToast } from "@/hooks/use-toast";
import {useMediaQuery} from "@/hooks/use-media-query";
import {BottomNav} from "@/components/BottomNav";
import Link from "next/link";
import Image from "next/image";

import {useRequestStore} from "@/stores/useRequestStore";
import {RequestGroup, SubRequest} from '@/stores/useRequestStore'
import PullToRefresh from "@/components/pull-to-refresh";
import {useStatsStore} from "@/stores/statsStore";
import {useAuthStore} from "@/stores/useAuthStore";
import {useCategoryStore} from "@/stores/useCategoryStore";
import { RoleBasedActionMenu } from "@/components/action-menu/RoleBasedActionMenu";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import {RatingModal} from "@/components/RatingModal";
import {RequestCard} from "@/components/RequestCard";
import {IconInfoModal} from "@/components/IconInfoModal";
import {getSubRequestDisplayId} from "@/lib/subRequestUtils";
import { createClickableRequestIds } from '@/lib/notificationUtils';
import { RequestNotFoundModal } from '@/components/RequestNotFoundModal';
import { formatNotificationDateTime } from "@/lib/dateTimeUtils";
import { getPreviewUrl } from '@/lib/imageOptimization';
import {MapModal} from "@/components/MapModal";
import {CreateRequestModal} from "@/components/CreateRequestModal";
import {CommentsModal} from "@/components/CommentsModal";
import {useRejectRequestModal} from "@/hooks/use-reject-modal";
import {RejectRequestModal} from "@/components/RejectRequestModal";
import {NotificationsSidebar} from "@/components/notification/NotificationsSidebar";
import {CompletedTaskReport} from "@/components/CompletedTaskReport";
import SubRequestInfo from "@/components/SubRequestInfo";
import Executors from "@/components/Executors";
import { RequestDetails } from "@/components/RequestDetails";
import { AdminManagerRequestsDesktopFrame } from "@/components/layout/AdminManagerRequestsDesktopFrame";
import PhotoModal from "@/components/photo/PhotoModal";
import { MeetingRoomsCatalog } from "@/components/meeting-rooms/MeetingRoomsCatalog";
import { MeetingRoomStatistics } from "@/components/meeting-rooms/MeetingRoomStatistics";
import { DeskHeightCalculator } from "@/components/meeting-rooms/DeskHeightCalculator";
import { ClientSmartHomeControl } from "@/components/yandex-smart-home/ClientSmartHomeControl";

interface Rating {
  id: number;
  rating: number;
  request_id: number;
  created_at: string;
}



interface Stats {
  totalRequests: number,
  activeRequests: number,
  doneRequests: number,
  averageRating: string,
  totalRatings: number
}

export default function ClientDashboard() {
  // Optimized Zustand selectors to prevent unnecessary re-renders
  const role = useAuthStore(state => state.role)
  const token = useAuthStore(state => state.token)
  const user = useAuthStore(state => state.user)
  const clearAuth = useAuthStore(state => state.clearAuth)
  const categories = useCategoryStore(state => state.categories)
  const fetchCategories = useCategoryStore(state => state.fetchCategories)
  const clearCategories = useCategoryStore(state => state.clearCategories)
  const requests = useRequestStore(state => state.requests)
  const addRequests = useRequestStore(state => state.addRequests)
  const clearRequests = useRequestStore(state => state.clearRequests)
  const removeRequest = useRequestStore(state => state.removeRequest)
  
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const rejectModal = useRejectRequestModal()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("cabinet")
  const [showCreateRequest, setShowCreateRequest] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<RequestGroup | null>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [showNotFoundModal, setShowNotFoundModal] = useState(false)
  const [notFoundRequestId, setNotFoundRequestId] = useState<string>('')
  const [ratingValue, setRatingValue] = useState(0)
  const [requestToRate, setRequestToRate] = useState<SubRequest | null>(null)
  const [ratingComment, setRatingComment] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [isLoggedIn, setIsLoggedIn] = useState(true)
  const [requestLocation, setRequestLocation] = useState("")
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapLocation, setMapLocation] = useState({ lat: 0, lon: 0, accuracy: 0 });
  const [userRatings, setUserRatings] = useState<Record<number, Rating>>({});
  const [clientRatings, setClientRatings] = useState<Record<number, any>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{url: string, created_at?: string} | null>(null);
  const notifications = useNotificationStore(state => state.notifications)
  const setNotifications = useNotificationStore(state => state.setNotifications)
  const setNotificationLoading = useNotificationStore(state => state.setNotificationLoading)
  const clearNotifications = useNotificationStore(state => state.clearNotifications)
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [requestToDelete, setRequestToDelete] = useState<RequestGroup | null>(null)
  const [showDeleteRequestModal, setShowDeleteRequestModal] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null);
  const [expandedSubRequests, setExpandedSubRequests] = useState<Set<number>>(new Set());
  const [showComments, setShowComments] = useState<number | null>(null);
  const [showIconInfo, setShowIconInfo] = useState<{type: 'status' | 'longTerm', value: string} | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);
  const [pageSize] = useState(10);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  // Обработка query параметра tab и requestId из ссылки (шаринг заявки)
  useEffect(() => {
    const tab = searchParams.get("tab")
    const requestId = searchParams.get("requestId")
    if (isDesktop && tab === "requests") {
      router.replace("/client/requests" + (requestId ? `?requestId=${requestId}` : ""))
      return
    }
    if (tab === "requests" || tab === "statistics" || tab === "meeting-rooms") {
      setActiveTab(tab)
    } else if (requestId) {
      setActiveTab("requests")
    } else if (!tab || tab === "cabinet") {
      setActiveTab("cabinet")
    }
  }, [searchParams, isDesktop, router])
  
  const [modalStack, setModalStack] = useState<string[]>([]);
  const [isClosingProgrammatically, setIsClosingProgrammatically] = useState(false);
  const [offices, setOffices] = useState<any[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<any | null>(null);
  const [meetingRoomsTab, setMeetingRoomsTab] = useState<"book" | "my-bookings">("book");
  const [showDeskCalculator, setShowDeskCalculator] = useState(false);

  const lastRequestRef = useCallback((node: HTMLDivElement | null) => {
    lastElementRef.current = node;
  }, []);

  const filteredRequests = useMemo(() => requests
      .filter((request) => {
        const statusMatch = filterStatus === "all" || 
          (filterStatus === "long_term" ? request.requests.some(req => req.is_long_term) : request.status === filterStatus)
        const requestType = request.request_type
        const typeMatch = filterType === "all" || requestType === filterType
        return statusMatch && typeMatch
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_date).getTime();
        const dateB = new Date(b.created_date).getTime();
        // если дата невалидная, ставим приоритет 0
        const safeDateA = isNaN(dateA) ? 0 : dateA;
        const safeDateB = isNaN(dateB) ? 0 : dateB;
        return safeDateB - safeDateA;
      }), [requests, filterStatus, filterType]);

  useEffect(() => {
    if (loading) return;

    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        fetchRequests(page + 1);
      }
    });

    if (lastElementRef.current) {
      observer.current.observe(lastElementRef.current);
    }
  }, [loading, hasMore, page]);

// При заходе на страницу сбросим пагинацию
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchRequests(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModal = useCallback((name: string) => {
    setModalStack(prev => [...prev, name]);
    window.history.pushState({ modal: name }, '', window.location.pathname);
  }, []);

  const closeModalWithHistory = useCallback(() => {
    setIsClosingProgrammatically(true);
    setModalStack(prev => {
      const newStack = prev.slice(0, -1);
      // Откатываем историю браузера назад
      window.history.back();
      return newStack;
    });
  }, []);


  // Функция для закрытия модалки без использования window.history.back()
  // Используется при закрытии через X кнопку, чтобы не выходить из сайта
  const closeModal = useCallback(() => {
    setIsClosingProgrammatically(true);
    setModalStack(prev => {
      if (prev.length === 0) return prev;
      
      const lastModal = prev[prev.length - 1];
      const newStack = prev.slice(0, -1);
      
      // Закрываем соответствующее модальное окно
      switch (lastModal) {
        case 'createRequest':
          setShowCreateRequest(false);
          break;
        case 'requestDetails':
          setSelectedRequest(null);
          break;
        case 'ratingModal':
          setShowRatingModal(false);
          setRatingValue(0);
          setRequestToRate(null);
          setRatingComment("");
          break;
        case 'mapModal':
          setShowMapModal(false);
          break;
        case 'photoPreview':
          setSelectedPhoto(null);
          break;
        case 'notification':
          setIsModalOpen(false);
          setSelectedNotification(null);
          break;
        case 'deleteRequest':
          setShowDeleteRequestModal(false);
          setRequestToDelete(null);
          break;
        default:
          break;
      }
      
      // Обновляем историю асинхронно, чтобы не вызывать обновление Router во время рендеринга
      setTimeout(() => {
        if (newStack.length > 0) {
          window.history.replaceState({ modal: newStack[newStack.length - 1] }, '', window.location.pathname);
        } else {
          window.history.replaceState({ modal: null }, '', window.location.pathname);
        }
        setIsClosingProgrammatically(false);
      }, 0);
      
      return newStack;
    });
  }, []);


  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true); // сработает только на клиенте
  }, []);

  useEffect(() => {
    if (!hydrated) return; // ждём восстановления данных

    if (!user || user.role !== "client") {
      Promise.all([
        clearNotifications,
        clearAuth,
        useStatsStore.getState().resetStats,
        clearRequests,
        clearCategories,
      ])
      router.push("/login");
    } else {
      // пользователь валидный
      setIsLoggedIn(true);
      setCurrentUserId(user.id);
    }
  }, [hydrated, user, router]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // Если закрытие происходит программно, сбрасываем флаг и не обрабатываем событие
      if (isClosingProgrammatically) {
        setIsClosingProgrammatically(false);
        return;
      }

      if (modalStack.length > 0) {
        e.preventDefault();
        const lastModal = modalStack[modalStack.length - 1];

        switch (lastModal) {
          case 'createRequest':
            setShowCreateRequest(false);
            break;
          case 'requestDetails':
            setSelectedRequest(null);
            break;
          case 'ratingModal':
            setShowRatingModal(false);
            setRatingValue(0);
            setRequestToRate(null);
            setRatingComment("");
            break;
          case 'mapModal':
            setShowMapModal(false);
            break;
          case 'photoPreview':
            setSelectedPhoto(null);
            break;
          case 'notification':
            setIsModalOpen(false);
            setSelectedNotification(null);
            break;
          case 'deleteRequest':
            setShowDeleteRequestModal(false);
            setRequestToDelete(null);
            break;
          default:
            break;
        }

        // Просто обновляем стек модальных окон без вызова closeModalWithHistory
        setModalStack(prev => prev.slice(0, -1));
      }
    };

    window.addEventListener('popstate', handlePopState);

    if (!window.history.state?.modal) {
      window.history.replaceState({ modal: null }, '', window.location.pathname);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [modalStack, isClosingProgrammatically]);
  const closeAllModalsExcept = (modalName: string) => {
    if (modalName !== 'createRequest') {
      setShowCreateRequest(false);
    }
    if (modalName !== 'requestDetails') {
      setSelectedRequest(null);
    }
    if (modalName !== 'ratingModal') {
      setShowRatingModal(false);
      setRatingValue(0);
      setRequestToRate(null);
      setRatingComment("");
    }
    if (modalName !== 'mapModal') {
      setShowMapModal(false);
    }
    if (modalName !== 'photoPreview') {
      setSelectedPhoto(null);
    }
    if (modalName !== 'notification') {
      setIsModalOpen(false);
    }


    setModalStack([modalName]);
    // Используем pushState вместо replaceState для правильной работы истории
    window.history.pushState({ modal: modalName }, '', window.location.pathname);
  };

  useEffect(() => {
    if (notifications.length > 0) {
      setNotificationLoading(false)
    }
    fetchOffices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      setNotificationLoading(true)
      fetchNotifications()
    }
  }, [isLoggedIn])

  const fetchStats = async () => {
    try {
      const res = await api.get("/analytics/stats/client");
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (!stats) {
      fetchStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const create = searchParams.get("createRequest")

    if (create === "true") {
      // Всегда добавляем createRequest в стек и историю
      setModalStack(['createRequest']);
      window.history.pushState({ modal: 'createRequest' }, '', window.location.pathname);
      setShowCreateRequest(true);
    }
    if(create === "false") {
      setShowCreateRequest(false)
      // Просто обновляем стек модальных окон
      setModalStack(prev => prev.filter(modal => modal !== 'createRequest'));
    }
  }, [searchParams])

  // Сохраняем requestId в state при первой загрузке
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [pendingSubRequestId, setPendingSubRequestId] = useState<string | null>(null);

  // Обработка query параметров для открытия заявки
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const requestIdFromUrl = urlParams.get("requestId");
    const subRequestIdFromUrl = urlParams.get("subRequestId");
    
    const requestId = requestIdFromUrl || searchParams.get("requestId");
    const subRequestId = subRequestIdFromUrl || searchParams.get("subRequestId");

    // Сохраняем requestId в state, если он есть и еще не сохранен
    if (requestId && !pendingRequestId) {
      setPendingRequestId(requestId);
      if (subRequestId) {
        setPendingSubRequestId(subRequestId);
      }
    }

    // Ждем, пока заявки загрузятся
    if (loading) {
      return;
    }

    // Проверяем, что заявки загружены
    if (requests.length === 0) {
      return;
    }

    const idToUse = pendingRequestId || requestId;
    const subIdToUse = pendingSubRequestId || subRequestId;

    if (idToUse && !selectedRequest) {
      // Ищем заявку по ID
      const foundRequest = requests.find(r => r.id === parseInt(idToUse));
      
      if (foundRequest) {
        setPendingRequestId(null);
        setPendingSubRequestId(null);
        window.history.replaceState({}, '', window.location.pathname);
        // На мобильном открываем отдельную страницу заявки (как у других ролей)
        if (!isDesktop) {
          router.push(`/client/requests/${foundRequest.id}`);
          return;
        }
        // Десктоп: открываем модал
        if (subIdToUse) {
          const subRequest = foundRequest.requests.find((req: SubRequest) => req.id === parseInt(subIdToUse));
          if (subRequest) {
            setSelectedRequest(foundRequest);
            setExpandedSubRequests(new Set([subRequest.id]));
            openModal('requestDetails');
          } else {
            setNotFoundRequestId(`${idToUse}/${subIdToUse}`);
            setShowNotFoundModal(true);
          }
        } else {
          setSelectedRequest(foundRequest);
          openModal('requestDetails');
        }
      } else if (idToUse) {
        // Заявка не найдена
        setNotFoundRequestId(idToUse);
        setShowNotFoundModal(true);
        setPendingRequestId(null);
        setPendingSubRequestId(null);
        // Очищаем query параметры из URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, requests, selectedRequest, loading, pendingRequestId, pendingSubRequestId, openModal, isDesktop, router]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/me?page=1&pageSize=5')
      setNotifications(res.data.notifications)
    } catch (error) {
      console.error('Ошибка при загрузке уведомлений:', error)
    } finally {
      setNotificationLoading(false)
    }
  }

  const fetchOffices = async () => {
    try {
      const res = await getOffices();
      setOffices(res.data);
    } catch (error) {
      console.error('Ошибка при загрузке офисов:', error);
    }
  }

  const handleNotificationClick = async (notification: any) => {
    setSelectedNotification(notification)
    setIsModalOpen(true);
    openModal('notification');
    if (!notification.is_read) {
      try {
        const updatedNotifications = notifications.map((n:any) =>
            n.id === notification.id ? { ...n, is_read: true } : n
        )
        setNotifications(updatedNotifications)
        await api.patch(`/notifications/${notification.id}/read`)
      } catch (error) {
        const updatedNotifications = notifications.map((n:any) =>
            n.id === notification.id ? { ...n, is_read: false } : n
        )
        setNotifications(updatedNotifications)
        console.error("Ошибка при пометке уведомления как прочитано", error)
      }
    }
  }

  const handleDeleteRequest = (request: RequestGroup) => {
    setRequestToDelete(request)
    setShowDeleteRequestModal(true);
    openModal('deleteRequest');
  }

  const handleDeleteSubRequest = async (subRequest: SubRequest) => {
    try {
      await api.delete(`/requests/${subRequest.id}`)

      // Обновляем состояние - удаляем под заявку из группы
      if (selectedRequest) {
        const updatedRequests = selectedRequest.requests.filter(req => req.id !== subRequest.id)
        const updatedRequestGroup = {
          ...selectedRequest,
          requests: updatedRequests
        }
        setSelectedRequest(updatedRequestGroup)

        // Обновляем в store
        const currentRequests = useRequestStore.getState().requests
        const updatedStoreRequests = currentRequests.map(req =>
          req.id === selectedRequest.id ? updatedRequestGroup : req
        ).filter(req => req.requests.length > 0)
        useRequestStore.getState().setRequests(updatedStoreRequests)

        // Если это была последняя под заявка в группе, закрываем модальное окно
        if (updatedRequests.length === 0) {
          setSelectedRequest(null);
          closeModalWithHistory();
        }
      }

      toast({
        title: "Под заявка удалена",
        description: "Под заявка была успешно удалена."
      })
    } catch (error) {
      console.error("Error deleting sub-request:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить под заявку.",
        variant: "destructive"
      })
    }
  }

  const confirmDeleteRequest = async () => {
    if (requestToDelete) {
      setDeleteLoading(true)
      try {
        await api.delete(`/request-groups/${requestToDelete.id}`)
        
        // Удаляем заявку из локального состояния сразу
        removeRequest(requestToDelete.id);
        
        // Закрываем все модальные окна
        setSelectedRequest(null);
        setRequestToDelete(null);
        setShowDeleteRequestModal(false);
        toast({
          title: "Заявка удалена",
          description: "Заявка была успешно удалена."
        })
      } catch (error) {
        console.error("Failed to delete request group:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось удалить заявку.",
          variant: "destructive"
        })
      } finally {
        setDeleteLoading(false)
      }
    }
  }

  const checkUserRating = useCallback(async (requestId: number) => {
    try {
      const response = await api.get(`/ratings/user/${requestId}`);
      if (response.data && response.data.length > 0) {
        const ratingData = response.data[0];
        setUserRatings(prev => ({
          ...prev,
          [requestId]: {
            ...ratingData,
            comments: ratingData.comment ? [ratingData.comment] : [] // Преобразуем в массив для совместимости
          }
        }));
      }
    } catch (error) {
      console.error("Failed to check user rating:", error);
    }
  }, []);

  // Функция для обработки рейтингов клиентов из ответа API
  const processClientRatings = useCallback((requestGroups: any[]) => {
    setClientRatings(prev => {
      const newRatingsData = { ...prev };
      requestGroups.forEach((requestGroup: any) => {
        if (requestGroup.clientRatings && requestGroup.clientRatings.length > 0) {
          // Сохраняем все рейтинги как массив
          newRatingsData[requestGroup.id] = requestGroup.clientRatings.map((rating: any) => ({
            id: rating.id,
            rating: rating.rating,
            comment: rating.comment,
            request_group_id: requestGroup.id,
            created_at: rating.created_at,
            ratedByUser: rating.ratedByUser
          }));
        }
      });
      return newRatingsData;
    });
  }, []);

  const fetchRequests = useCallback(async (pageToFetch = page) => {
    try {
      setLoading(true);
      const response = await api.get(`/request-groups?page=${pageToFetch}&pageSize=${pageSize}`);

      const newRequestGroups = response.data.requests ?? [];

      addRequests(newRequestGroups);

      // Обрабатываем рейтинги клиентов из ответа API
      processClientRatings(newRequestGroups);

      if (newRequestGroups.length < pageSize) {
        setHasMore(false);
      }

      setPage(pageToFetch);

      // Проверка оценки для каждой под заявки
      newRequestGroups.forEach((requestGroup: RequestGroup) => {
        requestGroup.requests.forEach((subRequest: SubRequest) => {
          if (subRequest.status === "completed") {
            checkUserRating(subRequest.id);
          }
        });
      });

    } catch (error) {
      console.error("Failed to fetch request groups:", error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, addRequests, checkUserRating, processClientRatings]);

  useEffect(() => {
    if (requests.length === 0) {
      fetchRequests(1)
    }
  }, [])

  const getTypeColor = (type: string) => {
    switch (type) {
      case "urgent":
      case "Экстренная":
        return "bg-gradient-to-r from-[#B8400E] to-[#B8400E]/80"
      case "normal":
      case "regular":
      case "Обычная":
        return "bg-[#114A65]"
      case "planned":
      case "Плановая":
        return "bg-gradient-to-r from-[#114A65] to-[#114A65]/80"
      default:
        return "bg-[#C4C4CE]"
    }
  }
  const translateStatus = (status: string) => {
    switch (status) {
      case "draft": return "Черновик";
      case "in_progress": return "В обработке у Администратора";
      case "execution": return "Исполнение";
      case "completed": return "Завершено";
      case "rejected": return "Отклонено";
      case "awaiting_assignment": return "Ожидает назначения Исполнителя";
      case "awaiting_sla": return "Ожидание времени выполнения";
      case "assigned": return "назначенный";
      default: return status;
    }
  };

  const translateComplexity = (complexity: string) => {
    switch (complexity) {
      case "complex": return "комплексный";
      case "simple": return "простой";
      case "medium": return "средний";
      default: return complexity;
    }
  };

  const translateType = (type: string) => {
    switch (type) {
      case "urgent": return "Экстренная";
      case "normal": return "Обычная";
      case "planned": return "Плановая";
      default: return type;
    }
  };

  const handleOpenCreateRequest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            setRequestLocation(`Широта: ${latitude.toFixed(5)}, Долгота: ${longitude.toFixed(5)} (±${Math.round(accuracy)} м)`);
          },
          (error: GeolocationPositionError) => {
            console.error("Ошибка геолокации:", {
              code: error.code,
              message: error.message
            });

            switch (error.code) {
              case error.PERMISSION_DENIED:
                setRequestLocation("Доступ к геолокации запрещён");
                break;
              case error.POSITION_UNAVAILABLE:
                setRequestLocation("Информация о местоположении недоступна");
                break;
              case error.TIMEOUT:
                setRequestLocation("Превышено время ожидания определения местоположения");
                break;
              default:
                setRequestLocation("Не удалось определить местоположение");
            }
          }
          ,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
      );
    } else {
      setRequestLocation("Ваш браузер не поддерживает геолокации");
    }

    setShowCreateRequest(true);
    openModal('createRequest');
  };
  const getRatingLabel = (doneRequests: number): string => {
    if (doneRequests >= 20) return "Platinum"
    if (doneRequests >= 10) return "Gold"
    if (doneRequests >= 5) return "Silver"
    return "Bronze"
  }

  const handleCreateRequest = async (formData: FormData) => {
    setIsSubmitting(true);
    setFormErrors(null);

    try {
      const response = await api.post('/request-groups', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newRequestGroup = response.data;

      // Обновляем состояние
      addRequests([newRequestGroup]);
      toast({
        title: "Успешно",
        description: "Заявка создана"
      });

      // Сброс формы
      resetForm();
    } catch (error: any) {
      console.error("Ошибка при создании группы заявок:", error);
      setFormErrors(
          error.response?.data?.error || error.response?.data?.message || "Не удалось создать заявку. Повторите попытку."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowCreateRequest(false);
    closeModalWithHistory()
    setRequestLocation("");
    setFormErrors(null);
  };

  const handleRateExecutor = async () => {
    if (requestToRate && ratingValue > 0) {
      try {
        // Оптимистичное обновление - сразу обновляем UI
        const { updateSubRequestRating } = useRequestStore.getState();
        
        // Находим группу заявок, к которой принадлежит подзаявка
        const allRequests = [
          ...useRequestStore.getState().requests,
          ...useRequestStore.getState().myRequests,
          ...useRequestStore.getState().incomingRequests,
          ...useRequestStore.getState().assignedRequests,
          ...useRequestStore.getState().completedRequests
        ];
        
        const requestGroup = allRequests.find(group => 
          group.requests.some(subReq => subReq.id === requestToRate.id)
        );
        
        if (requestGroup) {
          updateSubRequestRating(requestGroup.id, requestToRate.id, ratingValue);
        }
        
        // Обновляем локальное состояние рейтингов (для совместимости с существующим кодом)
        setUserRatings(prev => ({
          ...prev,
          [requestToRate.id]: { 
            id: 0, // временный ID
            rating: ratingValue,
            comment: ratingComment,
            comments: ratingComment ? [ratingComment] : [], // Преобразуем в массив для совместимости
            request_id: requestToRate.id,
            created_at: new Date().toISOString()
          }
        }));
        
        // Проверяем, существует ли уже рейтинг для этой заявки
        const existingRating = userRatings[requestToRate.id];
        const isUpdate = !!existingRating;
        
        // Отправляем запрос на сервер (POST для создания, PUT для обновления)
        const response = await api[isUpdate ? 'put' : 'post'](`/ratings`, {
          rating: ratingValue,
          request_id: requestToRate.id,
          comment: ratingComment
        })
        
        setShowRatingModal(false)
        setRatingValue(0)
        setRequestToRate(null)
        closeModalWithHistory()
      } catch (error) {
        // В случае ошибки откатываем изменения
        const { updateSubRequestRating } = useRequestStore.getState();
        
        const allRequests = [
          ...useRequestStore.getState().requests,
          ...useRequestStore.getState().myRequests,
          ...useRequestStore.getState().incomingRequests,
          ...useRequestStore.getState().assignedRequests,
          ...useRequestStore.getState().completedRequests
        ];
        
        const requestGroup = allRequests.find(group => 
          group.requests.some(subReq => subReq.id === requestToRate.id)
        );
        
        if (requestGroup) {
          updateSubRequestRating(requestGroup.id, requestToRate.id, 0);
        }
        
        // Откатываем изменения в userRatings при ошибке
        setUserRatings(prev => {
          const newRatings = { ...prev };
          delete newRatings[requestToRate.id];
          return newRatings;
        });
        
        rejectModal.showReject({
          title: "Ошибка",
          message: "Недоступно для оценки"
        })
        console.error("Failed to rate executor:", error);
        setShowRatingModal(false);
        closeModalWithHistory();
        setRatingValue(0)
        setRequestToRate(null)
      }
    }
  }

  const handleLogout = async () => {
    try {
      clearNotifications()
      clearAuth()
      useStatsStore.getState().resetStats
      clearRequests()
      clearCategories()

      setIsLoggedIn(false)
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-emerald-500 text-white border-emerald-500"
      case "in_progress":
      case "execution":
        return "bg-[#114A65] text-white border-[#114A65]"
      case "awaiting_assignment":
      case "awaiting_sla":
        return "bg-[#B8400E] text-white border-[#B8400E]"
      case "assigned":
        return "bg-[#114A65] text-white border-[#114A65]"
      case "rejected":
        return "bg-gradient-to-r from-[#B8400E] to-[#B8400E]/80 text-white border-[#B8400E] backdrop-blur-sm"
      default:
        return "bg-[#C4C4CE] text-white border-[#C4C4CE]"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-3 h-3" />
      case "in_progress":
      case "execution":
        return <Zap className="w-3 h-3" />
      case "awaiting_assignment":
      case "awaiting_sla":
        return <Clock className="w-3 h-3" />
      case "assigned":
        return <User className="w-3 h-3" />
      case "rejected":
        return <XCircle className="w-3 h-3" />
      default:
        return null
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity?.toLowerCase()) {
      case "complex":
        return "bg-[#B8400E] text-white border-[#B8400E]"
      case "medium":
        return "bg-[#B8400E]/80 text-white border-[#B8400E]"
      case "simple":
        return "bg-gradient-to-r from-[#B8400E] to-[#114A65] text-white border-[#B8400E]"
      default:
        return "bg-[#C4C4CE] text-white border-[#C4C4CE]"
    }
  }

  const renderStatusWithTooltip = (status: string) => {
    const icon = getStatusIcon(status);
    const text = translateStatus(status);

    if (isDesktop) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-help">
                {icon}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{text}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else {
      return (
        <div
          className="flex items-center gap-1 cursor-pointer p-1 rounded"
          onClick={() => setShowIconInfo({type: 'status', value: text})}
        >
          {icon}
        </div>
      );
    }
  };

  const renderLongTermWithTooltip = (isLongTerm: boolean) => {
    if (!isLongTerm) return null;

    if (isDesktop) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-help">
                <Hourglass className="w-3 h-3 text-[#114A65]" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Долгосрочная задача</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else {
    return (
      <div
          className="flex items-center gap-1 cursor-pointer p-1 rounded"
          onClick={() => setShowIconInfo({type: 'longTerm', value: 'Долгосрочная задача'})}
        >
                <Hourglass className="w-3 h-3 text-[#114A65]" />
      </div>
    );
    }
  };

  const handleRefresh = async () => {
    try {
      setPage(1);
      setHasMore(true);
      setFilterStatus("all");
      setFilterType("all");

      clearRequests();
      clearNotifications()
      setStats(null);
      setUserRatings({});
      setOffices([]);

      // 4. Параллельная загрузка всех данных
      await Promise.all([
        fetchRequests(1),
        fetchStats(),
        fetchCategories(token!),
        fetchNotifications(),
          fetchOffices(),
      ]);

    } catch (error) {
      console.error("Ошибка при обновлении:", error);
    }
  };

  const renderCardHeader = useCallback((requestGroup: RequestGroup) => {
    const isLongTerm = requestGroup.requests.some(req => req.is_long_term);
    // Убрали счетчик подзаявок - теперь показываем только один заявка

    return (
        <CardHeader className={`pb-3 px-5 pt-5`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
<h3 className="font-bold text-base leading-tight line-clamp-2 text-card-foreground">
                Заявка #{requestGroup.id}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  isLongTerm 
                    ? 'text-[#114A65] bg-[#114A65]/20' 
                    : requestGroup.request_type === 'urgent'
                      ? 'text-white bg-gradient-to-r from-[#B8400E] to-[#B8400E]/80'
                      : requestGroup.request_type === 'planned'
                        ? 'text-white bg-gradient-to-r from-[#114A65] to-[#114A65]/80'
                        : 'text-white bg-[#114A65]'
                }`}>
                {requestGroup.request_type === 'urgent' ? 'Экстренная' : requestGroup.request_type === 'planned' ? 'Плановая' : 'Обычная'}
              </span>
              </div>
            </div>
            <div className="flex gap-1 items-center">
              {renderStatusWithTooltip(requestGroup.status)}
              {isLongTerm && renderLongTermWithTooltip(true)}
              <RoleBasedActionMenu
                  request={requestGroup}
                  isDesktop={isDesktop}
                  userRole="client"
                  isSubRequest={false}
                  onViewDetails={(request) => {
                    setSelectedRequest(request);
                    openModal('requestDetails');
                  }}
                  onRateRequest={(subReq) => {
                    setRequestToRate(subReq)
                    // Устанавливаем текущий рейтинг как начальное значение, если он существует
                    const currentRating = userRatings[subReq.id]?.rating || 0;
                    setRatingValue(currentRating);
                    setRatingComment(""); // Сбрасываем комментарий
                    setShowRatingModal(true)
                    openModal('ratingModal')
                  }}
                  onDelete={handleDeleteRequest}
              />
            </div>
          </div>
        </CardHeader>
    );
  }, [isDesktop, userRatings, openModal]);
  
  const handleCardClick = useCallback((request: RequestGroup) => {
    if (!isDesktop) {
      router.push(`/client/requests/${request.id}`);
      return;
    }
    setSelectedRequest(request);
    // На десктопе в разделе «Заявки» детали показываются в правой панели (как у админа), модалку не открываем
    if (activeTab !== "requests") openModal("requestDetails");
  }, [openModal, isDesktop, router, activeTab]);

  return (
      <>
      <PullToRefresh onRefresh={handleRefresh}>
      <div 
        className={`min-h-screen pb-safe ${isDesktop ? "bg-[#1A1A1A]" : activeTab === "requests" || activeTab === "cabinet" ? "bg-[#1C1C1E]" : "bg-[#F3F3F3]"}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className={`w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-8 ${isDesktop ? "client-desktop-content" : ""}`}>
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Десктоп: главный экран — Умный дом + Activity трекер; Бронь — только офисы */}
            {isDesktop && activeTab === "cabinet" && (
              <div className="max-w-4xl mx-auto py-8 client-desktop-dark space-y-8">
                <ClientSmartHomeControl />
              </div>
            )}
            {isDesktop && activeTab === "meeting-rooms" && (
                  <div className="mb-6 space-y-4 client-desktop-dark">
                    {/* Две кнопки: Бронировать | Мои бронирования */}
                    <div className="flex gap-4">
                      <Button
                        onClick={() => setMeetingRoomsTab("book")}
                        className={`flex-1 h-12 rounded-lg font-medium transition-all duration-300 ${
                          meetingRoomsTab === "book"
                            ? "bg-[#E85D2B] hover:bg-[#D94F15] text-white"
                            : "bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white border border-[#212121]"
                        }`}
                      >
                        Бронировать
                      </Button>
                      <Button
                        onClick={() => setMeetingRoomsTab("my-bookings")}
                        className={`flex-1 h-12 rounded-lg font-medium transition-all duration-300 ${
                          meetingRoomsTab === "my-bookings"
                            ? "bg-[#E85D2B] hover:bg-[#D94F15] text-white"
                            : "bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white border border-[#212121]"
                        }`}
                      >
                        Мои бронирования
                      </Button>
                    </div>

                    {/* Кнопка калькулятора - только для вкладки book; выбор офиса на десктопе внутри каталога (офисы слева, комнаты справа) */}
                    {meetingRoomsTab === "book" && (
                      <>
                        <Button
                          onClick={() => setShowDeskCalculator(!showDeskCalculator)}
                          variant="outline"
                          className="w-full h-12 bg-[#2C2C2E] border-[#212121] hover:bg-[#3A3A3C] text-white rounded-lg flex items-center justify-center gap-2"
                        >
                          <Ruler className="h-5 w-5" />
                          <span className="font-medium">Калькулятор высоты стола</span>
                        </Button>
                        <DeskHeightCalculator
                          isOpen={showDeskCalculator}
                          onToggle={() => setShowDeskCalculator(!showDeskCalculator)}
                        />
                      </>
                    )}
                  </div>
            )}

            {/* Главная секция для мобильных: Мой кабинет (умный дом + трекер), Бронь, Заявки */}
            {!isDesktop && activeTab !== "requests" && (
              <div className="mb-6 space-y-5">
                <div className="grid grid-cols-3 gap-2">
                  <Card
                    onClick={() => { router.replace("/client"); setActiveTab("cabinet"); }}
                    className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-0 shadow-xl bg-[#1C1C1E] border border-[#E85D2B]/30 group"
                  >
                    <CardContent className="p-3 relative z-10 flex flex-col items-center justify-center h-24">
                      <Home className="h-8 w-8 text-[#E85D2B] mb-1" />
                      <span className="text-[10px] font-bold text-white leading-tight text-center">Мой кабинет</span>
                    </CardContent>
                  </Card>
                  <Card
                    onClick={() => { setActiveTab("meeting-rooms"); setMeetingRoomsTab("book"); }}
                    className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-0 shadow-xl bg-gradient-to-br from-[#114A65] via-[#0d3a4f] to-[#B8400E] group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                    <CardContent className="p-3 relative z-10 flex flex-col items-center justify-center h-24">
                      <Building2 className="h-8 w-8 text-white drop-shadow-lg mb-1" />
                      <span className="text-[10px] font-bold text-white leading-tight">Бронь</span>
                    </CardContent>
                  </Card>
                  <Card
                    onClick={() => setActiveTab("requests")}
                    className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-2 border-gray-200 shadow-lg bg-gradient-to-br from-white to-gray-50 group hover:border-[#114A65]/30"
                  >
                    <CardContent className="p-3 relative z-10 flex flex-col items-center justify-center h-24">
                      <Wrench className="h-8 w-8 text-[#114A65] mb-1" />
                      <span className="text-[10px] font-bold text-gray-900 leading-tight">Заявки</span>
                    </CardContent>
                  </Card>
                </div>

                {/* Две кнопки переключения - только для Бронь (meeting-rooms) */}
                {activeTab === "meeting-rooms" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => {
                        setMeetingRoomsTab("book");
                      }}
                      className={`h-12 text-xs px-2 rounded-xl font-semibold transition-all duration-300 shadow-md ${
                        meetingRoomsTab === "book"
                          ? "bg-gradient-to-r from-[#114A65] to-[#B8400E] hover:from-[#0d3a4f] hover:to-[#A3390D] text-white shadow-lg scale-105"
                          : "bg-white border-2 border-gray-200 hover:border-[#114A65]/30 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Бронировать
                    </Button>
                    <Button
                      onClick={() => setMeetingRoomsTab("my-bookings")}
                      className={`h-12 text-xs px-2 rounded-xl font-semibold transition-all duration-300 shadow-md ${
                        meetingRoomsTab === "my-bookings"
                          ? "bg-gradient-to-r from-[#114A65] to-[#B8400E] hover:from-[#0d3a4f] hover:to-[#A3390D] text-white shadow-lg scale-105"
                          : "bg-white border-2 border-gray-200 hover:border-[#114A65]/30 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Мои бронирования
                    </Button>
                  </div>
                )}

                {/* Кнопка калькулятора и выбор офиса - показываются только для meeting-rooms и вкладки book */}
                {activeTab === "meeting-rooms" && meetingRoomsTab === "book" && (
                  <>
                    {/* Кнопка калькулятора */}
                    <Card
                      onClick={() => {
                        setShowDeskCalculator(!showDeskCalculator);
                      }}
                      className="cursor-pointer transition-all duration-300 hover:shadow-lg active:scale-[0.98] border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 hover:border-[#114A65]/40"
                    >
                      <CardContent className="p-4 flex items-center justify-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-[#114A65]/10 to-[#B8400E]/10 rounded-lg">
                          <Ruler className="h-6 w-6 text-[#114A65]" />
                        </div>
                        <span className="font-semibold text-gray-900">Калькулятор высоты стола</span>
                      </CardContent>
                    </Card>

                    {/* Калькулятор высоты стола */}
                    <DeskHeightCalculator
                      isOpen={showDeskCalculator}
                      onToggle={() => setShowDeskCalculator(!showDeskCalculator)}
                    />

                    {/* Секция выбора офиса */}
                    <div className="space-y-4">
                      <div className="bg-[#2C2C2E] rounded-xl p-4 border border-[#3A3A3C]">
                        <h2 className="text-xl font-bold text-white mb-1">Выбрать офис</h2>
                        <p className="text-sm text-[#8E8E93]">Выберите офис для бронирования переговорной комнаты</p>
                      </div>
                      <div className="overflow-x-auto -mx-2 px-2">
                        <div className="flex gap-4 pb-3" style={{ scrollbarWidth: 'thin' }}>
                          {offices.map((office: any) => (
                            <Card
                              key={office.id}
                              className="min-w-[300px] cursor-pointer transition-all duration-300 hover:shadow-xl active:scale-[0.97] flex-shrink-0 border-2 border-[#3A3A3C] hover:border-[#E85D2B]/50 overflow-hidden group bg-[#2C2C2E]"
                              onClick={() => {
                                setSelectedOffice(office);
                                setActiveTab("meeting-rooms");
                              }}
                            >
                              <CardContent className="p-0">
                                <div className="relative aspect-[4/3] bg-[#1C1C1E] overflow-hidden">
                                  {office.photo ? (
                                    <>
                                      <Image
                                        src={office.photo}
                                        alt={office.name}
                                        fill
                                        sizes="300px"
                                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </>
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#1C1C1E]">
                                      <Building2 className="w-20 h-20 text-[#E85D2B] opacity-50" />
                                    </div>
                                  )}
                                  <div className="absolute top-3 right-3">
                                    <div className="bg-[#E85D2B] rounded-full px-3 py-1 shadow-md">
                                      <span className="text-xs font-semibold text-white">Выбрать</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-5 bg-[#2C2C2E] border-t border-[#3A3A3C]">
                                  <h3 className="font-bold text-lg text-white mb-1 group-hover:text-[#E85D2B] transition-colors">{office.name}</h3>
                                  <div className="flex items-center gap-2 mb-1">
                                    <MapPin className="w-4 h-4 text-[#E85D2B]" />
                                    <p className="text-sm font-medium text-[#E85D2B]">{office.city}</p>
                                  </div>
                                  <p className="text-sm text-[#8E8E93] leading-relaxed">{office.address}</p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="requests">
                <div className="space-y-4">
                  {/* Мобильная версия */}
                  {!isDesktop && (
                    <div className="space-y-4">
                      {/* Заголовок и кнопка Создать — как у других ролей */}
                      <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold text-white">Заявки</h1>
                        <Link href="/create-request">
                          <Button className="h-12 px-5 bg-[#E85D2B] hover:bg-[#D94F15] text-white font-semibold rounded-2xl">
                            <Plus className="h-4 w-4 mr-2" />
                            Создать
                          </Button>
                        </Link>
                      </div>

                      {/* Фильтры */}
                      <div className="flex gap-2">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="flex-1 bg-[#2C2C2E] border-gray-700 text-white">
                            <SelectValue placeholder="Статус" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2C2C2E] border-gray-700">
                            <SelectItem value="all" className="text-white">Все</SelectItem>
                            <SelectItem value="in_progress" className="text-white">В обработке</SelectItem>
                            <SelectItem value="awaiting_assignment" className="text-white">Ожидает</SelectItem>
                            <SelectItem value="execution" className="text-white">Исполнение</SelectItem>
                            <SelectItem value="completed" className="text-white">Завершено</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={filterType} onValueChange={setFilterType}>
                          <SelectTrigger className="flex-1 bg-[#2C2C2E] border-gray-700 text-white">
                            <SelectValue placeholder="Тип" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2C2C2E] border-gray-700">
                            <SelectItem value="all" className="text-white">Все</SelectItem>
                            <SelectItem value="normal" className="text-white">Обычная</SelectItem>
                            <SelectItem value="urgent" className="text-white">Экстренная</SelectItem>
                            <SelectItem value="planned" className="text-white">Плановая</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4 pb-24" style={{ contain: 'layout style paint' }}>
                        {filteredRequests.slice(0, 50).map((requestGroup, index) => {
                          const isLast = index === filteredRequests.length - 1;
                          return (
                            <RequestCard
                              key={`incoming-${index}`}
                              request={requestGroup}
                              onCardClick={handleCardClick}
                              renderCardHeader={renderCardHeader}
                              isLast={isLast}
                              lastElementRef={lastRequestRef}
                              clientRating={clientRatings[requestGroup.id]}
                              userRole="client"
                              variant="compact"
                            />
                          );
                        })}
                        {filteredRequests.length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <p>У вас пока нет заявок</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Десктопная версия — как у админа: список слева, детали заявки в правой панели */}
                  {isDesktop && (
                    <AdminManagerRequestsDesktopFrame
                      filtersSlot={
                        <>
                          <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[140px] bg-[#2C2C2E] border-white/10 text-white">
                              <SelectValue placeholder="Статус" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2C2C2E] border-white/10">
                              <SelectItem value="all">Все</SelectItem>
                              <SelectItem value="in_progress">В обработке</SelectItem>
                              <SelectItem value="awaiting_assignment">Ожидает назначение</SelectItem>
                              <SelectItem value="execution">Исполнение</SelectItem>
                              <SelectItem value="completed">Завершено</SelectItem>
                              <SelectItem value="long_term">Долгосрочные</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-[140px] bg-[#2C2C2E] border-white/10 text-white">
                              <SelectValue placeholder="Тип заявки" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2C2C2E] border-white/10">
                              <SelectItem value="all">Все</SelectItem>
                              <SelectItem value="normal">Обычная</SelectItem>
                              <SelectItem value="urgent">Экстренная</SelectItem>
                              <SelectItem value="planned">Плановая</SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      }
                      listSlot={
                        <>
                          {filteredRequests.slice(0, 50).map((requestGroup, index) => {
                            const isLast = index === filteredRequests.length - 1;
                            return (
                              <RequestCard
                                key={`client-desktop-${requestGroup.id}`}
                                request={requestGroup}
                                onCardClick={handleCardClick}
                                renderCardHeader={renderCardHeader}
                                isLast={isLast}
                                lastElementRef={lastRequestRef}
                                clientRating={clientRatings[requestGroup.id]}
                                userRole="client"
                                variant="compact"
                              />
                            );
                          })}
                          {filteredRequests.length === 0 && (
                            <div className="text-center py-12 text-white/60">У вас пока нет заявок</div>
                          )}
                        </>
                      }
                      detailSlot={
                        selectedRequest ? (
                          <RequestDetails
                            request={selectedRequest}
                            onClose={() => {
                              setSelectedRequest(null);
                              setShowComments(null);
                              closeModal();
                            }}
                            onRequestUpdated={() => {
                              setSelectedRequest(null);
                              closeModal();
                              fetchRequests(1);
                            }}
                            sourceTab="my-requests"
                            hideFullModeButton
                            userRole="client"
                            fullModeRedirectBase="/client"
                            onDelete={handleDeleteSubRequest}
                            embedInPanel
                          />
                        ) : null
                      }
                      displayRequestId={selectedRequest?.id}
                      onCloseDetail={() => {
                        setSelectedRequest(null);
                        setShowComments(null);
                        closeModal();
                      }}
                    />
                  )}
                </div>
              </TabsContent>

                  <TabsContent value="statistics">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Статистика по заявкам</CardTitle>
                          <CardDescription>Ваша активность</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span>Всего подано заявок</span>
                              <span className="font-bold">{stats && stats.totalRequests ? (stats.totalRequests): 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Завершено успешно</span>
                              <span className="font-bold text-[#114A65]">
                                {stats && stats.doneRequests ? (stats.doneRequests) : 0}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Средняя оценка от исполнителей</span>
                              <span className="font-bold">
                                {stats && stats.averageRating ? (stats.averageRating) : 0}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Количество полученных оценок</span>
                              <span className="font-bold text-[#114A65]">
                                {stats && stats.totalRatings ? (stats.totalRatings) : 0}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <MeetingRoomStatistics />
                    </div>
                  </TabsContent>

                  <TabsContent value="meeting-rooms">
                    <MeetingRoomsCatalog
                      initialOffice={selectedOffice}
                      onOfficeChange={setSelectedOffice}
                      initialTab={meetingRoomsTab === "book" ? "book" : "my-bookings"}
                      onTabChange={(tab) => setMeetingRoomsTab(tab === "book" ? "book" : "my-bookings")}
                      showCalculator={showDeskCalculator}
                      onCalculatorToggle={setShowDeskCalculator}
                    />
                  </TabsContent>
                  <TabsContent value="cabinet">
                    {!isDesktop && (
                      <div className="client-mobile-dark space-y-6">
                        <ClientSmartHomeControl />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
          </div>

          {/* Sidebar - скрываем на мобильном в разделе заявок */}
          {(isDesktop || activeTab !== "requests") && (
            <div className="space-y-6 mb-20 mt-6 lg:mt-0">
              <Card className={`overflow-hidden ${isDesktop ? "bg-transparent border-[#3A3A3C]" : ""}`}>
                <CardContent className="p-0">
                  <NotificationsSidebar 
                    variant="dark"
                    onNotificationClick={handleNotificationClick}
                    onRequestClick={(requestId) => {
                      const parsedId = parseInt(requestId.split('/')[0]);
                      const request = requests.find(r => r.id === parsedId);
                      if (request) {
                        if (!isDesktop) {
                          router.push(`/client/requests/${request.id}`);
                          return true;
                        }
                        setSelectedRequest(request);
                        openModal('requestDetails');
                        return true;
                      }
                      return false;
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        </div>
      </div>
      </PullToRefresh>
  {!isDesktop && (
    <BottomNav
        activeTab={activeTab === "requests" ? "requests" : activeTab === "meeting-rooms" ? "booking" : "home"}
        hidden={showCreateRequest || !!selectedRequest || showMapModal || showRatingModal || isModalOpen || !!selectedPhoto || showDeleteRequestModal}
        darkBackground={activeTab === "requests" || activeTab === "cabinet"}
    />
  )}
        {/* Request Details — в портале только на мобилке или когда открыто не из вкладки «Заявки»; на десктопе в «Заявках» детали в правой панели */}
        {selectedRequest && typeof document !== "undefined" && (!isDesktop || activeTab !== "requests") && createPortal(
          <RequestDetails
            request={selectedRequest}
            onClose={() => {
              setSelectedRequest(null);
              setShowComments(null);
              closeModalWithHistory();
            }}
            onRequestUpdated={() => {
              setSelectedRequest(null);
              closeModal();
            }}
            sourceTab="my-requests"
            hideFullModeButton
            userRole="client"
            fullModeRedirectBase="/client"
            onDelete={handleDeleteSubRequest}
          />,
          document.body
        )}

        {/* Модальное окно фото */}
        {selectedPhoto && selectedPhoto?.url && (
            <PhotoModal
                selectedPhoto={selectedPhoto}
                onClose={() => {
                  setSelectedPhoto(null);
                  closeModal();
                }}
            />
        )}

        {/* Map Modal */}
        <MapModal
          isOpen={showMapModal}
          onClose={() => {
            setShowMapModal(false);
            closeModal();
          }}
          mapLocation={mapLocation}
        />
        {/* Rating Modal */}
        <RatingModal
            isOpen={showRatingModal && !!requestToRate}
            onClose={() => {
              setShowRatingModal(false);
              closeModal();
              setRatingValue(0);
              setRequestToRate(null);
              setRatingComment("");
            }}
            ratingValue={ratingValue}
            onRatingChange={setRatingValue}
            onSubmit={handleRateExecutor}
            currentRating={requestToRate ? userRatings[requestToRate.id]?.rating : undefined}
            comment={ratingComment}
            onCommentChange={setRatingComment}
        />

        {/* Модалка */}
        {isModalOpen && selectedNotification && (
            <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]"
                onClick={closeModal}
            >
              <div
                  className="bg-white rounded-xl shadow-lg max-w-md w-full p-6"
                  onClick={(e) => e.stopPropagation()} // Останавливаем всплытие только внутри моталки
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">{selectedNotification.title}</h2>
                  <button
                      className="text-gray-500 hover:text-black text-2xl focus:outline-none"
                      onClick={closeModal}
                      aria-label="Закрыть модальное окно"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-line">
                  {createClickableRequestIds(selectedNotification.content, (requestId) => {
                    // Парсим ID заявки (может быть в формате "123" или "123/1")
                    const parsedId = parseInt(requestId.split('/')[0]);
                    const request = requests.find(r => r.id === parsedId);
                    if (request) {
                      setSelectedRequest(request);
                      openModal('requestDetails');
                      setIsModalOpen(false); // Закрываем модалку уведомления
                    } else {
                      // Заявка не найдена, показываем модалку предупреждения
                      setNotFoundRequestId(requestId);
                      setShowNotFoundModal(true);
                    }
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-4">
                  Получено: {formatNotificationDateTime(selectedNotification.created_at)}
                </p>
              </div>
            </div>
        )}

        {/* Create Request Modal */}
        <CreateRequestModal
          isOpen={showCreateRequest}
          onClose={() => {
            setShowCreateRequest(false);
            // Удаляем createRequest из стека модальных окон
            setModalStack(prev => prev.filter(modal => modal !== 'createRequest'));
          }}
          userRole="client"
          categories={categories}
          onSubmit={handleCreateRequest}
          isSubmitting={isSubmitting}
          formErrors={formErrors}
          clientLocation={requestLocation}
          offices={offices}
        />

        {/* Delete Request Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteRequestModal && !!requestToDelete}
          onClose={() => {
            setShowDeleteRequestModal(false);
            closeModal();
            setRequestToDelete(null);
          }}
          isLoading={deleteLoading}
          onConfirm={confirmDeleteRequest}
          title={`Удалить заявку #${requestToDelete?.id}?`}
          description={`Вы уверены, что хотите удалить заявку "${requestToDelete?.requests[0]?.title || 'Заявка'}"? Это действие необратимо.`}
        />

        {/* Comments Modal */}
        <CommentsModal
          isOpen={!!showComments}
          onClose={() => {
            setShowComments(null);
          }}
          requestId={showComments}
          currentUserId={currentUserId}
          isDesktop={isDesktop}
        />

        <RejectRequestModal
            isOpen={rejectModal.isOpen}
            onClose={rejectModal.hideReject}
            title={rejectModal.title}
            message={rejectModal.message}
            duration={rejectModal.duration}
        />
        {/* Модальное окно информации об иконках */}
        <IconInfoModal
          isOpen={!!showIconInfo}
          onClose={() => setShowIconInfo(null)}
          iconInfo={showIconInfo}
          isDesktop={isDesktop}
        />

        {isDesktop && <Link
            href="/chat-bot"
            className="fixed bottom-4 right-4 z-50 flex items-center justify-center w-14 h-14 bg-[#114A65]/10 text-[#114A65] rounded-full shadow-lg hover:bg-[#114A65]/20 transition"
        >
          <MessageCircle className="w-7 h-7" />

        </Link>}

        {/* Модалка для случая, когда заявка не найдена */}
        <RequestNotFoundModal
          isOpen={showNotFoundModal}
          onClose={() => setShowNotFoundModal(false)}
          requestId={notFoundRequestId}
        />
  </>
  )
}
