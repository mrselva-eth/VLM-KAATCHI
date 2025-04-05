"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { CheckCircle, Search, MessageSquare, ArrowRight } from "lucide-react"

export function Hero() {
  const { theme } = useTheme()
  const { user, isAuthenticated } = useAuth()
  const [showLoginSuccess, setShowLoginSuccess] = useState(false)
  const [showSignupSuccess, setShowSignupSuccess] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const isLightTheme = theme === "light"

  // Check if user has just logged in or signed up by using sessionStorage
  useEffect(() => {
    if (isAuthenticated) {
      // Check for login success
      const hasJustLoggedIn = sessionStorage.getItem("justLoggedIn")
      if (hasJustLoggedIn === "true") {
        setShowLoginSuccess(true)
        // Remove the flag after showing the message
        setTimeout(() => {
          sessionStorage.removeItem("justLoggedIn")
          setShowLoginSuccess(false)
        }, 5000) // Hide after 5 seconds
      }

      // Check for signup success
      const hasJustSignedUp = sessionStorage.getItem("justSignedUp")
      if (hasJustSignedUp === "true") {
        setShowSignupSuccess(true)
        // Remove the flag after showing the message
        setTimeout(() => {
          sessionStorage.removeItem("justSignedUp")
          setShowSignupSuccess(false)
        }, 5000) // Hide after 5 seconds
      }
    }
  }, [isAuthenticated])

  // Add animation on mount
  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="pt-6 pb-12 md:pt-10 md:pb-16 lg:pt-12 lg:pb-24 bg-background text-foreground relative">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-bl-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-primary/5 rounded-tr-full blur-3xl" />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_600px] lg:gap-12 xl:grid-cols-[1fr_700px] items-center">
          <div
            className={`flex flex-col justify-center space-y-4 transition-all duration-1000 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                <span className="text-primary font-bastro">KAATCHI</span> -{" "}
                <span className="font-bastro">AI Fashion</span> <br />
                <span className="font-bastro">Search</span>
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Discover fashion with our advanced vision-language model. Search by text, image, or both to find exactly
                what you're looking for.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Link href="/search">
                <Button size="lg" className="bg-primary text-primary-foreground group">
                  <Search className="mr-2 h-5 w-5" />
                  Start Searching
                  <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </Button>
              </Link>
              <Link href="/chat">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Try Chat Interface
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 mt-4">
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                    JD
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                    SK
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                    MP
                  </div>
                </div>
                <span className="ml-3 text-sm text-muted-foreground">Trusted by 1,000+ fashion enthusiasts</span>
              </div>

              <div className="flex items-center">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-muted-foreground">4.9/5 rating</span>
              </div>
            </div>
          </div>

          <div
            className={`flex items-center justify-center transition-all duration-1000 delay-300 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="relative h-[350px] w-full md:h-[450px] lg:h-[500px] xl:h-[550px] overflow-hidden rounded-2xl shadow-xl">
              <Image
                src={isLightTheme ? "/images/image2.png" : "/images/image1.png"}
                alt="Fashion collage"
                fill
                className="object-cover transition-transform hover:scale-105 duration-1000"
                priority
              />

              {/* Floating feature badges */}
              <div className="absolute top-6 left-6 bg-background/80 backdrop-blur-sm border rounded-full px-4 py-2 shadow-lg flex items-center animate-pulse">
                <Search className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm font-medium">AI-Powered Search</span>
              </div>

              <div className="absolute bottom-6 right-6 bg-background/80 backdrop-blur-sm border rounded-full px-4 py-2 shadow-lg flex items-center animate-pulse delay-700">
                <MessageSquare className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm font-medium">Fashion Assistant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login success message */}
      {showLoginSuccess && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          <span>Welcome back, {user?.firstName || "User"}! You've successfully logged in.</span>
        </div>
      )}

      {/* Signup success message */}
      {showSignupSuccess && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          <span>Welcome to KAATCHI, {user?.firstName || "User"}! Your account has been successfully created.</span>
        </div>
      )}
    </section>
  )
}

