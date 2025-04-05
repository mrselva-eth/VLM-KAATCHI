import fs from "fs"
import path from "path"
import { promises as fsPromises } from "fs"

// Define paths - using the actual dataset location
const DATASET_PATH = process.env.DATASET_PATH || "D:/project/kaatchi-fashion-vlm/data/fashion-dataset"
const IMAGE_FOLDER = path.join(DATASET_PATH, "images")
const METADATA_FILE = path.join(DATASET_PATH, "styles.csv")

// Define category types with their corresponding metadata fields
const CATEGORY_TYPES = {
  masterCategory: ["Apparel", "Accessories", "Footwear", "Personal Care"],
  gender: ["Men", "Women", "Boys", "Girls", "Unisex"],
  season: ["Summer", "Winter", "Spring", "Fall"],
  usage: ["Casual", "Ethnic", "Formal", "Sports", "Travel", "Party"],
}

export interface TrendingCategory {
  name: string
  slug: string
  image: string
  productId: string
}

// Function to read and parse CSV data
async function readCSV(): Promise<any[]> {
  try {
    if (!fs.existsSync(METADATA_FILE)) {
      console.error(`Metadata file not found: ${METADATA_FILE}`)
      return []
    }

    const data = await fsPromises.readFile(METADATA_FILE, "utf8")
    const lines = data.split("\n")
    const headers = lines[0].split(",")

    const results = []

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      // Handle CSV properly (considering quoted fields with commas)
      const values = lines[i].split(",")
      const entry: Record<string, string> = {}

      for (let j = 0; j < headers.length; j++) {
        entry[headers[j].trim()] = values[j] ? values[j].trim() : ""
      }

      results.push(entry)
    }

    return results
  } catch (error) {
    console.error("Error reading CSV:", error)
    return []
  }
}

// Function to get random items from an array
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Function to check if an image exists for a product
function imageExists(productId: string): boolean {
  const imagePath = path.join(IMAGE_FOLDER, `${productId}.jpg`)
  return fs.existsSync(imagePath)
}

// Main function to get trending categories
export async function getTrendingCategories(count = 20): Promise<TrendingCategory[]> {
  try {
    // Read the CSV data
    const products = await readCSV()

    if (products.length === 0) {
      console.error("No products found in the dataset")
      return getMockTrendingCategories(count)
    }

    // Filter products to only include those with images
    const productsWithImages = products.filter((product) => product.id && imageExists(product.id))

    if (productsWithImages.length === 0) {
      console.error("No products with images found")
      return getMockTrendingCategories(count)
    }

    // Create an array to store all possible categories
    let allCategories: TrendingCategory[] = []

    // Loop through all category types to generate more variety
    for (const categoryType of Object.keys(CATEGORY_TYPES)) {
      const categoryValues = CATEGORY_TYPES[categoryType as keyof typeof CATEGORY_TYPES]

      for (const categoryValue of categoryValues) {
        const matchingProducts = productsWithImages.filter((product) => product[categoryType] === categoryValue)

        if (matchingProducts.length > 0) {
          // Get a random product for this category
          const randomProduct = matchingProducts[Math.floor(Math.random() * matchingProducts.length)]

          allCategories.push({
            name: `${categoryValue} ${categoryType === "masterCategory" ? "Collection" : categoryType === "gender" ? "Fashion" : categoryType === "season" ? "Season" : "Style"}`,
            slug: categoryValue.toLowerCase().replace(/\s+/g, "-"),
            image: `/api/images/${randomProduct.id}`,
            productId: randomProduct.id,
          })
        }
      }
    }

    // If we don't have enough categories, add mock categories
    if (allCategories.length < count) {
      const mockCategories = getMockTrendingCategories(count - allCategories.length)
      allCategories = [...allCategories, ...mockCategories]
    }

    // Get random categories up to the requested count, ensuring we have at least 'count' unique categories
    return getRandomItems(allCategories, count)
  } catch (error) {
    console.error("Error getting trending categories:", error)
    return getMockTrendingCategories(count)
  }
}

// Update the mock trending categories function to support more items
function getMockTrendingCategories(count = 20): TrendingCategory[] {
  const mockCategories = [
    { name: "Summer Collection", slug: "summer", image: "/placeholder.svg?height=300&width=300", productId: "mock1" },
    { name: "Casual Wear", slug: "casual", image: "/placeholder.svg?height=300&width=300", productId: "mock2" },
    { name: "Formal Attire", slug: "formal", image: "/placeholder.svg?height=300&width=300", productId: "mock3" },
    { name: "Accessories", slug: "accessories", image: "/placeholder.svg?height=300&width=300", productId: "mock4" },
    { name: "Men's Fashion", slug: "men", image: "/placeholder.svg?height=300&width=300", productId: "mock5" },
    { name: "Women's Collection", slug: "women", image: "/placeholder.svg?height=300&width=300", productId: "mock6" },
    { name: "Winter Season", slug: "winter", image: "/placeholder.svg?height=300&width=300", productId: "mock7" },
    { name: "Sports Style", slug: "sports", image: "/placeholder.svg?height=300&width=300", productId: "mock8" },
    { name: "Ethnic Wear", slug: "ethnic", image: "/placeholder.svg?height=300&width=300", productId: "mock9" },
    { name: "Party Collection", slug: "party", image: "/placeholder.svg?height=300&width=300", productId: "mock10" },
    { name: "Travel Essentials", slug: "travel", image: "/placeholder.svg?height=300&width=300", productId: "mock11" },
    { name: "Beach Wear", slug: "beach", image: "/placeholder.svg?height=300&width=300", productId: "mock12" },
    { name: "Office Attire", slug: "office", image: "/placeholder.svg?height=300&width=300", productId: "mock13" },
    { name: "Luxury Items", slug: "luxury", image: "/placeholder.svg?height=300&width=300", productId: "mock14" },
    { name: "Streetwear", slug: "street", image: "/placeholder.svg?height=300&width=300", productId: "mock15" },
    { name: "Vintage Style", slug: "vintage", image: "/placeholder.svg?height=300&width=300", productId: "mock16" },
    { name: "Athleisure", slug: "athleisure", image: "/placeholder.svg?height=300&width=300", productId: "mock17" },
    { name: "Denim Collection", slug: "denim", image: "/placeholder.svg?height=300&width=300", productId: "mock18" },
    { name: "Footwear", slug: "footwear", image: "/placeholder.svg?height=300&width=300", productId: "mock19" },
    { name: "Kids Fashion", slug: "kids", image: "/placeholder.svg?height=300&width=300", productId: "mock20" },
    {
      name: "Sustainable Fashion",
      slug: "sustainable",
      image: "/placeholder.svg?height=300&width=300",
      productId: "mock21",
    },
    { name: "Designer Brands", slug: "designer", image: "/placeholder.svg?height=300&width=300", productId: "mock22" },
    {
      name: "Affordable Trends",
      slug: "affordable",
      image: "/placeholder.svg?height=300&width=300",
      productId: "mock23",
    },
    { name: "Seasonal Sale", slug: "sale", image: "/placeholder.svg?height=300&width=300", productId: "mock24" },
  ]

  return getRandomItems(mockCategories, count)
}

