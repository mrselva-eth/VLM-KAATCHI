"use client"

import { useRef, useEffect } from "react"
import { useTheme } from "next-themes"
import { Search, Image, Split, MessageSquare, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Features() {
  const { theme } = useTheme()
  const isLightTheme = theme === "light"
  const featuresRef = useRef<HTMLDivElement>(null)

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

    const featureElements = document.querySelectorAll(".feature-card")
    featureElements.forEach((el) => observer.observe(el))

    return () => {
      featureElements.forEach((el) => observer.unobserve(el))
    }
  }, [])

  return (
    <section className="py-16 bg-background relative overflow-hidden" ref={featuresRef}>
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Search Features</h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            KAATCHI offers multiple ways to find exactly what you're looking for in the fashion world
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {/* Text Search */}
          <div className="feature-card opacity-0 translate-y-8 transition-all duration-700 ease-out bg-card border rounded-xl p-6 hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Text Search</h3>
            <p className="text-muted-foreground mb-4">
              Describe what you're looking for in natural language and our AI will find matching products.
            </p>
            <Link href="/search">
              <Button variant="outline" className="mt-2 group">
                Try Text Search
                <Zap className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Image Search */}
          <div className="feature-card opacity-0 translate-y-8 transition-all duration-700 delay-200 ease-out bg-card border rounded-xl p-6 hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Image className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Image Search</h3>
            <p className="text-muted-foreground mb-4">
              Upload an image of a fashion item you like and we'll find similar products in our catalog.
            </p>
            <Link href="/search">
              <Button variant="outline" className="mt-2 group">
                Try Image Search
                <Zap className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Multimodal Search */}
          <div className="feature-card opacity-0 translate-y-8 transition-all duration-700 delay-400 ease-out bg-card border rounded-xl p-6 hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Split className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Multimodal Search</h3>
            <p className="text-muted-foreground mb-4">
              Combine text and images for the most precise search results tailored to your specific needs.
            </p>
            <Link href="/search">
              <Button variant="outline" className="mt-2 group">
                Try Multimodal Search
                <Zap className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Chat Assistant */}
          <div className="feature-card opacity-0 translate-y-8 transition-all duration-700 delay-600 ease-out bg-card border rounded-xl p-6 hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Fashion Assistant</h3>
            <p className="text-muted-foreground mb-4">
              Chat with our AI fashion assistant to get personalized recommendations and style advice.
            </p>
            <Link href="/chat">
              <Button variant="outline" className="mt-2 group">
                Chat Now
                <Zap className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Personalized Recommendations */}
          <div className="feature-card opacity-0 translate-y-8 transition-all duration-700 delay-800 ease-out bg-card border rounded-xl p-6 hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Smart Recommendations</h3>
            <p className="text-muted-foreground mb-4">
              Get personalized product recommendations based on your search history and preferences.
            </p>
            <Link href="/search">
              <Button variant="outline" className="mt-2 group">
                Explore
                <Zap className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

