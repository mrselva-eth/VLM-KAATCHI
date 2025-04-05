"use client"

import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"

export function SearchPromo() {
  const { theme } = useTheme()
  const isLightTheme = theme === "light"

  return (
    <section className="py-16 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="space-y-3 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
              Search Fashion Products
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-[700px] mx-auto">
              Find the perfect fashion items using our advanced search capabilities
            </p>
          </div>

          <Link href="/search">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg rounded-lg"
            >
              Go to Advanced Search
              <Search className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

