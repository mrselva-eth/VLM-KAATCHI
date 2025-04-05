"use client"

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { SocialConnect } from "@/components/social-connect"

export function Footer() {
  const { theme } = useTheme()
  const isLightTheme = theme === "light"

  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-8 md:px-6 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={isLightTheme ? "/kaatchi-logo1.png" : "/kaatchi-logo.png"}
                alt="KAATCHI Logo"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold font-bastro">
                <span className="text-primary">K</span>
                <span className="text-primary">A</span>
                <span className="text-foreground">A</span>
                <span className="text-primary">T</span>
                <span className="text-primary">C</span>
                <span className="text-primary">H</span>
                <span className="text-foreground">I</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">AI-powered fashion search using vision-language models</p>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-muted-foreground hover:text-foreground">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/chat" className="text-muted-foreground hover:text-foreground">
                  Chat
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                  About
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/category/apparel" className="text-muted-foreground hover:text-foreground">
                  Apparel
                </Link>
              </li>
              <li>
                <Link href="/category/accessories" className="text-muted-foreground hover:text-foreground">
                  Accessories
                </Link>
              </li>
              <li>
                <Link href="/category/footwear" className="text-muted-foreground hover:text-foreground">
                  Footwear
                </Link>
              </li>
              <li>
                <Link href="/category/personal-care" className="text-muted-foreground hover:text-foreground">
                  Personal Care
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Connect Section moved to the right */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Connect to KAATCHI</h3>
            <div className="flex items-center justify-center md:justify-start">
              <div className={`p-4 rounded-full ${isLightTheme ? "border-[#7e3b92]" : "border-[#2c8e59]"} border-2`}>
                <SocialConnect />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} KAATCHI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

