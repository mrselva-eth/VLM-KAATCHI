"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

export default function AboutPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const isLightTheme = theme === "light"

  const goBack = () => {
    router.back()
  }

  const headingColor = isLightTheme ? "text-[#7e3b92]" : "text-[#2c8e59]"

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Go Back Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goBack}
        className="fixed top-[72px] left-4 z-30 text-foreground hover:bg-muted h-8 w-8"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Go back</span>
      </Button>

      <div className="flex-1 container py-8 pt-16">
        <div className="max-w-3xl mx-auto">
          <h1 className={`text-5xl font-bold mb-8 ${headingColor}`}>About KAATCHI</h1>

          <div className="relative h-[400px] w-full mb-10 overflow-hidden rounded-lg">
            <Image
              src={isLightTheme ? "/images/about-banner1.jpg" : "/images/about-banner.jpg"}
              alt="KAATCHI Fashion Search Platform"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="space-y-10">
            <section>
              <h2 className={`text-3xl font-semibold mb-4 ${headingColor}`}>Our Vision</h2>
              <p className="text-black dark:text-white text-xl leading-relaxed">
                KAATCHI is an advanced fashion search platform powered by vision-language models. Our name, which means
                "vision" in Tamil, reflects our mission to revolutionize how people discover and interact with fashion
                products online. We aim to bridge the gap between visual inspiration and product discovery, making
                fashion search intuitive and natural.
              </p>
            </section>

            <section>
              <h2 className={`text-3xl font-semibold mb-4 ${headingColor}`}>The Technology</h2>
              <p className="text-black dark:text-white text-xl leading-relaxed mb-5">
                At the heart of KAATCHI is a sophisticated CLIP-based (Contrastive Language-Image Pre-training) model
                that understands both images and text. This allows our platform to offer three powerful search methods:
              </p>
              <ul className="list-disc pl-8 space-y-4 text-black dark:text-white text-xl">
                <li>
                  <strong>Text Search:</strong> Find products by describing what you're looking for in natural language
                </li>
                <li>
                  <strong>Image Search:</strong> Upload an image to find similar products in our extensive catalog
                </li>
                <li>
                  <strong>Multimodal Search:</strong> Combine text and images for the most precise results tailored to
                  your specific needs
                </li>
              </ul>
            </section>

            <section>
              <h2 className={`text-3xl font-semibold mb-4 ${headingColor}`}>Our Dataset</h2>
              <p className="text-black dark:text-white text-xl leading-relaxed">
                KAATCHI is trained on a comprehensive fashion dataset containing thousands of products across multiple
                categories. Each product is meticulously tagged with attributes like gender, category, color, and usage,
                allowing for highly specific and accurate search results. Our continuous learning system ensures that
                the platform evolves with changing fashion trends and user preferences.
              </p>
            </section>

            <section>
              <h2 className={`text-3xl font-semibold mb-4 ${headingColor}`}>The Team</h2>
              <p className="text-black dark:text-white text-xl leading-relaxed">
                Our team consists of passionate AI researchers, fashion enthusiasts, and software engineers dedicated to
                creating the most intuitive and powerful fashion search experience. Led by Selva, with the
                Vision-Language Model (VLM) built by Angeline and Prathish, we combine expertise in computer vision,
                natural language processing, and fashion retail to deliver a revolutionary product. We believe that
                finding the perfect fashion item should be as simple as describing it or showing a picture.
              </p>
            </section>

            <section>
              <h2 className={`text-3xl font-semibold mb-4 ${headingColor}`}>Our Approach</h2>
              <p className="text-black dark:text-white text-xl leading-relaxed">
                We believe in a user-centered approach to fashion discovery. Traditional e-commerce search relies on
                keywords and filters, which often fails to capture the nuanced visual and stylistic elements that
                influence fashion choices. KAATCHI bridges this gap by understanding the visual and textual aspects of
                fashion simultaneously, making the search process more natural and intuitive. Whether you're looking for
                "a floral summer dress with ruffled sleeves" or uploading an image of a style you love, KAATCHI
                understands your intent and delivers relevant results.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

