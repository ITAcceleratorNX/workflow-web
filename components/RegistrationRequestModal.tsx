'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, getOfficeCompanies, getServiceCategoriesPublic } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

interface RegistrationRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Office {
    id: number;
    name: string;
    photo?: string | null;
}

interface Role {
    value: string;
    label: string;
}

interface ServiceCategory {
    id: number;
    name: string;
}

interface Company {
    id: number;
    name: string;
}

const ROLES: Role[] = [
    { value: 'client', label: 'Клиент' },
    { value: 'executor', label: 'Исполнитель' }
];

/** Спец-значение в селекте «Компания»: «Другое» — название будет введено вручную. */
const COMPANY_OTHER_VALUE = '__other__';

export default function RegistrationRequestModal({ isOpen, onClose }: RegistrationRequestModalProps) {
    const [formData, setFormData] = useState({
        phone: '',
        full_name: '',
        office_id: '',
        role: '',
        service_category_id: '',
        /** id компании, '__other__' (Другое) или '' (не выбрано). */
        company_id: '',
        /** Произвольное название компании, если выбрано «Другое». */
        company_other_name: '',
        password: '',
        confirm_password: ''
    });
    const [offices, setOffices] = useState<Office[]>([]);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { toast } = useToast()
    const [formErrors, setFormErrors] = useState<string | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            loadOffices();
        }
    }, [isOpen]);

    const loadOffices = async () => {
        try {
            const response = await api.get('/offices');
            setOffices(response.data);
        } catch (error) {
            console.error('Ошибка при загрузке офисов:', error);
        }
    };

    React.useEffect(() => {
        if (!isOpen) {
            setCategories([]);
            return;
        }
        const officeId = Number(formData.office_id);
        if (!officeId) {
            setCategories([]);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const list = await getServiceCategoriesPublic(officeId);
                if (!cancelled) setCategories(list);
            } catch (error) {
                console.error('Ошибка при загрузке категорий:', error);
                if (!cancelled) setCategories([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isOpen, formData.office_id]);

    // Подгружаем компании выбранного офиса (только если открыт модал — иначе тратим запрос впустую).
    React.useEffect(() => {
        if (!isOpen || !formData.office_id) {
            setCompanies([]);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const list = await getOfficeCompanies(Number(formData.office_id));
                if (cancelled) return;
                setCompanies(list);
            } catch (error) {
                console.error('Ошибка при загрузке компаний:', error);
                if (!cancelled) setCompanies([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isOpen, formData.office_id]);

    // Автоматическое форматирование телефона
    const formatPhone = (value: string) => {
        // убираем всё, кроме цифр
        let numbers = value.replace(/\D/g, '');

        // если номер начинается с "8", заменяем на "7"
        if (numbers.startsWith('8')) {
            numbers = '7' + numbers.slice(1);
        }

        // если нет "7" в начале — добавляем
        if (!numbers.startsWith('7')) {
            numbers = '7' + numbers;
        }

        // оставляем максимум 11 цифр
        numbers = numbers.slice(0, 11);

        // форматируем
        if (numbers.length <= 1) return '+7 ';
        if (numbers.length <= 4) return `+7 ${numbers.slice(1)}`;
        if (numbers.length <= 7) return `+7 ${numbers.slice(1, 4)} ${numbers.slice(4)}`;
        if (numbers.length <= 9) return `+7 ${numbers.slice(1, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7)}`;
        return `+7 ${numbers.slice(1, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 9)} ${numbers.slice(9, 11)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formatted = formatPhone(value);
        setFormData(prev => ({ ...prev, phone: formatted }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors("")

        if (formData.password !== formData.confirm_password) {
            setFormErrors("Пароли не совпадают");
            return;
        }

        if (formData.password.length < 6) {
            setFormErrors("Пароль должен содержать минимум 6 символов")
            return;
        }

        setLoading(true);
        try {
            const { phone, full_name, office_id, role, service_category_id, company_id, company_other_name, password } = formData;
            const requestData: any = {
                phone,
                full_name,
                office_id: parseInt(office_id),
                role,
                password
            };

            // Добавляем service_category_id только если роль - executor и категория выбрана
            if (role === 'executor' && service_category_id) {
                requestData.service_category_id = parseInt(service_category_id);
            }

            // Привязка к компании актуальна только для клиента.
            if (role === 'client') {
                if (company_id === COMPANY_OTHER_VALUE) {
                    const trimmed = company_other_name.trim();
                    if (!trimmed) {
                        setFormErrors('Укажите название компании');
                        setLoading(false);
                        return;
                    }
                    requestData.company_other_name = trimmed;
                } else if (company_id) {
                    requestData.company_id = parseInt(company_id);
                }
            }

            await api.post('/registration-requests', requestData);

            toast({
              title: "Успешно",
              description: "Заявка на регистрацию отправлена"
            });

            setFormData({
                phone: '',
                full_name: '',
                office_id: '',
                role: '',
                service_category_id: '',
                company_id: '',
                company_other_name: '',
                password: '',
                confirm_password: ''
            });
            setStep(1);
        } catch (error: any) {
            console.error(error);
            setFormErrors(error.response?.data?.error || 'Произошла ошибка при отправке запроса')
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <CardTitle className="text-center text-lg md:text-xl">
                        {step === 1 ? 'Запрос на регистрацию' : 'Придумать пароль'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {step === 1 ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm md:text-base">Номер телефона *</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handlePhoneChange}
                                        placeholder="+7 XXX XXX XX XX"
                                        required
                                        maxLength={19}
                                        className="text-sm md:text-base"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="full_name" className="text-sm md:text-base">ФИО *</Label>
                                    <Input
                                        id="full_name"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                        placeholder="Введите полное имя"
                                        required
                                        className="text-sm md:text-base"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="office" className="text-sm md:text-base">Офис *</Label>
                                    <Select
                                        value={formData.office_id}
                                        onValueChange={(value) => setFormData(prev => ({
                                            ...prev,
                                            office_id: value,
                                            service_category_id: '',
                                            // компания принадлежит офису — при смене офиса сбрасываем выбор.
                                            company_id: '',
                                            company_other_name: '',
                                        }))}
                                        required
                                    >
                                        <SelectTrigger className="text-sm md:text-base">
                                            <SelectValue placeholder="Выберите офис" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {offices.map((office) => (
                                                <SelectItem key={office.id} value={office.id.toString()}>
                                                    {office.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-sm md:text-base">Роль *</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value) => setFormData(prev => ({
                                            ...prev,
                                            role: value,
                                            service_category_id: '',
                                            // компания только для клиента.
                                            company_id: '',
                                            company_other_name: '',
                                        }))}
                                        required
                                    >
                                        <SelectTrigger className="text-sm md:text-base">
                                            <SelectValue placeholder="Выберите роль" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLES.map((role) => (
                                                <SelectItem key={role.value} value={role.value}>
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.role === 'client' && formData.office_id && (
                                    <div className="space-y-2">
                                        <Label htmlFor="company" className="text-sm md:text-base">Компания *</Label>
                                        <Select
                                            value={formData.company_id}
                                            onValueChange={(value) => setFormData(prev => ({
                                                ...prev,
                                                company_id: value,
                                                company_other_name: value === COMPANY_OTHER_VALUE ? prev.company_other_name : '',
                                            }))}
                                            required
                                        >
                                            <SelectTrigger className="text-sm md:text-base">
                                                <SelectValue placeholder={companies.length ? 'Выберите компанию' : 'Компании ещё не добавлены — выберите «Другое»'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {companies.map((company) => (
                                                    <SelectItem key={company.id} value={company.id.toString()}>
                                                        {company.name}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value={COMPANY_OTHER_VALUE}>Другое</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {formData.company_id === COMPANY_OTHER_VALUE && (
                                            <Input
                                                value={formData.company_other_name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, company_other_name: e.target.value }))}
                                                placeholder="Название компании"
                                                maxLength={255}
                                                className="text-sm md:text-base"
                                            />
                                        )}
                                    </div>
                                )}

                                {formData.role === 'executor' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="service_category" className="text-sm md:text-base">Категория услуг *</Label>
                                        <Select
                                            value={formData.service_category_id}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, service_category_id: value }))}
                                            required
                                        >
                                            <SelectTrigger className="text-sm md:text-base">
                                                <SelectValue placeholder="Выберите категорию услуг" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id.toString()}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {formErrors && <p className="text-sm text-red-500">{formErrors}</p>}

                                <Button
                                    type="button"
                                    onClick={() => {
                                        setStep(2);
                                        setFormErrors("");
                                    }}
                                    disabled={
                                        !formData.phone ||
                                        !formData.full_name ||
                                        !formData.office_id ||
                                        !formData.role ||
                                        (formData.role === 'executor' && !formData.service_category_id) ||
                                        // Клиент должен выбрать компанию или указать «Другое» с непустым названием.
                                        (formData.role === 'client' && (
                                            !formData.company_id ||
                                            (formData.company_id === COMPANY_OTHER_VALUE && !formData.company_other_name.trim())
                                        ))
                                    }
                                    className="w-full text-sm md:text-base py-2 md:py-3"
                                >
                                    Далее
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2 relative">
                                    <Label htmlFor="password" className="text-sm md:text-base">Пароль *</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                            placeholder="Минимум 6 символов"
                                            required
                                            minLength={6}
                                            className="text-sm md:text-base"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 relative">
                                    <Label htmlFor="confirm_password" className="text-sm md:text-base">Подтвердите пароль *</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirm_password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={formData.confirm_password}
                                            onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                                            placeholder="Повторите пароль"
                                            required
                                            className="text-sm md:text-base"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {formErrors && <p className="text-sm text-red-500">{formErrors}</p>}

                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setStep(1);
                                            setFormErrors("");
                                        }}
                                        variant="outline"
                                        className="flex-1 text-sm md:text-base py-2 md:py-3"
                                    >
                                        Назад
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 text-sm md:text-base py-2 md:py-3"
                                    >
                                        {loading ? 'Отправка...' : 'Отправить запрос'}
                                    </Button>
                                </div>
                            </>
                        )}

                        <Button
                            type="button"
                            onClick={onClose}
                            variant="ghost"
                            className="w-full text-sm md:text-base py-2 md:py-3"
                        >
                            Отмена
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
