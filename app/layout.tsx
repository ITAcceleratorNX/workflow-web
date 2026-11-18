import type React from "react"
import { Suspense } from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import "../lib/fcm"
import BridgeInit from "@/components/BridgeInit"
import { RestorePendingRequestUrl } from "@/components/RestorePendingRequestUrl"
import { MobileDeepLinkToApp } from "@/components/MobileDeepLinkToApp"
import { AppProviders } from "@/components/theme/app-providers"
import { ColorSchemeInitScript } from "@/components/theme/color-scheme-init-script"
import { Toaster } from "@/components/ui/toaster"
import { ConfirmDialogHost } from "@/components/confirm-dialog-host"
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s — ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Workflow",
    "TMK Workflow",
    "TMK Techno Horizon",
    "заявки на обслуживание офиса",
    "заявки на уборку",
    "заявки на ремонт",
    "бронирование переговорных",
    "Казахстан",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "ru_RU",
    images: [{ url: "/app-icon.png", alt: SITE_NAME }],
  },
  icons: { icon: "/app-icon.png", apple: "/app-icon.png" },
  // Коды подтверждения владения из Google Search Console и Яндекс Вебмастера.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <ColorSchemeInitScript />
      </head>
      <body className="font-sf-pro">
        <AppProviders>
          <BridgeInit />
          <Suspense fallback={null}>
            <RestorePendingRequestUrl />
          </Suspense>
          <Suspense fallback={null}>
            <MobileDeepLinkToApp />
          </Suspense>
          {children}
          <Toaster />
          <ConfirmDialogHost />
        </AppProviders>
      </body>
    </html>
  )
}
