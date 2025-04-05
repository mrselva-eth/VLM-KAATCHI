import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Roadmap } from "@/components/roadmap"
import { Newsletter } from "@/components/newsletter"
import { Testimonials } from "@/components/testimonials"
import { TrendingSection } from "@/components/trending-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <Hero />
      <Features />
      <TrendingSection />
      <Roadmap />
      <Testimonials />
      <Newsletter />
      <Footer />
    </main>
  )
}

