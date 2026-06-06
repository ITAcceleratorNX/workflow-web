"use client";

import { ChevronDown, Info, Link2Off, Loader2 } from "lucide-react";
import { formatYandexTokenExpiresAt } from "@/lib/yandex-smart-home-utils";
import {
  useYandexSmartHomeAdmin,
  type UseYandexSmartHomeAdminResult,
} from "@/hooks/use-yandex-smart-home-admin";

type SmartHomeAdminMobileViewProps = UseYandexSmartHomeAdminResult;

function AdminCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-[#2C2C2E] p-4 mb-4">
      <h2 className="text-[17px] font-semibold text-white mb-1">{title}</h2>
      {subtitle ? <p className="text-sm text-[#8E8E93] leading-[21px] mb-3">{subtitle}</p> : null}
      {children}
    </section>
  );
}

function SelectTrigger({
  label,
  value,
  placeholder,
  open,
  onToggle,
  disabled,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <>
      <p className="text-sm font-medium text-[#8E8E93] mb-2">{label}</p>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="w-full flex items-center justify-between rounded-[10px] border border-white/10 bg-[#2C2C2E] px-3.5 py-3 mb-2 text-left disabled:opacity-50"
      >
        <span className={`text-base ${value ? "text-white" : "text-[#8E8E93]"}`}>
          {value ?? placeholder}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-[#8E8E93] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
    </>
  );
}

function DropdownItem({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-3.5 py-3 text-left text-base text-white ${
        active ? "bg-[#E25B21]/20" : "hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

/** Mobile admin smart home — parity с workflow-mobile app/admin-worker/smart-home.tsx */
export function SmartHomeAdminMobileView(props: SmartHomeAdminMobileViewProps) {
  const {
    tokensMeta,
    isLoading: tokensLoading,
    error: tokensError,
    tokenAction,
    handleRefreshTokens,
    handleDeleteTokens,
    offices,
    officesLoading,
    selectedOfficeId,
    selectedOffice,
    showOfficeDropdown,
    setShowOfficeDropdown,
    selectOffice,
    rooms,
    roomsLoading,
    groupedByRoom,
    linksLoading,
    devicesListLoading,
    showRoomDropdown,
    setShowRoomDropdown,
    showDeviceDropdown,
    setShowDeviceDropdown,
    selectedRoomId,
    setSelectedRoomId,
    selectedRoomName,
    selectedDevice,
    setSelectedDevice,
    isLinking,
    deletingLinkId,
    linkError,
    loadYandexDevices,
    handleAddDeviceToRoom,
    handleUnlink,
    subscriptionsForOffice,
    subscriptionsLoading,
    officeUsers,
    officeUsersLoading,
    selectedRoomIdForSub,
    setSelectedRoomIdForSub,
    selectedRoomNameForSub,
    selectedUserIdForSub,
    setSelectedUserIdForSub,
    selectedUserNameForSub,
    showRoomSubDropdown,
    setShowRoomSubDropdown,
    showUserSubDropdown,
    setShowUserSubDropdown,
    isCreatingSub,
    subError,
    deletingSubId,
    handleCreateSubscription,
    handleDeleteSubscription,
    availableYandexDevices,
    yandexDevices,
  } = props;

  return (
    <div className="space-y-0 pb-6">
      <p className="text-sm text-[#8E8E93] mb-4 leading-[21px]">
        Токены Яндекс, привязка устройств к переговорным и доступ пользователей из приложения.
      </p>

      <AdminCard
        title="Токены Яндекс"
        subtitle="Токены настраиваются в веб-версии через OAuth. Здесь можно обновить или удалить."
      >
        {tokensLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-[#E25B21] mx-auto my-2" />
        ) : tokensError ? (
          <div className="rounded-[10px] border border-red-500 bg-red-500/10 p-3">
            <p className="text-sm text-red-400">{tokensError}</p>
          </div>
        ) : tokensMeta ? (
          <>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-[#8E8E93]">Статус</span>
              <span className="text-sm text-white">Токены настроены</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-[#8E8E93]">Срок действия</span>
              <span className="text-sm text-white">
                {formatYandexTokenExpiresAt(tokensMeta.expires_at)}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void handleRefreshTokens()}
                disabled={!!tokenAction}
                className="flex-1 min-h-[44px] rounded-[10px] bg-[#E25B21] text-white font-semibold disabled:opacity-50 flex items-center justify-center"
              >
                {tokenAction === "refresh" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Обновить токены"
                )}
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteTokens()}
                disabled={!!tokenAction}
                className="flex-1 min-h-[44px] rounded-[10px] bg-red-500 text-white font-semibold disabled:opacity-50 flex items-center justify-center"
              >
                {tokenAction === "delete" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Удалить токены"
                )}
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#8E8E93]">Токены не настроены. Добавьте их в веб-версии.</p>
        )}
      </AdminCard>

      <AdminCard
        title="Офис"
        subtitle="Сначала выберите офис, затем управляйте привязкой устройств к переговорным этого офиса."
      >
        {officesLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-[#E25B21] mx-auto my-2" />
        ) : (
          <>
            <SelectTrigger
              label="Выберите офис"
              value={
                selectedOffice
                  ? `${selectedOffice.name}${selectedOffice.city ? ` · ${selectedOffice.city}` : ""}`
                  : null
              }
              placeholder="Выберите офис"
              open={showOfficeDropdown}
              onToggle={() => setShowOfficeDropdown((value) => !value)}
            />
            {showOfficeDropdown ? (
              <div className="rounded-[10px] border border-white/10 overflow-hidden mb-2">
                <DropdownItem active={selectedOfficeId == null} onClick={() => selectOffice(null)}>
                  Не выбран
                </DropdownItem>
                {offices.map((office) => (
                  <DropdownItem
                    key={office.id}
                    active={office.id === selectedOfficeId}
                    onClick={() => selectOffice(office.id)}
                  >
                    {office.name}
                    {office.city ? ` · ${office.city}` : ""}
                  </DropdownItem>
                ))}
              </div>
            ) : null}
          </>
        )}
      </AdminCard>

      <AdminCard
        title="Комнаты и устройства"
        subtitle="Устройства Яндекс и привязка к комнатам выбранного офиса."
      >
        {selectedOfficeId == null ? (
          <p className="text-sm italic text-[#8E8E93] my-2">Сначала выберите офис выше.</p>
        ) : linksLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-[#E25B21] mx-auto my-2" />
        ) : (
          <>
            {selectedOffice ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8E8E93] mb-2">
                Офис: {selectedOffice.name}
              </p>
            ) : null}

            {groupedByRoom.length > 0 ? (
              <div className="mb-4">
                {groupedByRoom.map(({ roomId, roomName, links }) => (
                  <div key={roomId} className="mb-3">
                    <p className="text-[15px] font-semibold text-white mb-1.5">{roomName}</p>
                    {links.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2.5 mb-1.5"
                      >
                        <span className="text-[15px] text-white truncate flex-1">{link.device_name}</span>
                        <button
                          type="button"
                          onClick={() => void handleUnlink(link.id)}
                          disabled={deletingLinkId === link.id}
                          className="w-9 h-9 rounded-lg bg-red-500 flex items-center justify-center disabled:opacity-50"
                          aria-label="Отвязать устройство"
                        >
                          {deletingLinkId === link.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                          ) : (
                            <Link2Off className="h-[18px] w-[18px] text-white" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-[#8E8E93] my-2">
                Нет привязанных устройств. Добавьте устройство ниже.
              </p>
            )}

            <p className="text-sm font-semibold text-[#8E8E93] mt-4 mb-2">Добавить устройство в комнату</p>
            <SelectTrigger
              label="Комната"
              value={selectedRoomName}
              placeholder={roomsLoading ? "Загрузка комнат..." : "Выберите комнату"}
              open={showRoomDropdown}
              onToggle={() => rooms.length > 0 && setShowRoomDropdown((value) => !value)}
              disabled={rooms.length === 0}
            />
            {showRoomDropdown ? (
              <div className="rounded-[10px] border border-white/10 overflow-hidden mb-2">
                {rooms.length === 0 ? (
                  <p className="px-3.5 py-3 text-base text-[#8E8E93]">В этом офисе нет переговорных</p>
                ) : (
                  rooms.map((room) => (
                    <DropdownItem
                      key={room.id}
                      active={room.id === selectedRoomId}
                      onClick={() => {
                        setSelectedRoomId(room.id);
                        setShowRoomDropdown(false);
                      }}
                    >
                      {room.name}
                    </DropdownItem>
                  ))
                )}
              </div>
            ) : null}

            {selectedRoomId ? (
              <>
                <SelectTrigger
                  label="Устройство"
                  value={selectedDevice?.name ?? null}
                  placeholder={
                    devicesListLoading
                      ? "Загрузка устройств..."
                      : showDeviceDropdown && availableYandexDevices.length === 0
                        ? "Нет доступных устройств"
                        : "Выберите устройство"
                  }
                  open={showDeviceDropdown}
                  onToggle={() => {
                    if (!devicesListLoading && yandexDevices.length === 0) void loadYandexDevices();
                    setShowDeviceDropdown((value) => !value);
                  }}
                />
                {showDeviceDropdown ? (
                  <div className="rounded-[10px] border border-white/10 overflow-hidden mb-2">
                    {!devicesListLoading && yandexDevices.length === 0 ? (
                      <DropdownItem onClick={() => void loadYandexDevices()}>
                        Загрузить список устройств
                      </DropdownItem>
                    ) : null}
                    {availableYandexDevices.map((device) => (
                      <DropdownItem
                        key={device.id}
                        active={device.id === selectedDevice?.id}
                        onClick={() => {
                          setSelectedDevice(device);
                          setShowDeviceDropdown(false);
                        }}
                      >
                        {device.name}
                      </DropdownItem>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}

            {linkError ? (
              <div className="rounded-[10px] border border-red-500 bg-red-500/10 p-3 mt-2">
                <p className="text-sm text-red-400">{linkError}</p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleAddDeviceToRoom()}
              disabled={!selectedRoomId || !selectedDevice || isLinking}
              className="w-full mt-3 min-h-[44px] rounded-[10px] bg-[#E25B21] text-white font-semibold disabled:opacity-50 flex items-center justify-center"
            >
              {isLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Привязать к комнате"}
            </button>
          </>
        )}
      </AdminCard>

      <AdminCard
        title="Доступ к управлению умным офисом"
        subtitle="Привяжите клиента или сотрудника к комнате (кабинету). Управление устройствами станет доступно в приложении."
      >
        {selectedOfficeId == null ? (
          <p className="text-sm italic text-[#8E8E93] my-2">Сначала выберите офис выше.</p>
        ) : (
          <>
            <div className="flex items-start gap-2.5 rounded-[10px] border border-blue-500/50 bg-blue-500/10 p-3 mb-4">
              <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] leading-5 text-blue-300">
                Пользователь, привязанный к комнате, сможет управлять светом и другими устройствами умного
                офиса в этой комнате из приложения.
              </p>
            </div>

            {subscriptionsLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#E25B21] mx-auto my-2" />
            ) : subscriptionsForOffice.length > 0 ? (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8E8E93] mb-2">
                  Кто привязан к комнатам
                </p>
                {subscriptionsForOffice.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2.5 mb-1.5"
                  >
                    <span className="text-[15px] text-white truncate flex-1">
                      {sub.subscribedClient?.full_name ?? `Пользователь #${sub.client_id}`} —{" "}
                      {sub.meetingRoom?.name ?? `Комната #${sub.meeting_room_id}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDeleteSubscription(sub.id)}
                      disabled={deletingSubId === sub.id}
                      className="w-9 h-9 rounded-lg bg-red-500 flex items-center justify-center disabled:opacity-50"
                      aria-label="Удалить доступ"
                    >
                      {deletingSubId === sub.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <Link2Off className="h-[18px] w-[18px] text-white" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <p className="text-sm font-semibold text-[#8E8E93] mt-4 mb-2">Привязать пользователя к комнате</p>
            <SelectTrigger
              label="Комната / кабинет"
              value={selectedRoomNameForSub}
              placeholder={roomsLoading ? "Загрузка..." : "Выберите комнату"}
              open={showRoomSubDropdown}
              onToggle={() => rooms.length > 0 && setShowRoomSubDropdown((value) => !value)}
              disabled={rooms.length === 0}
            />
            {showRoomSubDropdown ? (
              <div className="rounded-[10px] border border-white/10 overflow-hidden mb-2">
                {rooms.length === 0 ? (
                  <p className="px-3.5 py-3 text-base text-[#8E8E93]">В этом офисе нет переговорных</p>
                ) : (
                  rooms.map((room) => (
                    <DropdownItem
                      key={room.id}
                      active={room.id === selectedRoomIdForSub}
                      onClick={() => {
                        setSelectedRoomIdForSub(room.id);
                        setShowRoomSubDropdown(false);
                      }}
                    >
                      {room.name}
                    </DropdownItem>
                  ))
                )}
              </div>
            ) : null}

            <SelectTrigger
              label="Клиент или сотрудник"
              value={selectedUserNameForSub}
              placeholder={officeUsersLoading ? "Загрузка..." : "Выберите пользователя"}
              open={showUserSubDropdown}
              onToggle={() => setShowUserSubDropdown((value) => !value)}
            />
            {showUserSubDropdown ? (
              <div className="rounded-[10px] border border-white/10 overflow-hidden mb-2">
                {officeUsers.length === 0 && !officeUsersLoading ? (
                  <p className="px-3.5 py-3 text-base text-[#8E8E93]">Нет пользователей в этом офисе</p>
                ) : (
                  officeUsers.map((user) => (
                    <DropdownItem
                      key={user.id}
                      active={user.id === selectedUserIdForSub}
                      onClick={() => {
                        setSelectedUserIdForSub(user.id);
                        setShowUserSubDropdown(false);
                      }}
                    >
                      {user.full_name}
                      {user.role ? ` · ${user.role}` : ""}
                    </DropdownItem>
                  ))
                )}
              </div>
            ) : null}

            {subError ? (
              <div className="rounded-[10px] border border-red-500 bg-red-500/10 p-3 mt-2">
                <p className="text-sm text-red-400">{subError}</p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleCreateSubscription()}
              disabled={!selectedRoomIdForSub || !selectedUserIdForSub || isCreatingSub}
              className="w-full mt-3 min-h-[44px] rounded-[10px] bg-[#E25B21] text-white font-semibold disabled:opacity-50 flex items-center justify-center"
            >
              {isCreatingSub ? <Loader2 className="h-4 w-4 animate-spin" /> : "Привязать к комнате"}
            </button>
          </>
        )}
      </AdminCard>

      <p className="text-xs italic text-[#8E8E93] mt-2 mb-2">
        Полная настройка сценариев и OAuth — в веб-версии.
      </p>
    </div>
  );
}

export function SmartHomeAdminMobileScreen() {
  const state = useYandexSmartHomeAdmin();
  return <SmartHomeAdminMobileView {...state} />;
}
