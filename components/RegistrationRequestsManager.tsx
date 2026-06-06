'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { api, getOfficeCompanies } from '@/lib/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {useAuthStore} from "@/stores/useAuthStore";
import { useIsMobile } from "@/hooks/use-media-query";
interface RegistrationRequest {
    id: number;
    phone: string;
    full_name: string;
    office_id: number;
    office: { name: string };
    role: string;
    service_category_id?: number;
    service_category?: { name: string };
    company_id?: number | null;
    company?: { id: number; name: string } | null;
    company_other_name?: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

interface Office {
    id: number;
    name: string;
    photo?: string | null;
}

interface Company {
    id: number;
    name: string;
}

/** Спец-значения в селекте «Компания» при редактировании заявки администратором. */
const COMPANY_OTHER_VALUE = '__other__';
const COMPANY_NONE_VALUE = '__none__';

interface RegistrationRequestsManagerProps {
    /** Тёмная тема для раздела Управление на десктопе у менеджера */
    variant?: 'light' | 'dark';
}

export default function RegistrationRequestsManager({ variant = 'light' }: RegistrationRequestsManagerProps) {
    const {role} = useAuthStore();
    const isMobile = useIsMobile();
    const isDark = variant === 'dark';
    const [requests, setRequests] = useState<RegistrationRequest[]>([]);
    const [offices, setOffices] = useState<Office[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        office_id: '',
        date_from: '',
        date_to: ''
    });

    // Состояние модалки редактирования заявки администратором перед approve.
    const [editing, setEditing] = useState<RegistrationRequest | null>(null);
    const [editOfficeId, setEditOfficeId] = useState<string>('');
    const [editCompanyId, setEditCompanyId] = useState<string>('');
    const [editCompanyOtherName, setEditCompanyOtherName] = useState<string>('');
    const [editCompanies, setEditCompanies] = useState<Company[]>([]);
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const canEditOfficeCompany = role === 'admin-worker' || role === 'admin' || role === 'manager';

    useEffect(() => {
        loadOffices();
        loadRequests();
    }, [filters]);

    const loadOffices = async () => {
        try {
            const response = await api.get('/offices');
            setOffices(response.data);
        } catch (error) {
            console.error('Ошибка при загрузке офисов:', error);
        }
    };

    const loadRequests = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await api.get(`/registration-requests?${params.toString()}`);
            setRequests(response.data.data);
        } catch (error) {
            console.error('Ошибка при загрузке запросов:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId: number) => {
        try {
            await api.put(`/registration-requests/${requestId}/approve`);
            toast({
                title: 'Успешно',
                description: 'Запрос одобрен, пользователь создан'
            });
            loadRequests();
        } catch (error: any) {
            toast({
                title: 'Ошибка',
                description: error.response?.data?.message || 'Произошла ошибка при одобрении',
                variant: 'destructive'
            });
        }
    };

    const openEdit = (request: RegistrationRequest) => {
        setEditing(request);
        setEditOfficeId(request.office_id ? String(request.office_id) : '');
        if (request.company_id) {
            setEditCompanyId(String(request.company_id));
            setEditCompanyOtherName('');
        } else if (request.company_other_name) {
            setEditCompanyId(COMPANY_OTHER_VALUE);
            setEditCompanyOtherName(request.company_other_name);
        } else {
            setEditCompanyId(COMPANY_NONE_VALUE);
            setEditCompanyOtherName('');
        }
        setEditError(null);
    };

    const closeEdit = () => {
        setEditing(null);
        setEditCompanies([]);
        setEditError(null);
    };

    // Подгружаем компании выбранного офиса при редактировании.
    useEffect(() => {
        if (!editing || !editOfficeId) {
            setEditCompanies([]);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const list = await getOfficeCompanies(Number(editOfficeId));
                if (cancelled) return;
                setEditCompanies(list);
            } catch (error) {
                console.error('Ошибка при загрузке компаний:', error);
                if (!cancelled) setEditCompanies([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [editing, editOfficeId]);

    const handleSaveEdit = async () => {
        if (!editing) return;
        if (!editOfficeId) {
            setEditError('Выберите офис');
            return;
        }
        const payload: Record<string, unknown> = {
            office_id: parseInt(editOfficeId),
        };
        // Привязка к компании имеет смысл только для клиента.
        if (editing.role === 'client') {
            if (editCompanyId === COMPANY_OTHER_VALUE) {
                const trimmed = editCompanyOtherName.trim();
                if (!trimmed) {
                    setEditError('Укажите название компании');
                    return;
                }
                payload.company_id = null;
                payload.company_other_name = trimmed;
            } else if (editCompanyId === COMPANY_NONE_VALUE || !editCompanyId) {
                payload.company_id = null;
                payload.company_other_name = null;
            } else {
                payload.company_id = parseInt(editCompanyId);
                payload.company_other_name = null;
            }
        }
        setEditSaving(true);
        setEditError(null);
        try {
            await api.put(`/registration-requests/${editing.id}`, payload);
            toast({ title: 'Сохранено', description: 'Заявка обновлена' });
            closeEdit();
            loadRequests();
        } catch (error: any) {
            setEditError(error?.response?.data?.message || error?.response?.data?.error || 'Не удалось сохранить заявку');
        } finally {
            setEditSaving(false);
        }
    };

    const handleReject = async (requestId: number) => {
        try {
            await api.put(`/registration-requests/${requestId}/reject`);
            toast({
                title: 'Успешно',
                description: 'Запрос отклонен'
            });
            loadRequests();
        } catch (error: any) {
            toast({
                title: 'Ошибка',
                description: error.response?.data?.message || 'Произошла ошибка при отклонении',
                variant: 'destructive'
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const statusLabels: Record<'pending' | 'approved' | 'rejected', string> = {
            pending: 'Ожидает',
            approved: 'Одобрено',
            rejected: 'Отклонено'
        };
        const label = statusLabels[status as keyof typeof statusLabels];
        if (isDark) {
            const darkCl: Record<string, string> = {
                pending: 'bg-[#E85D2B]/20 text-[#E85D2B] border-[#E85D2B]/30',
                approved: 'bg-white/10 text-white/90 border-white/20',
                rejected: 'bg-red-500/20 text-red-400 border-red-500/30'
            };
            return <Badge variant="outline" className={darkCl[status] || ''}>{label}</Badge>;
        }
        const variants: Record<'pending' | 'approved' | 'rejected', 'default' | 'destructive' | 'secondary' | 'outline'> = {
            pending: 'default',
            approved: 'secondary',
            rejected: 'destructive'
        };
        return <Badge variant={variants[status as keyof typeof variants]}>{label}</Badge>;
    };

    const getRoleLabel = (role: string) => {
        const roleLabels: Record<string, string> = {
            client: 'Клиент',
            executor: 'Исполнитель',
            manager: 'Менеджер',
            admin: 'Администратор'
        };
        return roleLabels[role] || role;
    };

    const inputCl = isDark || isMobile ? (isDark ? "bg-[#1A1A1A] border-white/10 text-white placeholder:text-white/50" : "bg-[#1C1C1E] border-[#3A3A3C] text-white") : "";
    const labelCl = isDark ? "text-white/80" : "";
    const cardCl = isDark ? "border-white/10 bg-[#2C2C2E]" : "";
    const titleCl = isDark ? "text-white" : "";
    const mutedCl = isDark ? "text-white/60" : "text-muted-foreground";
    const approveBtnCl = isDark ? "bg-[#E85D2B] hover:bg-[#E85D2B]/90 text-white" : (isMobile ? "bg-[#F35713] hover:bg-[#E04D0F] text-white" : "bg-green-600 hover:bg-green-700");

    return (
        <div className="space-y-6">
            <Card className={cardCl ? `border ${cardCl}` : ""}>
                <CardHeader>
                    <CardTitle className={`text-lg md:text-xl ${titleCl}`}>Управление запросами на регистрацию</CardTitle>
                    <p className={`text-xs md:text-sm ${mutedCl}`}>
                        Внимание: отклоненные и одобренные заявки автоматически удаляются каждые 7 дней
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="space-y-2">
                            <Label className={`text-xs md:text-sm ${labelCl}`}>Статус</Label>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === "all" ? "" : value }))}
                            >
                                <SelectTrigger className={`text-xs md:text-sm ${inputCl}`}>
                                    <SelectValue placeholder="Все статусы" />
                                </SelectTrigger>
                                <SelectContent className={isDark ? "bg-[#2C2C2E] border-white/10 text-white" : (isMobile ? "bg-[#2C2C2E] border-[#3A3A3C] text-white" : "")}>
                                    <SelectItem value="all">Все статусы</SelectItem>
                                    <SelectItem value="pending">Ожидает</SelectItem>
                                    <SelectItem value="approved">Одобрено</SelectItem>
                                    <SelectItem value="rejected">Отклонено</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {role === "manager" && (
                            <div className="space-y-2">
                                <Label className={`text-xs md:text-sm ${labelCl}`}>Офис</Label>
                                <Select
                                    value={filters.office_id}
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, office_id: value === "all" ? "" : value }))}
                                >
                                    <SelectTrigger className={`text-xs md:text-sm ${inputCl}`}>
                                        <SelectValue placeholder="Все офисы" />
                                    </SelectTrigger>
                                    <SelectContent className={isDark ? "bg-[#2C2C2E] border-white/10 text-white" : (isMobile ? "bg-[#2C2C2E] border-[#3A3A3C] text-white" : "")}>
                                        <SelectItem value="all">Все офисы</SelectItem>
                                        {offices.map((office) => (
                                            <SelectItem key={office.id} value={office.id.toString()}>
                                                {office.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className={`text-xs md:text-sm ${labelCl}`}>Дата от</Label>
                            <Input
                                type="date"
                                value={filters.date_from}
                                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                                className={`text-xs md:text-sm ${inputCl}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className={`text-xs md:text-sm ${labelCl}`}>Дата до</Label>
                            <Input
                                type="date"
                                value={filters.date_to}
                                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                                className={`text-xs md:text-sm ${inputCl}`}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className={`text-center py-8 text-sm md:text-base ${isDark ? "text-white/70" : ""}`}>Загрузка...</div>
                    ) : requests.length === 0 ? (
                        <div className={`text-center py-8 text-sm md:text-base ${mutedCl}`}>
                            Запросы не найдены
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request) => (
                                <Card key={request.id} className={cardCl ? `border ${cardCl}` : ""}>
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                                    <h3 className={`font-semibold text-sm md:text-base ${isDark ? "text-white" : ""}`}>{request.full_name}</h3>
                                                    {getStatusBadge(request.status)}
                                                    {request.role === 'executor' && (
                                                        <Badge variant="outline" className={`text-xs ${isDark ? "border-white/20 text-white/80" : ""}`}>
                                                            Исполнитель
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm ${mutedCl}`}>
                                                    <p>Телефон: {request.phone}</p>
                                                    <p>Офис: {request.office.name}</p>
                                                    <p>Роль: {getRoleLabel(request.role)}</p>
                                                    {request.role === 'executor' && request.service_category && (
                                                        <p>Категория: {request.service_category.name}</p>
                                                    )}
                                                    {request.role === 'client' && (
                                                        <p>
                                                            Компания: {request.company?.name
                                                                ?? (request.company_other_name ? `${request.company_other_name} (новая)` : 'Не указана')}
                                                        </p>
                                                    )}
                                                    <p>Дата: {format(new Date(request.created_at), 'dd MMMM yyyy HH:mm', { locale: ru })}</p>
                                                </div>
                                            </div>

                                            {request.status === 'pending' && (
                                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                                    {canEditOfficeCompany && (
                                                        <Button
                                                            onClick={() => openEdit(request)}
                                                            size="sm"
                                                            variant="outline"
                                                            className={`text-xs md:text-sm px-3 md:px-4 py-1 md:py-2 ${isDark ? 'border-white/20 text-white hover:bg-white/10' : ''}`}
                                                        >
                                                            Изменить офис / компанию
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={() => handleApprove(request.id)}
                                                        size="sm"
                                                        className={`text-xs md:text-sm px-3 md:px-4 py-1 md:py-2 ${approveBtnCl}`}
                                                    >
                                                        Одобрить
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleReject(request.id)}
                                                        size="sm"
                                                        variant="destructive"
                                                        className={
                                                            isDark
                                                                ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs md:text-sm px-3 md:px-4 py-1 md:py-2 border border-red-500/30"
                                                                : (isMobile
                                                                    ? "bg-[#8E2B2B] hover:bg-[#A33030] text-white text-xs md:text-sm px-3 md:px-4 py-1 md:py-2"
                                                                    : "text-xs md:text-sm px-3 md:px-4 py-1 md:py-2")
                                                        }
                                                    >
                                                        Отклонить
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {editing && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className={`w-full max-w-md rounded-lg p-5 space-y-4 ${isDark ? 'bg-[#2C2C2E] border border-white/10 text-white' : 'bg-white text-foreground'}`}>
                        <div>
                            <h3 className="text-lg font-semibold">Изменить офис и компанию</h3>
                            <p className={`text-xs mt-1 ${mutedCl}`}>Заявка: {editing.full_name} ({editing.phone})</p>
                        </div>

                        <div className="space-y-2">
                            <Label className={`text-xs md:text-sm ${labelCl}`}>Офис</Label>
                            <Select
                                value={editOfficeId}
                                onValueChange={(value) => {
                                    setEditOfficeId(value);
                                    // Компания зависит от офиса — сбрасываем выбор.
                                    setEditCompanyId(editing?.role === 'client' ? COMPANY_NONE_VALUE : '');
                                    setEditCompanyOtherName('');
                                }}
                            >
                                <SelectTrigger className={`text-xs md:text-sm ${inputCl}`}>
                                    <SelectValue placeholder="Выберите офис" />
                                </SelectTrigger>
                                <SelectContent className={isDark ? 'bg-[#2C2C2E] border-white/10 text-white' : ''}>
                                    {offices.map((office) => (
                                        <SelectItem key={office.id} value={office.id.toString()}>
                                            {office.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {editing.role === 'client' && (
                            <div className="space-y-2">
                                <Label className={`text-xs md:text-sm ${labelCl}`}>Компания</Label>
                                <Select
                                    value={editCompanyId || COMPANY_NONE_VALUE}
                                    onValueChange={(value) => {
                                        setEditCompanyId(value);
                                        if (value !== COMPANY_OTHER_VALUE) setEditCompanyOtherName('');
                                    }}
                                >
                                    <SelectTrigger className={`text-xs md:text-sm ${inputCl}`}>
                                        <SelectValue placeholder="Выберите компанию" />
                                    </SelectTrigger>
                                    <SelectContent className={isDark ? 'bg-[#2C2C2E] border-white/10 text-white' : ''}>
                                        <SelectItem value={COMPANY_NONE_VALUE}>Не указана</SelectItem>
                                        {editCompanies.map((company) => (
                                            <SelectItem key={company.id} value={company.id.toString()}>
                                                {company.name}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value={COMPANY_OTHER_VALUE}>Другое</SelectItem>
                                    </SelectContent>
                                </Select>
                                {editCompanyId === COMPANY_OTHER_VALUE && (
                                    <Input
                                        value={editCompanyOtherName}
                                        onChange={(e) => setEditCompanyOtherName(e.target.value)}
                                        placeholder="Название компании"
                                        maxLength={255}
                                        className={`text-xs md:text-sm ${inputCl}`}
                                    />
                                )}
                            </div>
                        )}

                        {editError && <p className="text-sm text-red-500">{editError}</p>}

                        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                            <Button type="button" variant="ghost" onClick={closeEdit} disabled={editSaving}>
                                Отмена
                            </Button>
                            <Button type="button" onClick={handleSaveEdit} disabled={editSaving}>
                                {editSaving ? 'Сохранение...' : 'Сохранить'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
