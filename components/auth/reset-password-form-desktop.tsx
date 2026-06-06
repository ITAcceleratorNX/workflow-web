"use client";

import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  RESET_PASSWORD_STEP_SUBTITLES,
  RESET_PASSWORD_STEP_TITLES,
  RESET_PASSWORD_SUCCESS_MESSAGE,
} from "@/constants/reset-password";
import type { UseResetPasswordResult } from "@/hooks/use-reset-password";

/** Desktop reset password — pixel-parity с прежним app/reset-password/page.tsx */
export function ResetPasswordFormDesktop(props: UseResetPasswordResult) {
  const {
    step,
    phone,
    verificationCode,
    setVerificationCode,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    isSendingCode,
    countdown,
    error,
    setError,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handlePhoneChange,
    handleSendVerificationCode,
    handleVerifyCode,
    handleResendCode,
    handleResetPassword,
    goBackToPhone,
    goBackToOtp,
  } = props;

  const otpSlotClass =
    "h-12 w-12 bg-gray-900 border-2 border-gray-700 text-white text-lg font-semibold rounded-xl transition-all duration-200 hover:border-gray-600 focus:border-[#F35713] focus:ring-2 focus:ring-[#F35713]/20 first:rounded-l-xl first:border-l-2 last:rounded-r-xl";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center space-x-3 mb-5">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden">
              <img src="/app-icon.png" alt="App Icon" className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-bold text-3xl tracking-tight">WORKFLOW</span>
          </div>
        </div>

        <Card className="border border-gray-800 shadow-2xl bg-black relative overflow-hidden">
          <CardHeader className="text-center pb-6 pt-8">
            <CardTitle className="text-2xl md:text-3xl font-bold text-white mb-2">
              {RESET_PASSWORD_STEP_TITLES[step - 1]}
            </CardTitle>
            <CardDescription className="text-gray-400 text-base font-medium">
              {RESET_PASSWORD_STEP_SUBTITLES[step - 1]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            {step === 1 && (
              <>
                <div className="space-y-2.5">
                  <Label htmlFor="phone" className="text-sm font-semibold text-white">
                    Номер телефона
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+7 XXX XXX XX XX"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={19}
                    className="h-12 text-base bg-gray-900 border-2 border-gray-700 text-white focus:bg-gray-800 focus:border-[#F35713] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F35713]/20 focus-visible:ring-offset-0 rounded-xl transition-all duration-200 hover:border-gray-600 placeholder:text-gray-500"
                  />
                </div>
                {error && (
                  <p className="text-[#F35713] text-sm mt-1.5 font-medium animate-in fade-in flex items-center gap-1.5">
                    {error}
                  </p>
                )}
                <Button
                  type="button"
                  onClick={() => void handleSendVerificationCode()}
                  disabled={isSendingCode || !phone}
                  className="w-full bg-[#F35713] hover:bg-[#F35713]/90 text-white py-3 h-14 rounded-xl text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#F35713]/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSendingCode ? "Отправка..." : "Отправить код"}
                </Button>
                <div className="pt-2 border-t border-gray-800">
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className="w-full text-base h-12 text-gray-400 hover:text-gray-300 hover:bg-gray-900 font-semibold transition-all duration-300 rounded-xl hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Вернуться к входу
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400 text-center">
                  Мы отправили SMS с кодом верификации на номер {phone}
                </p>
                <div className="space-y-2.5">
                  <Label htmlFor="verification-code" className="text-center block text-sm font-semibold text-white">
                    Введите код из SMS
                  </Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={verificationCode}
                      onChange={(value) => {
                        setVerificationCode(value);
                        setError("");
                      }}
                      containerClassName="gap-2"
                    >
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <InputOTPSlot key={index} index={index} className={otpSlotClass} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                {error && (
                  <p className="text-[#F35713] text-sm mt-1.5 font-medium animate-in fade-in flex items-center gap-1.5 text-center justify-center">
                    {error}
                  </p>
                )}
                <div className="flex flex-col space-y-2">
                  <Button
                    type="button"
                    onClick={() => void handleVerifyCode()}
                    disabled={verificationCode.length !== 6}
                    className="w-full bg-[#F35713] hover:bg-[#F35713]/90 text-white py-3 h-14 rounded-xl text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#F35713]/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    Подтвердить
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleResendCode()}
                    disabled={isSendingCode || countdown > 0}
                    variant="outline"
                    className="w-full text-base h-12 text-gray-400 border-gray-700 hover:text-gray-300 hover:bg-gray-900 font-semibold transition-all duration-300 rounded-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSendingCode
                      ? "Отправка..."
                      : countdown > 0
                        ? `Отправить повторно (${countdown}с)`
                        : "Отправить код повторно"}
                  </Button>
                  <Button
                    type="button"
                    onClick={goBackToPhone}
                    variant="ghost"
                    className="w-full text-base h-12 text-gray-400 hover:text-gray-300 hover:bg-gray-900 font-semibold transition-all duration-300 rounded-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Назад
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="space-y-2.5 relative">
                  <Label htmlFor="new-password" className="text-sm font-semibold text-white">
                    Новый пароль
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Минимум 6 символов"
                      minLength={6}
                      className="h-12 text-base bg-gray-900 border-2 border-gray-700 text-white focus:bg-gray-800 focus:border-[#F35713] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F35713]/20 focus-visible:ring-offset-0 rounded-xl transition-all duration-200 hover:border-gray-600 placeholder:text-gray-500 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2.5 relative">
                  <Label htmlFor="confirm-password" className="text-sm font-semibold text-white">
                    Подтвердите пароль
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Повторите пароль"
                      className="h-12 text-base bg-gray-900 border-2 border-gray-700 text-white focus:bg-gray-800 focus:border-[#F35713] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F35713]/20 focus-visible:ring-offset-0 rounded-xl transition-all duration-200 hover:border-gray-600 placeholder:text-gray-500 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <p className="text-[#F35713] text-sm mt-1.5 font-medium animate-in fade-in flex items-center gap-1.5">
                    {error}
                  </p>
                )}
                <Button
                  type="button"
                  onClick={() => void handleResetPassword()}
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full bg-[#F35713] hover:bg-[#F35713]/90 text-white py-3 h-14 rounded-xl text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#F35713]/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? "Сохранение..." : "Изменить пароль"}
                </Button>
                <Button
                  type="button"
                  onClick={goBackToOtp}
                  variant="ghost"
                  className="w-full text-base h-12 text-gray-400 hover:text-gray-300 hover:bg-gray-900 font-semibold transition-all duration-300 rounded-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  Назад
                </Button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 text-center">
                <div className="text-[#F35713] text-5xl mb-4">✓</div>
                <p className="text-gray-300 text-base">{RESET_PASSWORD_SUCCESS_MESSAGE}</p>
                <Link href="/login">
                  <Button className="w-full bg-[#F35713] hover:bg-[#F35713]/90 text-white py-3 h-14 rounded-xl text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#F35713]/30 hover:scale-[1.02] active:scale-[0.98]">
                    Перейти к входу
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
