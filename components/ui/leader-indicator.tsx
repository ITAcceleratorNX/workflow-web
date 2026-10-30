import React, { useState } from 'react';
import { Crown, Info, X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface LeaderIndicatorProps {
  isDesktop: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LeaderIndicator({ isDesktop, size = 'md', className = '' }: LeaderIndicatorProps) {
  const [showMobileModal, setShowMobileModal] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSize = sizeClasses[size];

  const handleClick = () => {
    if (!isDesktop) {
      setShowMobileModal(true);
    }
  };

  const handleClose = () => {
    setShowMobileModal(false);
  };

  if (isDesktop) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center justify-center ${className}`}>
              <Crown className={`${iconSize} text-[#F35713] hover:text-[#E04D0F] transition-colors`} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs bg-[#2C2C2E] border border-[#3A3A3C] shadow-lg rounded-lg">
            <div className="p-2">
              <p className="font-medium text-sm text-white">Ответственный исполнитель</p>
              <p className="text-xs text-white/60 mt-1">
                Может управлять заявкой
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={`p-1 h-auto hover:bg-[#F35713]/10 ${className}`}
        onClick={handleClick}
      >
        <Crown className={`${iconSize} text-[#F35713]`} />
      </Button>

      {/* Минималистичная модалка */}
      {showMobileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Фон */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          {/* Модальное окно */}
          <div className="relative bg-card border border-border rounded-xl sm:rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md mx-auto overflow-hidden">
            {/* Заголовок */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#F35713]/15 rounded-lg flex items-center justify-center">
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-[#F35713]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-foreground">Ответственный исполнитель</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Особые полномочия</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-lg hover:bg-muted"
                onClick={handleClose}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </Button>
            </div>

            {/* Контент */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Полномочия */}
              <div className="bg-muted p-3 sm:p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#F35713] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground text-sm sm:text-base mb-2">Полномочия:</h3>
                    <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-[#F35713] rounded-full"></div>
                        Начать выполнение
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-[#F35713] rounded-full"></div>
                        Завершить заявку
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-[#F35713] rounded-full"></div>
                        Координировать команду
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Кнопка */}
              <div className="flex justify-center pt-2">
                <Button
                  onClick={handleClose}
                  className="bg-[hsl(var(--action-background))] hover:bg-[hsl(var(--action-background))]/90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Понятно
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
