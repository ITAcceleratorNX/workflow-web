"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
    ChevronDown,
    ChevronLeft,
    Loader2,
    Power,
    Trash2,
    Plus,
    UserMinus,
    UserPlus,
    Building2,
    DoorOpen,
    Search,
    Lightbulb,
    Wind,
    Blinds,
    Plug,
    Tv,
    Speaker,
    Thermometer,
    Lock,
    Monitor,
    Wifi,
    AlertTriangle,
    Users,
    Settings2,
    Home,
    MapPin,
} from "lucide-react"
import {
    getOffices,
    getMeetingRooms,
    getYandexDevicesList,
    getRoomDevices,
    getRoomDevicesForClient,
    createRoomDevice,
    deleteRoomDevice,
    controlDevice,
    getRoomSubscriptions,
    createClientRoomSubscription,
    deleteClientRoomSubscription,
    getAllUsers,
    type Office,
    type MeetingRoom,
    type YandexDevice,
    type RoomDevice,
    type ControlDeviceRequest,
    type ClientRoomSubscription,
} from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

// ---- Device Icon Helper ----
function getDeviceIcon(deviceType: string | null | undefined, deviceName: string) {
    const name = (deviceName || "").toLowerCase()
    const type = (deviceType || "").toLowerCase()

    if (name.includes("свет") || name.includes("сеет") || name.includes("лампа") || name.includes("light") || type.includes("light")) {
        return Lightbulb
    }
    if (name.includes("кондиционер") || name.includes("вентил") || name.includes("thermostat") || type.includes("thermostat")) {
        return Wind
    }
    if (name.includes("шторы") || name.includes("жалюзи") || name.includes("curtain") || type.includes("curtain") || type.includes("openable")) {
        return Blinds
    }
    if (name.includes("розетка") || name.includes("socket") || type.includes("socket")) {
        return Plug
    }
    if (name.includes("тв") || name.includes("телевизор") || type.includes("media_device")) {
        return Tv
    }
    if (name.includes("колонка") || name.includes("speaker") || type.includes("speaker")) {
        return Speaker
    }
    if (name.includes("термо") || type.includes("sensor")) {
        return Thermometer
    }
    if (name.includes("замок") || name.includes("lock") || type.includes("lock")) {
        return Lock
    }
    return Power
}

// ---- User type ----
interface UserInfo {
    id: number
    full_name: string
    phone: string
    role: string
}

interface SmartHomeManagementProps {
    /** Тёмная тема (для раздела Управление на десктопе у админа) */
    dark?: boolean
}

export function SmartHomeManagement({ dark = false }: SmartHomeManagementProps) {
    const { toast } = useToast()

    const d = dark
    const cardBg = d ? "bg-[#2C2C2E]" : "bg-white"
    const cardBorder = d ? "border-white/10" : "border-gray-200"
    const cardHover = d ? "hover:bg-[#3A3A3C] hover:border-[#E85D2B]/30" : "hover:border-blue-300 hover:bg-blue-50/50"
    const titleCl = d ? "text-white" : "text-gray-900"
    const mutedCl = d ? "text-white/60" : "text-gray-500"
    const iconBg = d ? "bg-[#E85D2B]/20" : "bg-blue-50"
    const iconCl = d ? "text-[#E85D2B]" : "text-blue-600"
    const sidebarBg = d ? "bg-[#2C2C2E]" : "bg-white"
    const sidebarHeadBg = d ? "bg-[#1A1A1A] border-white/10" : "bg-gray-50 border-gray-200"
    const sidebarHeadText = d ? "text-white/80" : "text-gray-700"
    const roomItemSelected = d ? "bg-[#E85D2B]/20 border-l-[#E85D2B]" : "bg-blue-50 border-l-blue-500"
    const roomItemHover = d ? "hover:bg-white/5" : "hover:bg-gray-50"
    const roomItemText = d ? "text-white/90" : "text-gray-700"
    const roomItemTextSelected = d ? "text-[#E85D2B]" : "text-blue-700"
    const rowBg = d ? "bg-[#1A1A1A] border-white/10" : "bg-gray-50 border-gray-100"
    const rowText = d ? "text-white/90" : "text-gray-800"
    const addFormBg = d ? "bg-[#E85D2B]/10 border-[#E85D2B]/30" : "bg-blue-50 border-blue-200"
    const addFormText = d ? "text-[#E85D2B]" : "text-blue-800"
    const addFormInput = d ? "bg-[#1A1A1A] border-white/10 text-white focus:border-[#E85D2B]" : "border-blue-200 bg-white focus:border-blue-400"
    const addFormGreenBg = d ? "bg-green-500/10 border-green-500/30" : "bg-green-50 border-green-200"
    const addFormGreenText = d ? "text-green-300" : "text-green-800"
    const addFormGreenInput = d ? "bg-[#1A1A1A] border-white/10 text-white focus:border-green-400" : "border-green-200 bg-white focus:border-green-400"
    const btnPrimary = d ? "bg-[#E85D2B] hover:bg-[#E85D2B]/90 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
    const btnGreen = d ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"
    const btnCancel = d ? "text-white/70 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"
    const btnGhost = d ? "hover:bg-white/10" : "hover:bg-gray-100"
    const btnRemove = d ? "border-white/20 text-white/80 hover:bg-red-500/20 hover:text-red-400" : "text-gray-600 bg-white border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
    const emptyCl = d ? "text-white/50" : "text-gray-400"
    const loaderCl = d ? "text-white/50" : "text-gray-400"
    const userAvatarBg = d ? "bg-white/10" : "bg-gray-200"
    const userAvatarIcon = d ? "text-white/60" : "text-gray-500"
    const accessLabel = d ? "text-green-400" : "text-green-600"

    // --- Step state ---
    const [step, setStep] = useState<"offices" | "cabinets">("offices")

    // --- Data ---
    const [offices, setOffices] = useState<Office[]>([])
    const [selectedOffice, setSelectedOffice] = useState<Office | null>(null)
    const [rooms, setRooms] = useState<MeetingRoom[]>([])
    const [selectedRoom, setSelectedRoom] = useState<MeetingRoom | null>(null)

    // --- Devices ---
    const [roomLinkedDevices, setRoomLinkedDevices] = useState<RoomDevice[]>([])
    const [roomYandexDevices, setRoomYandexDevices] = useState<YandexDevice[]>([])
    const [allYandexDevices, setAllYandexDevices] = useState<YandexDevice[]>([])

    // --- Subscriptions (employee access) ---
    const [roomSubscriptions, setRoomSubscriptions] = useState<ClientRoomSubscription[]>([])
    const [allUsers, setAllUsers] = useState<UserInfo[]>([])

    // --- Loading states ---
    const [loadingOffices, setLoadingOffices] = useState(false)
    const [loadingRooms, setLoadingRooms] = useState(false)
    const [loadingDevices, setLoadingDevices] = useState(false)
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(false)
    const [isControlling, setIsControlling] = useState<string | null>(null)
    const [isDeletingDevice, setIsDeletingDevice] = useState<number | null>(null)
    const [isDeletingSub, setIsDeletingSub] = useState<number | null>(null)
    const [isAddingDevice, setIsAddingDevice] = useState(false)
    const [isAddingEmployee, setIsAddingEmployee] = useState(false)

    // --- UI states ---
    const [devicesExpanded, setDevicesExpanded] = useState(true)
    const [accessExpanded, setAccessExpanded] = useState(true)
    const [showAddDevice, setShowAddDevice] = useState(false)
    const [showAddEmployee, setShowAddEmployee] = useState(false)
    const [selectedNewDevice, setSelectedNewDevice] = useState<string>("")
    const [selectedNewEmployee, setSelectedNewEmployee] = useState<number | "">("")
    const [employeeFilter, setEmployeeFilter] = useState("")
    const [showEmployeeFilterDropdown, setShowEmployeeFilterDropdown] = useState(false)

    // --- Load offices on mount ---
    useEffect(() => {
        loadOffices()
        loadAllYandexDevices()
        loadAllUsers()
    }, [])

    const loadOffices = async () => {
        try {
            setLoadingOffices(true)
            const response = await getOffices()
            setOffices(response.data || [])
        } catch (err) {
            console.error("Error loading offices:", err)
        } finally {
            setLoadingOffices(false)
        }
    }

    const loadAllYandexDevices = async () => {
        try {
            const response = await getYandexDevicesList()
            setAllYandexDevices(response.data.devices || [])
        } catch (err) {
            console.error("Error loading Yandex devices:", err)
        }
    }

    const loadAllUsers = async () => {
        try {
            const response = await getAllUsers()
            const users = response.data?.users || response.data || []
            setAllUsers(users)
        } catch (err) {
            console.error("Error loading users:", err)
        }
    }

    const handleSelectOffice = async (office: Office) => {
        setSelectedOffice(office)
        setSelectedRoom(null)
        setStep("cabinets")
        try {
            setLoadingRooms(true)
            const response = await getMeetingRooms(office.id)
            const allRooms = response.data || []
            setRooms(allRooms)
            // Auto-select first room
            if (allRooms.length > 0) {
                handleSelectRoom(allRooms[0])
            }
        } catch (err) {
            console.error("Error loading rooms:", err)
            setRooms([])
        } finally {
            setLoadingRooms(false)
        }
    }

    const handleSelectRoom = useCallback(async (room: MeetingRoom) => {
        setSelectedRoom(room)
        setShowAddDevice(false)
        setShowAddEmployee(false)
        setSelectedNewDevice("")
        setSelectedNewEmployee("")
        setEmployeeFilter("")

        // Load devices for this room
        setLoadingDevices(true)
        try {
            const [linkedResp, clientResp] = await Promise.all([
                getRoomDevices(room.id),
                getRoomDevicesForClient(room.id).catch(() => ({ data: { devices: [] } })),
            ])
            setRoomLinkedDevices(linkedResp.data.devices || [])
            setRoomYandexDevices(clientResp.data.devices || [])
        } catch (err) {
            console.error("Error loading room devices:", err)
            setRoomLinkedDevices([])
            setRoomYandexDevices([])
        } finally {
            setLoadingDevices(false)
        }

        // Load subscriptions for this room
        setLoadingSubscriptions(true)
        try {
            const response = await getRoomSubscriptions(room.id)
            setRoomSubscriptions(response.data.subscriptions || [])
        } catch (err) {
            console.error("Error loading subscriptions:", err)
            setRoomSubscriptions([])
        } finally {
            setLoadingSubscriptions(false)
        }
    }, [])

    const handleBackToOffices = () => {
        setStep("offices")
        setSelectedOffice(null)
        setSelectedRoom(null)
        setRooms([])
        setRoomLinkedDevices([])
        setRoomYandexDevices([])
        setRoomSubscriptions([])
    }

    // --- Device control ---
    const getDeviceState = (device: YandexDevice): boolean | null => {
        const capability = device.capabilities?.find((cap: any) => cap.type === "devices.capabilities.on_off")
        if (capability?.state?.value !== undefined) {
            return capability.state.value
        }
        return null
    }

    const handleToggleDevice = async (device: YandexDevice) => {
        const currentState = getDeviceState(device)
        if (currentState === null) return

        try {
            setIsControlling(device.id)
            const request: ControlDeviceRequest = {
                device_id: device.id,
                action_type: "devices.capabilities.on_off",
                action_state: {
                    instance: "on",
                    value: !currentState,
                },
            }
            await controlDevice(request)

            // Update local state
            setRoomYandexDevices((prev) =>
                prev.map((d) => {
                    if (d.id === device.id) {
                        const updated = { ...d }
                        const cap = updated.capabilities?.find((c: any) => c.type === "devices.capabilities.on_off")
                        if (cap) {
                            cap.state = { ...cap.state, value: !currentState }
                        }
                        return updated
                    }
                    return d
                })
            )

            toast({
                title: "Успешно",
                description: `${device.name} ${!currentState ? "включено" : "выключено"}`,
                duration: 2000,
            })
        } catch (err) {
            toast({
                title: "Ошибка",
                description: "Не удалось управлять устройством",
                variant: "destructive",
                duration: 3000,
            })
        } finally {
            setIsControlling(null)
        }
    }

    // --- Add/Remove device ---
    const handleAddDevice = async () => {
        if (!selectedNewDevice || !selectedRoom) return
        const device = allYandexDevices.find((d) => d.id === selectedNewDevice)
        if (!device) return

        try {
            setIsAddingDevice(true)
            await createRoomDevice({
                meeting_room_id: selectedRoom.id,
                device_id: device.id,
                device_name: device.name,
                device_type: device.type,
            })
            toast({
                title: "Устройство добавлено",
                description: `${device.name} добавлено в ${selectedRoom.name}`,
                duration: 2000,
            })
            setSelectedNewDevice("")
            setShowAddDevice(false)
            // Refresh
            handleSelectRoom(selectedRoom)
        } catch (err: any) {
            toast({
                title: "Ошибка",
                description: err.response?.data?.message || "Не удалось добавить устройство",
                variant: "destructive",
                duration: 3000,
            })
        } finally {
            setIsAddingDevice(false)
        }
    }

    const handleDeleteDevice = async (roomDevice: RoomDevice) => {
        try {
            setIsDeletingDevice(roomDevice.id)
            await deleteRoomDevice(roomDevice.id)
            toast({
                title: "Устройство удалено",
                description: `${roomDevice.device_name} удалено`,
                duration: 2000,
            })
            if (selectedRoom) handleSelectRoom(selectedRoom)
        } catch (err: any) {
            toast({
                title: "Ошибка",
                description: err.response?.data?.message || "Не удалось удалить устройство",
                variant: "destructive",
                duration: 3000,
            })
        } finally {
            setIsDeletingDevice(null)
        }
    }

    // --- Add/Remove employee ---
    const handleAddEmployee = async () => {
        if (!selectedNewEmployee || !selectedRoom) return

        try {
            setIsAddingEmployee(true)
            await createClientRoomSubscription({
                client_id: selectedNewEmployee as number,
                meeting_room_id: selectedRoom.id,
            })
            const user = allUsers.find((u) => u.id === selectedNewEmployee)
            toast({
                title: "Сотрудник добавлен",
                description: `${user?.full_name || "Сотрудник"} получил доступ`,
                duration: 2000,
            })
            setSelectedNewEmployee("")
            setShowAddEmployee(false)
            if (selectedRoom) handleSelectRoom(selectedRoom)
        } catch (err: any) {
            toast({
                title: "Ошибка",
                description: err.response?.data?.message || "Не удалось добавить сотрудника",
                variant: "destructive",
                duration: 3000,
            })
        } finally {
            setIsAddingEmployee(false)
        }
    }

    const handleDeleteSubscription = async (sub: ClientRoomSubscription) => {
        try {
            setIsDeletingSub(sub.id)
            await deleteClientRoomSubscription(sub.id)
            const name = (sub.subscribedClient || sub.client)?.full_name || "Сотрудник"
            toast({
                title: "Доступ забран",
                description: `У ${name} забран доступ`,
                duration: 2000,
            })
            if (selectedRoom) handleSelectRoom(selectedRoom)
        } catch (err: any) {
            toast({
                title: "Ошибка",
                description: err.response?.data?.message || "Не удалось удалить доступ",
                variant: "destructive",
                duration: 3000,
            })
        } finally {
            setIsDeletingSub(null)
        }
    }

    // --- Available devices (not yet linked to this room) ---
    const getAvailableDevices = () => {
        const linkedIds = roomLinkedDevices.map((rd) => rd.device_id)
        return allYandexDevices.filter((d) => !linkedIds.includes(d.id))
    }

    // --- Available employees (not yet subscribed to this room) ---
    const getAvailableEmployees = () => {
        const subscribedIds = roomSubscriptions.map((s) => s.client_id)
        // For cabinets show employees (non-clients), for meeting rooms show clients
        const isCabinet = selectedRoom?.room_type === "cabinet"
        let filtered = isCabinet
            ? allUsers.filter((u) => u.role !== "client")
            : allUsers.filter((u) => u.role === "client")
        filtered = filtered.filter((u) => !subscribedIds.includes(u.id))
        if (employeeFilter.trim()) {
            const q = employeeFilter.toLowerCase()
            filtered = filtered.filter(
                (u) =>
                    u.full_name.toLowerCase().includes(q) ||
                    u.phone.includes(q)
            )
        }
        return filtered
    }

    // --- Find YandexDevice by device_id from linked devices ---
    const findYandexDevice = (deviceId: string): YandexDevice | undefined => {
        return roomYandexDevices.find((d) => d.id === deviceId)
    }

    // ============================================================
    // RENDER: Step 1 – Office Selection
    // ============================================================
    if (step === "offices") {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${iconBg}`}>
                        <Home className={`w-5 h-5 ${iconCl}`} />
                    </div>
                    <div>
                        <h2 className={`text-lg font-semibold ${titleCl}`}>Управление умным домом</h2>
                        <p className={`text-sm ${mutedCl}`}>Выберите офис для управления устройствами</p>
                    </div>
                </div>

                {loadingOffices ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className={`w-6 h-6 animate-spin ${loaderCl}`} />
                        <span className={`ml-2 text-sm ${mutedCl}`}>Загрузка офисов...</span>
                    </div>
                ) : offices.length === 0 ? (
                    <div className={`text-center py-12 text-sm ${mutedCl}`}>
                        Нет доступных офисов
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {offices.map((office) => (
                            <button
                                key={office.id}
                                onClick={() => handleSelectOffice(office)}
                                className={`flex items-center gap-4 p-4 border rounded-xl transition-all text-left group ${cardBg} ${cardBorder} ${cardHover}`}
                            >
                                <div className={`p-3 rounded-xl transition-colors ${d ? "bg-white/10 group-hover:bg-[#E85D2B]/20" : "bg-gray-100 group-hover:bg-blue-100"}`}>
                                    <Building2 className={`w-6 h-6 transition-colors ${d ? "text-white/80 group-hover:text-[#E85D2B]" : "text-gray-600 group-hover:text-blue-600"}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium truncate ${titleCl}`}>{office.name}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <MapPin className={`w-3 h-3 flex-shrink-0 ${mutedCl}`} />
                                        <p className={`text-xs truncate ${mutedCl}`}>{office.address}, {office.city}</p>
                                    </div>
                                </div>
                                <ChevronDown className={`w-4 h-4 -rotate-90 transition-colors ${d ? "text-white/50 group-hover:text-[#E85D2B]" : "text-gray-400 group-hover:text-blue-500"}`} />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // ============================================================
    // RENDER: Step 2 – Cabinets/Rooms List + Detail Panel
    // ============================================================
    return (
        <div className="space-y-0">
            {/* Back button + office header */}
            <div className="flex items-center gap-3 mb-4">
                <button
                    onClick={handleBackToOffices}
                    className={`p-2 rounded-lg transition-colors ${btnGhost}`}
                >
                    <ChevronLeft className={`w-5 h-5 ${d ? "text-white/80" : "text-gray-600"}`} />
                </button>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${iconBg}`}>
                        <Building2 className={`w-5 h-5 ${iconCl}`} />
                    </div>
                    <div>
                        <h2 className={`text-lg font-semibold ${titleCl}`}>{selectedOffice?.name}</h2>
                        <p className={`text-sm ${mutedCl}`}>Кабинеты и переговорные комнаты</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
                {/* Sidebar – Room List */}
                <div className="lg:w-64 flex-shrink-0">
                    <div className={`${sidebarBg} border ${cardBorder} rounded-xl overflow-hidden`}>
                        <div className={`px-4 py-3 border-b ${sidebarHeadBg}`}>
                            <h3 className={`text-sm font-semibold ${sidebarHeadText}`}>Кабинеты</h3>
                        </div>

                        {loadingRooms ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className={`w-5 h-5 animate-spin ${loaderCl}`} />
                            </div>
                        ) : rooms.length === 0 ? (
                            <div className={`p-4 text-center text-sm ${mutedCl}`}>
                                Нет кабинетов в этом офисе
                            </div>
                        ) : (
                            <div className="max-h-[500px] overflow-y-auto">
                                {rooms.map((room) => {
                                    const isSelected = selectedRoom?.id === room.id
                                    return (
                                        <button
                                            key={room.id}
                                            onClick={() => handleSelectRoom(room)}
                                            className={`w-full text-left px-4 py-3 border-b last:border-b-0 flex items-center gap-3 transition-colors ${
                                                d ? "border-white/5" : "border-gray-100"
                                            } ${isSelected ? `${roomItemSelected} border-l-[3px]` : `${roomItemHover} border-l-[3px] border-l-transparent`}`}
                                        >
                                            <DoorOpen
                                                className={`w-4 h-4 flex-shrink-0 ${
                                                    isSelected ? iconCl : loaderCl
                                                }`}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={`text-sm font-medium truncate ${
                                                        isSelected ? roomItemTextSelected : roomItemText
                                                    }`}
                                                >
                                                    {room.name}
                                                </p>
                                                <p className={`text-[11px] ${emptyCl}`}>
                                                    Этаж {room.floor}
                                                    {room.capacity ? ` • до ${room.capacity} чел.` : ""}
                                                </p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content – Room Detail */}
                <div className="flex-1 min-w-0">
                    {!selectedRoom ? (
                        <div className={`${cardBg} border ${cardBorder} rounded-xl flex items-center justify-center py-16`}>
                            <div className="text-center">
                                <Settings2 className={`w-12 h-12 mx-auto mb-3 ${emptyCl}`} />
                                <p className={`${mutedCl} text-sm`}>Выберите кабинет для управления</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Room Header */}
                            <div className={`${cardBg} border ${cardBorder} rounded-xl px-5 py-4`}>
                                <h3 className={`text-base font-bold ${titleCl}`}>
                                    {selectedRoom.name}{" "}
                                    <span className={`font-normal ${mutedCl}`}>({selectedOffice?.name})</span>
                                </h3>
                                <p className={`text-sm ${mutedCl} mt-0.5`}>
                                    Офис: {selectedOffice?.name} &bull; Этаж: {selectedRoom.floor}-й
                                </p>
                            </div>

                            {/* ===== Devices Section ===== */}
                            <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden`}>
                                <button
                                    onClick={() => setDevicesExpanded(!devicesExpanded)}
                                    className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${btnGhost}`}
                                >
                                    <h4 className={`text-sm font-semibold ${rowText}`}>Устройства в кабинете</h4>
                                    <ChevronDown
                                        className={`w-5 h-5 transition-transform ${loaderCl} ${
                                            devicesExpanded ? "" : "-rotate-90"
                                        }`}
                                    />
                                </button>

                                {devicesExpanded && (
                                    <div className="px-5 pb-4">
                                        {loadingDevices ? (
                                            <div className="flex items-center justify-center py-6">
                                                <Loader2 className={`w-5 h-5 animate-spin ${loaderCl}`} />
                                                <span className={`ml-2 text-sm ${mutedCl}`}>Загрузка устройств...</span>
                                            </div>
                                        ) : roomLinkedDevices.length === 0 && !showAddDevice ? (
                                            <p className={`text-sm py-3 ${emptyCl}`}>Нет устройств в этом кабинете</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {roomLinkedDevices.map((rd) => {
                                                    const yDevice = findYandexDevice(rd.device_id)
                                                    const isOn = yDevice ? getDeviceState(yDevice) : null
                                                    const isControllingThis = isControlling === rd.device_id
                                                    const isDeletingThis = isDeletingDevice === rd.id
                                                    const DeviceIcon = getDeviceIcon(rd.device_type, rd.device_name)

                                                    return (
                                                        <div
                                                            key={rd.id}
                                                            className={`flex items-center justify-between py-3 px-3 rounded-lg border ${rowBg}`}
                                                        >
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                <DeviceIcon
                                                                    className={`w-5 h-5 flex-shrink-0 ${
                                                                        isOn ? "text-yellow-500" : loaderCl
                                                                    }`}
                                                                />
                                                                <span className={`text-sm font-medium truncate ${rowText}`}>
                                                                    {rd.device_name}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                {yDevice && isOn !== null && (
                                                                    <button
                                                                        onClick={() => handleToggleDevice(yDevice)}
                                                                        disabled={isControllingThis}
                                                                        className={`relative w-12 h-6 rounded-full transition-colors ${
                                                                            isOn ? (d ? "bg-[#E85D2B]" : "bg-blue-500") : (d ? "bg-white/20" : "bg-gray-300")
                                                                        } ${isControllingThis ? "opacity-50" : ""}`}
                                                                    >
                                                                        {isControllingThis ? (
                                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                                                            </div>
                                                                        ) : (
                                                                            <div
                                                                                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                                                                    isOn ? "translate-x-[26px]" : "translate-x-0.5"
                                                                                }`}
                                                                            />
                                                                        )}
                                                                    </button>
                                                                )}

                                                                <button
                                                                    onClick={() => handleDeleteDevice(rd)}
                                                                    disabled={isDeletingThis}
                                                                    className={`p-1.5 rounded-lg transition-colors ${btnGhost}`}
                                                                >
                                                                    {isDeletingThis ? (
                                                                        <Loader2 className={`w-4 h-4 animate-spin ${loaderCl}`} />
                                                                    ) : (
                                                                        <Trash2 className={`w-4 h-4 ${d ? "text-white/50 hover:text-red-400" : "text-gray-400 hover:text-red-500"}`} />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        {showAddDevice ? (
                                            <div className={`mt-3 p-3 rounded-lg border space-y-3 ${addFormBg}`}>
                                                <p className={`text-sm font-medium ${addFormText}`}>Добавить устройство</p>
                                                <select
                                                    value={selectedNewDevice}
                                                    onChange={(e) => setSelectedNewDevice(e.target.value)}
                                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none ${addFormInput}`}
                                                >
                                                    <option value="">Выберите устройство</option>
                                                    {getAvailableDevices().map((dev) => (
                                                        <option key={dev.id} value={dev.id}>
                                                            {dev.name} {dev.type ? `(${dev.type.replace("devices.types.", "")})` : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleAddDevice}
                                                        disabled={!selectedNewDevice || isAddingDevice}
                                                        className={`flex-1 text-sm font-medium py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${btnPrimary}`}
                                                    >
                                                        {isAddingDevice ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Plus className="w-4 h-4" />
                                                        )}
                                                        Добавить
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowAddDevice(false)
                                                            setSelectedNewDevice("")
                                                        }}
                                                        className={`px-4 py-2 text-sm rounded-lg ${btnCancel}`}
                                                    >
                                                        Отмена
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowAddDevice(true)}
                                                className={`mt-3 w-full py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${btnPrimary}`}
                                            >
                                                <Plus className="w-4 h-4" />
                                                Добавить устройство
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ===== Employee Access Section ===== */}
                            <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden`}>
                                <button
                                    onClick={() => setAccessExpanded(!accessExpanded)}
                                    className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${btnGhost}`}
                                >
                                    <h4 className={`text-sm font-semibold ${rowText}`}>Доступы сотрудников</h4>
                                    <ChevronDown
                                        className={`w-5 h-5 transition-transform ${loaderCl} ${
                                            accessExpanded ? "" : "-rotate-90"
                                        }`}
                                    />
                                </button>

                                {accessExpanded && (
                                    <div className="px-5 pb-4">
                                        {roomSubscriptions.length > 0 && (
                                            <div className="relative mb-3">
                                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${loaderCl}`} />
                                                <input
                                                    type="text"
                                                    placeholder="Показать фильтру"
                                                    value={employeeFilter}
                                                    onChange={(e) => setEmployeeFilter(e.target.value)}
                                                    className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none ${d ? "bg-[#1A1A1A] border-white/10 text-white placeholder:text-white/40 focus:border-[#E85D2B]" : "border-gray-200 bg-gray-50 focus:border-blue-400"}`}
                                                />
                                            </div>
                                        )}

                                        {loadingSubscriptions ? (
                                            <div className="flex items-center justify-center py-6">
                                                <Loader2 className={`w-5 h-5 animate-spin ${loaderCl}`} />
                                                <span className={`ml-2 text-sm ${mutedCl}`}>Загрузка...</span>
                                            </div>
                                        ) : roomSubscriptions.length === 0 && !showAddEmployee ? (
                                            <p className={`text-sm py-3 ${emptyCl}`}>Нет сотрудников с доступом</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {roomSubscriptions
                                                    .filter((sub) => {
                                                        if (!employeeFilter.trim()) return true
                                                        const name = ((sub.subscribedClient || sub.client)?.full_name || "").toLowerCase()
                                                        return name.includes(employeeFilter.toLowerCase())
                                                    })
                                                    .map((sub) => {
                                                        const name = (sub.subscribedClient || sub.client)?.full_name || `Сотрудник ID: ${sub.client_id}`
                                                        const isDeletingThis = isDeletingSub === sub.id

                                                        return (
                                                            <div
                                                                key={sub.id}
                                                                className={`flex items-center justify-between py-3 px-3 rounded-lg border ${rowBg}`}
                                                            >
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${userAvatarBg}`}>
                                                                        <Users className={`w-4 h-4 ${userAvatarIcon}`} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className={`text-sm font-medium truncate ${rowText}`}>
                                                                            {name}
                                                                        </p>
                                                                        <p className={`text-[11px] ${accessLabel}`}>Доступ активен</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDeleteSubscription(sub)}
                                                                    disabled={isDeletingThis}
                                                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 border ${btnRemove}`}
                                                                >
                                                                    {isDeletingThis ? (
                                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                                    ) : (
                                                                        "Забрать доступ"
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )
                                                    })}
                                            </div>
                                        )}

                                        {showAddEmployee ? (
                                            <div className={`mt-3 p-3 rounded-lg border space-y-3 ${addFormGreenBg}`}>
                                                <p className={`text-sm font-medium ${addFormGreenText}`}>Добавить сотрудника</p>
                                                <select
                                                    value={selectedNewEmployee === "" ? "" : selectedNewEmployee.toString()}
                                                    onChange={(e) =>
                                                        setSelectedNewEmployee(
                                                            e.target.value === "" ? "" : parseInt(e.target.value)
                                                        )
                                                    }
                                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none ${addFormGreenInput}`}
                                                >
                                                    <option value="">Выберите сотрудника</option>
                                                    {getAvailableEmployees().map((u) => (
                                                        <option key={u.id} value={u.id}>
                                                            {u.full_name} ({u.phone})
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleAddEmployee}
                                                        disabled={!selectedNewEmployee || isAddingEmployee}
                                                        className={`flex-1 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${btnGreen}`}
                                                    >
                                                        {isAddingEmployee ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <UserPlus className="w-4 h-4" />
                                                        )}
                                                        Добавить
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowAddEmployee(false)
                                                            setSelectedNewEmployee("")
                                                        }}
                                                        className={`px-4 py-2 text-sm rounded-lg ${btnCancel}`}
                                                    >
                                                        Отмена
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowAddEmployee(true)}
                                                className={`mt-3 w-full py-2.5 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${btnGreen}`}
                                            >
                                                <Plus className="w-4 h-4" />
                                                Добавить сотрудника
                                            </button>
                                        )}

                                        {roomSubscriptions.length > 0 && (
                                            <p className={`mt-3 text-xs ${mutedCl}`}>
                                                Показаны {roomSubscriptions.length} из {roomSubscriptions.length} сотрудников
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
