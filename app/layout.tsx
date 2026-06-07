import type React from "react"
import { Suspense } from "react"
import type { Metadata } from "next"
import "./globals.css"
import "../lib/fcm"
import BridgeInit from "@/components/BridgeInit"
import { RestorePendingRequestUrl } from "@/components/RestorePendingRequestUrl"
import { MobileDeepLinkToApp } from "@/components/MobileDeepLinkToApp"
import { AppProviders } from "@/components/theme/app-providers"
import { ColorSchemeInitScript } from "@/components/theme/color-scheme-init-script"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "WorkFlow App - Internal Service Request Management",
  description:
    "Mobile-first internal solution for Kcell employees to submit and manage cleaning and maintenance requests across office buildings.",
  keywords: "Kcell, service requests, maintenance, internal app, Kazakhstan telecom",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
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
        </AppProviders>
      </body>
    </html>
  )
}
