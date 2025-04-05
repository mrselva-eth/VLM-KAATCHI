"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import { Menu, X } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { ProfileIcon } from "./profile-icon"

export function Navbar() {
  const isMobile = useMobile()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { theme } = useTheme()
  const isLightTheme = theme === "light"

  const isChat = pathname === "/chat"

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-input bg-background backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="flex h-16 items-center justify-between px-4 md:px-8 relative">
        <div className="flex items-center gap-3 z-10">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src={isLightTheme ? "/kaatchi-logo1.png" : "/kaatchi-logo.png"}
              alt="KAATCHI Logo"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <span className="text-2xl font-bold font-bastro flex">
              <span className="text-primary">K</span>
              <span className="text-primary">A</span>
              <span className="text-foreground">A</span>
              <span className="text-primary">T</span>
              <span className="text-primary">C</span>
              <span className="text-primary">H</span>
              <span className="text-foreground">I</span>
            </span>
          </Link>
        </div>

        {(isChat || pathname === "/search") && (
          <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
            <h1 className="text-xl font-bold text-foreground">
              {isChat ? "Fashion Assistant Chat" : "Advanced Fashion Search"}
            </h1>
          </div>
        )}

        {isMobile ? (
          <>
            <Button variant="ghost" size="icon" onClick={toggleMenu} className="text-foreground z-10">
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
            {isMenuOpen && (
              <div className="absolute top-16 left-0 right-0 bg-background border-b border-input p-4 flex flex-col gap-2">
                <Link href="/" onClick={toggleMenu}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-foreground hover:bg-muted font-bold text-base"
                  >
                    Home
                  </Button>
                </Link>
                <Link href="/search" onClick={toggleMenu}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-foreground hover:bg-muted font-bold text-base"
                  >
                    Search
                  </Button>
                </Link>
                <Link href="/chat" onClick={toggleMenu}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-foreground hover:bg-muted font-bold text-base"
                  >
                    Chat
                  </Button>
                </Link>
                <Link href="/about" onClick={toggleMenu}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-foreground hover:bg-muted font-bold text-base"
                  >
                    About
                  </Button>
                </Link>
                <div className="flex justify-between items-center mt-2">
                  <ModeToggle />
                  <ProfileIcon />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-4 z-10">
            <div className="flex gap-8">
              <Link href="/">
                <Button
                  variant="ghost"
                  className={`text-foreground hover:bg-muted px-4 font-bold text-base border-b-2 ${
                    pathname === "/" ? (isLightTheme ? "border-[#7e3b92]" : "border-[#2c8e59]") : "border-transparent"
                  }`}
                >
                  Home
                </Button>
              </Link>
              <Link href="/search">
                <Button
                  variant="ghost"
                  className={`text-foreground hover:bg-muted px-4 font-bold text-base border-b-2 ${
                    pathname === "/search"
                      ? isLightTheme
                        ? "border-[#7e3b92]"
                        : "border-[#2c8e59]"
                      : "border-transparent"
                  }`}
                >
                  Search
                </Button>
              </Link>
              <Link href="/chat">
                <Button
                  variant="ghost"
                  className={`text-foreground hover:bg-muted px-4 font-bold text-base border-b-2 ${
                    pathname === "/chat"
                      ? isLightTheme
                        ? "border-[#7e3b92]"
                        : "border-[#2c8e59]"
                      : "border-transparent"
                  }`}
                >
                  Chat
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  variant="ghost"
                  className={`text-foreground hover:bg-muted px-4 font-bold text-base border-b-2 ${
                    pathname === "/about"
                      ? isLightTheme
                        ? "border-[#7e3b92]"
                        : "border-[#2c8e59]"
                      : "border-transparent"
                  }`}
                >
                  About
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <ModeToggle />
              <ProfileIcon />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

