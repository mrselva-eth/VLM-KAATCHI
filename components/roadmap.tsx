"use client"

import { useRef, useEffect } from "react"
import { useTheme } from "next-themes"
import { CheckCircle, Circle, Clock } from "lucide-react"

export function Roadmap() {
  const { theme } = useTheme()
  const isLightTheme = theme === "light"
  const roadmapRef = useRef<HTMLDivElement>(null)

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

    const roadmapItems = document.querySelectorAll(".roadmap-item")
    roadmapItems.forEach((el) => observer.observe(el))

    return () => {
      roadmapItems.forEach((el) => observer.unobserve(el))
    }
  }, [])

  return (
    <section className="py-16 bg-muted/30" ref={roadmapRef}>
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Roadmap</h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            We're constantly improving KAATCHI with new features and capabilities
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto mt-16">
          {/* Vertical line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-primary/20"></div>

          {/* Q1 2025 - Completed */}
          <div className="roadmap-item opacity-0 translate-y-8 transition-all duration-700 ease-out mb-16 relative">
            <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 -top-4 z-10">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:text-right md:pr-8 pt-6">
                <h3 className="text-xl font-bold text-primary">Q1 2025</h3>
                <h4 className="text-lg font-semibold mb-2">Foundation</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center md:justify-end">
                    <span>Initial platform development</span>
                    <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                  </li>
                  <li className="flex items-center md:justify-end">
                    <span>Basic text search functionality</span>
                    <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                  </li>
                  <li className="flex items-center md:justify-end">
                    <span>User account system</span>
                    <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                  </li>
                </ul>
              </div>
              <div className="md:border-l md:border-primary/20 md:pl-8 pt-6">
                <div className="bg-card border rounded-lg p-4">
                  <p className="text-muted-foreground">
                    We established the core platform architecture and implemented basic search functionality using
                    natural language processing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Q1 2025 - Completed */}
          <div className="roadmap-item opacity-0 translate-y-8 transition-all duration-700 delay-200 ease-out mb-16 relative">
            <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 -top-4 z-10">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:text-right md:pr-8 pt-6 md:order-1 order-2">
                <div className="bg-card border rounded-lg p-4">
                  <p className="text-muted-foreground">
                    We integrated CLIP model for image understanding and developed our multimodal search capabilities,
                    allowing users to search with both text and images.
                  </p>
                </div>
              </div>
              <div className="md:border-l md:border-primary/20 md:pl-8 pt-6 md:order-2 order-1">
                <h3 className="text-xl font-bold text-primary">Q1 2025</h3>
                <h4 className="text-lg font-semibold mb-2">Vision Integration</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>CLIP model integration</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Image search capabilities</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Multimodal search prototype</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Q1 2025 - Completed */}
          <div className="roadmap-item opacity-0 translate-y-8 transition-all duration-700 delay-400 ease-out mb-16 relative">
            <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 -top-4 z-10">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:text-right md:pr-8 pt-6">
                <h3 className="text-xl font-bold text-primary">Q1 2025</h3>
                <h4 className="text-lg font-semibold mb-2">Platform Enhancement</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center md:justify-end">
                    <span>Chat interface development</span>
                    <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                  </li>
                  <li className="flex items-center md:justify-end">
                    <span>User analytics dashboard</span>
                    <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                  </li>
                  <li className="flex items-center md:justify-end">
                    <span>Wishlist and cart functionality</span>
                    <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                  </li>
                </ul>
              </div>
              <div className="md:border-l md:border-primary/20 md:pl-8 pt-6">
                <div className="bg-card border rounded-lg p-4">
                  <p className="text-muted-foreground">
                    We launched our conversational AI assistant and improved the user experience with personalized
                    dashboards and e-commerce features.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Q1-Q2 2025 - Current */}
          <div className="roadmap-item opacity-0 translate-y-8 transition-all duration-700 delay-600 ease-out mb-16 relative">
            <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 -top-4 z-10">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:text-right md:pr-8 pt-6 md:order-1 order-2">
                <div className="bg-card border rounded-lg p-4">
                  <p className="text-muted-foreground">
                    We're currently expanding our dataset, improving search accuracy, and enhancing the user interface
                    for a more intuitive experience.
                  </p>
                </div>
              </div>
              <div className="md:border-l md:border-primary/20 md:pl-8 pt-6 md:order-2 order-1">
                <h3 className="text-xl font-bold text-blue-500">Q1-Q2 2025</h3>
                <h4 className="text-lg font-semibold mb-2">Expansion & Refinement</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Dataset expansion to 100K+ items</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Search algorithm improvements</span>
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-500 mr-2" />
                    <span>UI/UX enhancements</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Q3-Q4 2025 - Future */}
          <div className="roadmap-item opacity-0 translate-y-8 transition-all duration-700 delay-800 ease-out mb-16 relative">
            <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 -top-4 z-10">
              <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                <Circle className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:text-right md:pr-8 pt-6">
                <h3 className="text-xl font-bold text-gray-500">Q3-Q4 2025</h3>
                <h4 className="text-lg font-semibold mb-2">Advanced Features</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center md:justify-end">
                    <span>Virtual try-on functionality</span>
                    <Circle className="h-4 w-4 text-gray-400 ml-2" />
                  </li>
                  <li className="flex items-center md:justify-end">
                    <span>Outfit generation AI</span>
                    <Circle className="h-4 w-4 text-gray-400 ml-2" />
                  </li>
                  <li className="flex items-center md:justify-end">
                    <span>Mobile app development</span>
                    <Circle className="h-4 w-4 text-gray-400 ml-2" />
                  </li>
                </ul>
              </div>
              <div className="md:border-l md:border-primary/20 md:pl-8 pt-6">
                <div className="bg-card border rounded-lg p-4">
                  <p className="text-muted-foreground">
                    We plan to introduce virtual try-on capabilities, AI-powered outfit recommendations, and launch our
                    mobile application.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2025 - Future */}
          <div className="roadmap-item opacity-0 translate-y-8 transition-all duration-700 delay-1000 ease-out relative">
            <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 -top-4 z-10">
              <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                <Circle className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:text-right md:pr-8 pt-6 md:order-1 order-2">
                <div className="bg-card border rounded-lg p-4">
                  <p className="text-muted-foreground">
                    Our long-term vision includes expanding to international markets, integrating with major retailers,
                    and developing AR/VR experiences.
                  </p>
                </div>
              </div>
              <div className="md:border-l md:border-primary/20 md:pl-8 pt-6 md:order-2 order-1">
                <h3 className="text-xl font-bold text-gray-500">2025</h3>
                <h4 className="text-lg font-semibold mb-2">Expansion & Innovation</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center">
                    <Circle className="h-4 w-4 text-gray-400 mr-2" />
                    <span>International expansion</span>
                  </li>
                  <li className="flex items-center">
                    <Circle className="h-4 w-4 text-gray-400 mr-2" />
                    <span>Retail partnerships</span>
                  </li>
                  <li className="flex items-center">
                    <Circle className="h-4 w-4 text-gray-400 mr-2" />
                    <span>AR/VR fashion experiences</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

