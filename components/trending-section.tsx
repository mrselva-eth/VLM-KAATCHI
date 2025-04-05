"use client"

import { useEffect, useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { useTheme } from "next-themes"

interface TrendingCategory {
  name: string
  slug: string
  image: string
  productId: string
}

export function TrendingSection() {
  const [trendingCategories, setTrendingCategories] = useState<TrendingCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const { theme } = useTheme()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const positionRef = useRef<number>(0)
  const speedRef = useRef<number>(0.5) // Pixels per frame

  useEffect(() => {
    const fetchTrendingCategories = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/trending?count=10")

        if (!response.ok) {
          throw new Error("Failed to fetch trending categories")
        }

        const data = await response.json()
        setTrendingCategories(data.categories || [])
      } catch (err) {
        console.error("Error fetching trending categories:", err)
        setError("Failed to load trending categories")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrendingCategories()
  }, [])

  // Animation logic
  useEffect(() => {
    if (isLoading || error || !scrollContainerRef.current) return

    const scrollContainer = scrollContainerRef.current
    const totalWidth = scrollContainer.scrollWidth / 2 // Only need to move half the distance for seamless loop

    // Initial position at the end for right-to-left scrolling
    if (positionRef.current === 0) {
      positionRef.current = totalWidth
    }

    // Animation function
    const animate = () => {
      if (isPaused) {
        // If paused, just store the current position
        positionRef.current = scrollContainer.scrollLeft
        return
      }

      // Move scroll position
      positionRef.current -= speedRef.current

      // Reset if we've gone through one cycle
      if (positionRef.current <= 0) {
        positionRef.current = totalWidth
      }

      // Apply the new position
      scrollContainer.scrollLeft = positionRef.current

      // Continue animation
      animationRef.current = requestAnimationFrame(animate)
    }

    // Start animation
    animationRef.current = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [isLoading, error, isPaused])

  return (
    <section className="py-12 overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center mb-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Trending Categories</h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Explore the most popular fashion categories
            </p>
          </div>
        </div>

        {isLoading ? (
          // Loading skeletons
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <Card key={`skeleton-${index}`} className="overflow-hidden">
                <div className="relative aspect-square overflow-hidden">
                  <Skeleton className="absolute inset-0" />
                </div>
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="text-center text-destructive">
            <p>{error}</p>
          </div>
        ) : (
          // Continuous scrolling carousel
          <div
            className="relative w-full overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-scroll scrollbar-hide"
              style={{
                width: "100%",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <div className="flex">
                {/* First set of items */}
                {trendingCategories.map((category) => (
                  <Link
                    href={`/category/${category.slug}`}
                    key={`first-${category.slug}`}
                    className="flex-shrink-0 w-[250px]"
                  >
                    <Card className="overflow-hidden transition-all hover:shadow-md rounded-none">
                      <div
                        className={`relative aspect-square overflow-hidden ${
                          theme === "light"
                            ? "border-2 border-[#7e3b92]" // Violet border for light mode
                            : "border-2 border-[#2c8e59]" // Green border for dark mode
                        }`}
                      >
                        <Image
                          src={category.image || "/placeholder.svg"}
                          alt={category.name}
                          fill
                          className="object-cover transition-transform hover:scale-105"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=300&width=300"
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 w-full p-4">
                          <h3 className="text-xl font-bold text-white">{category.name}</h3>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}

                {/* Duplicate items to create seamless loop */}
                {trendingCategories.map((category) => (
                  <Link
                    href={`/category/${category.slug}`}
                    key={`second-${category.slug}`}
                    className="flex-shrink-0 w-[250px]"
                  >
                    <Card className="overflow-hidden transition-all hover:shadow-md rounded-none">
                      <div
                        className={`relative aspect-square overflow-hidden ${
                          theme === "light"
                            ? "border-2 border-[#7e3b92]" // Violet border for light mode
                            : "border-2 border-[#2c8e59]" // Green border for dark mode
                        }`}
                      >
                        <Image
                          src={category.image || "/placeholder.svg"}
                          alt={category.name}
                          fill
                          className="object-cover transition-transform hover:scale-105"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=300&width=300"
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 w-full p-4">
                          <h3 className="text-xl font-bold text-white">{category.name}</h3>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

