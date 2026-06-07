"use client";

import { ChevronDown, Home, Lightbulb, Loader2, Power } from "lucide-react";
import { PageLoader } from "@/components/ui/page-loader";
import { ScreenHeader } from "@/components/ui/screen-header";
import type { UseClientSmartHomeResult } from "@/hooks/use-client-smart-home";

type ClientSmartHomeMobileViewProps = UseClientSmartHomeResult;

/** Mobile client smart home — parity с workflow-mobile app/client/smart-home.tsx. */
export function ClientSmartHomeMobileView({
  subscriptions,
  selectedRoom,
  controllableDevices,
  isLoadingDevices,
  isControlling,
  showRoomSelector,
  loading,
  getDeviceState,
  handleControlDevice,
  selectRoom,
  toggleRoomSelector,
}: ClientSmartHomeMobileViewProps) {
  if (loading && subscriptions.length === 0) {
    return (
      <>
        <div
          className="min-h-screen bg-background flex items-center justify-center"
          
        >
          <PageLoader size={96} />
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="min-h-screen bg-background"
        
      >
        <ScreenHeader
          title="Управление умным офисом"
          titleClassName="text-2xl font-bold tracking-tight"
        />

        <div className="px-4 pt-3 pb-6">
          {subscriptions.length === 0 ? (
            <>
              <div className="flex flex-col items-center justify-center py-16">
                <Home className="h-16 w-16 text-[#8E8E93] mb-4" />
                <p className="text-base font-semibold text-white">Нет подписок на комнаты</p>
                <p className="text-sm text-[#8E8E93] mt-1">Обратитесь к администратору</p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-3">
                <h2 className="text-[17px] font-bold text-white mb-2.5 tracking-tight">
                  Выберите комнату
                </h2>
                <button
                  type="button"
                  onClick={toggleRoomSelector}
                  aria-expanded={showRoomSelector}
                  aria-label="Выбор комнаты"
                  className="w-full rounded-2xl bg-[#E25B21] px-5 py-[18px] min-h-[92px] text-left active:opacity-90 transition-opacity"
                >
                  <div className="flex items-center justify-between gap-3 min-h-[72px]">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-[17px] font-bold text-white leading-[22px] line-clamp-2">
                        {selectedRoom?.meetingRoom?.name || "Выберите комнату"}
                      </p>
                      <p className="text-sm text-white/90 mt-1.5 line-clamp-2">
                        {selectedRoom?.meetingRoom?.office?.name || "Нажмите, чтобы открыть список"}
                      </p>
                    </div>
                    <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <ChevronDown
                        className={`w-6 h-6 text-white transition-transform ${showRoomSelector ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                </button>

                {showRoomSelector && (
                  <div className="mt-2 rounded-xl bg-[#E25B21] overflow-hidden">
                    {subscriptions.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => selectRoom(sub.meeting_room_id)}
                        className={`w-full px-5 py-3.5 text-left text-base text-white hover:bg-white/10 transition-colors ${
                          selectedRoom?.meeting_room_id === sub.meeting_room_id ? "bg-white/20" : ""
                        }`}
                      >
                        {sub.meetingRoom?.name || `Комната ID: ${sub.meeting_room_id}`}
                        {sub.meetingRoom?.office ? ` (${sub.meetingRoom.office.name})` : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <h2 className="text-[17px] font-bold text-white mb-2.5 tracking-tight">
                Устройства в кабинете
              </h2>

              <div className="relative">
                {isLoadingDevices && controllableDevices.length === 0 ? (
                  <div className="h-32 rounded-2xl bg-[#E25B21]/55" />
                ) : controllableDevices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Lightbulb className="h-16 w-16 text-[#8E8E93] mb-4" />
                    <p className="text-base font-semibold text-white">Нет доступных устройств</p>
                    <p className="text-sm text-[#8E8E93] mt-1">В этой комнате нет устройств</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {controllableDevices.map((device) => {
                      const isOn = getDeviceState(device);
                      const isControllingThis = isControlling === device.id;
                      const cardBg = isOn ? "#22c55e" : "#E25B21";

                      return (
                        <button
                          key={device.id}
                          type="button"
                          onClick={() => handleControlDevice(device, !isOn)}
                          disabled={isControllingThis || isOn === null}
                          className="rounded-2xl p-[18px] min-h-[124px] text-left flex flex-col justify-between active:scale-[0.98] transition-all disabled:opacity-50"
                          style={{ background: cardBg }}
                          aria-label={`${device.name}, ${isOn ? "включено" : "выключено"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="flex-1 text-[15px] font-semibold text-white leading-5 line-clamp-2 pt-0.5">
                              {device.name}
                            </p>
                            <div
                              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                                isOn ? "bg-white/30" : "bg-white/20"
                              }`}
                            >
                              {isControllingThis ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                              ) : (
                                <Power
                                  className={`w-6 h-6 ${isOn ? "text-white" : "text-white/65"}`}
                                />
                              )}
                            </div>
                          </div>
                          <p className="text-[13px] font-semibold text-white/90 mt-3">
                            {isControllingThis ? "Загрузка..." : isOn ? "Включено" : "Выключено"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {isLoadingDevices && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PageLoader size={80} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
