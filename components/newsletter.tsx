"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, CheckCircle, AlertCircle } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-context"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const { theme } = useTheme()
  const { user } = useAuth()
  const isLightTheme = theme === "light"
  const sectionRef = useRef<HTMLDivElement>(null)

  // Animation on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in")
          }
        })
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic email validation
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("error")
      setMessage("Please enter a valid email address")
      return
    }

    // Send subscription request to API
    setStatus("loading")

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include auth token if available
          ...(localStorage.getItem("kaatchi_auth_token")
            ? { Authorization: `Bearer ${localStorage.getItem("kaatchi_auth_token")}` }
            : {}),
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to subscribe")
      }

      setStatus("success")
      setMessage(data.message || "Thank you for subscribing to our newsletter!")

      // Only clear email if it's not a logged-in user's email
      if (!user || user.email !== email) {
        setEmail("")
      }
    } catch (error: any) {
      setStatus("error")
      setMessage(error.message || "An error occurred. Please try again.")
    }
  }

  return (
    <section
      ref={sectionRef}
      className="py-16 bg-primary/5 opacity-0 translate-y-8 transition-all duration-700 ease-out"
    >
      <div className="container px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay Updated</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Subscribe to our newsletter to receive updates on new features, fashion trends, and exclusive content.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 pr-12 bg-background"
                disabled={status === "loading" || status === "success"}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Send className="h-5 w-5" />
              </div>
            </div>
            <Button
              type="submit"
              className="h-12 px-6 bg-primary text-primary-foreground"
              disabled={status === "loading" || status === "success"}
            >
              {status === "loading" ? (
                <>
                  <span className="animate-pulse">Subscribing...</span>
                </>
              ) : status === "success" ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Subscribed
                </>
              ) : (
                "Subscribe"
              )}
            </Button>
          </form>

          {status === "success" && (
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md flex items-center justify-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>{message}</span>
            </div>
          )}

          {status === "error" && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md flex items-center justify-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{message}</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            By subscribing, you agree to receive marketing emails from KAATCHI. You can unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  )
}

