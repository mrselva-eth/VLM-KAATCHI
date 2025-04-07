import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { KaiProvider } from "@/lib/kai-context"

// Load Didot font
const didot = localFont({
  src: "../public/fonts/Didot.otf",
  variable: "--font-didot",
  display: "swap",
})

// Load Bastro font for branding
const bastro = localFont({
  src: "../public/fonts/Bastro.otf",
  variable: "--font-bastro",
  display: "swap",
})

export const metadata: Metadata = {
  title: "KAATCHI - Fashion Visual Search",
  description: "AI-powered fashion search using vision-language models",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${didot.variable} ${bastro.variable}`}>
      <body className={didot.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <KaiProvider>{children}</KaiProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

