"use client"

import { useRef, useEffect, useState } from "react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Testimonial {
  id: number
  name: string
  role: string
  company: string
  image: string
  quote: string
  rating: number
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Fashion Blogger",
    company: "Style Insights",
    image: "/placeholder.svg?height=100&width=100",
    quote:
      "KAATCHI has revolutionized how I discover fashion items for my blog. The image search is incredibly accurate and saves me hours of browsing time.",
    rating: 5,
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "E-commerce Manager",
    company: "TrendSetters",
    image: "/placeholder.svg?height=100&width=100",
    quote:
      "The multimodal search capability is a game-changer. Our customers can now find exactly what they're looking for by combining text descriptions with images.",
    rating: 5,
  },
  {
    id: 3,
    name: "Priya Patel",
    role: "Fashion Student",
    company: "Design Institute",
    image: "/placeholder.svg?height=100&width=100",
    quote:
      "As a fashion design student, KAATCHI helps me research trends and find inspiration quickly. The AI chat assistant provides valuable insights about different styles.",
    rating: 4,
  },
  {
    id: 4,
    name: "James Wilson",
    role: "Retail Buyer",
    company: "Fashion Forward",
    image: "/placeholder.svg?height=100&width=100",
    quote:
      "KAATCHI has transformed our buying process. We can now quickly identify trending items and make more informed purchasing decisions.",
    rating: 5,
  },
  {
    id: 5,
    name: "Elena Rodriguez",
    role: "Personal Stylist",
    company: "Elite Styling",
    image: "/placeholder.svg?height=100&width=100",
    quote:
      "My clients love when I use KAATCHI to find items that match their style preferences. The platform understands nuanced fashion concepts better than any other tool.",
    rating: 5,
  },
]

export function Testimonials() {
  const { theme } = useTheme()
  const isLightTheme = theme === "light"
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const testimonialsRef = useRef<HTMLDivElement>(null)

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

    if (testimonialsRef.current) {
      observer.observe(testimonialsRef.current)
    }

    return () => {
      if (testimonialsRef.current) {
        observer.unobserve(testimonialsRef.current)
      }
    }
  }, [])

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        handleNext()
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [activeIndex, isAnimating])

  const handlePrev = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))

    setTimeout(() => {
      setIsAnimating(false)
    }, 500)
  }

  const handleNext = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))

    setTimeout(() => {
      setIsAnimating(false)
    }, 500)
  }

  return (
    <section
      ref={testimonialsRef}
      className="py-16 bg-background opacity-0 translate-y-8 transition-all duration-700 ease-out"
    >
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Discover how KAATCHI is transforming the fashion search experience
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <div className="bg-card border rounded-xl p-8 relative">
                    <div className="absolute -top-6 left-8 w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <Quote className="h-6 w-6 text-primary-foreground" />
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-start pt-4">
                      <div className="flex-shrink-0 w-20 h-20 rounded-full overflow-hidden border-2 border-primary">
                        <Image
                          src={testimonial.image || "/placeholder.svg"}
                          alt={testimonial.name}
                          width={80}
                          height={80}
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < testimonial.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                            />
                          ))}
                        </div>

                        <blockquote className="text-lg italic mb-4">"{testimonial.quote}"</blockquote>

                        <div>
                          <h4 className="font-bold">{testimonial.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {testimonial.role}, {testimonial.company}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 h-10 w-10 rounded-full bg-background border shadow-md hidden md:flex"
            onClick={handlePrev}
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Previous</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 h-10 w-10 rounded-full bg-background border shadow-md hidden md:flex"
            onClick={handleNext}
          >
            <ChevronRight className="h-5 w-5" />
            <span className="sr-only">Next</span>
          </Button>

          {/* Dots indicator */}
          <div className="flex justify-center mt-8 gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === activeIndex ? "bg-primary w-6" : "bg-primary/30 hover:bg-primary/50"
                }`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

