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

export const metadata: Metadata = {
  title: "WorkFlow App - Internal Service Request Management",
  description:
    "Mobile-first internal solution for Kcell employees to submit and manage cleaning and maintenance requests across office buildings.",
  keywords: "Kcell, service requests, maintenance, internal app, Kazakhstan telecom",
    generator: 'v0.dev'
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
