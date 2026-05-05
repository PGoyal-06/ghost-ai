import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { ui } from "@clerk/ui"
import { dark } from "@clerk/ui/themes"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Ghost AI",
  description: "Real-time collaborative system design workspace",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      ui={ui}
      appearance={{
        theme: dark,
        variables: {
          colorBackground: "var(--bg-surface)",
          colorForeground: "var(--text-primary)",
          colorPrimary: "var(--accent-primary)",
          colorMuted: "var(--bg-elevated)",
          colorMutedForeground: "var(--text-muted)",
          colorInput: "var(--bg-subtle)",
          colorInputForeground: "var(--text-primary)",
          colorBorder: "var(--border-default)",
          colorDanger: "var(--state-error)",
          colorSuccess: "var(--state-success)",
          fontFamily: geistSans.style.fontFamily,
        },
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  )
}
