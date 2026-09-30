import NextImage from "next/image";
export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040404] animate-fade-in">
      {/* Logo centered */}
      <div className="flex flex-col items-center justify-center">
        <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl animate-fade-in-up">
          <NextImage width={112} height={112}
            src="/app-icon.png"
            alt="WorkFlow App Icon"
            loading="eager"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <span className="sr-only">Загрузка приложения...</span>
    </div>
  )
}
