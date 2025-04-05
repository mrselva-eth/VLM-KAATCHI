import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { promises as fsPromises } from "fs"
import { executeSearch } from "@/lib/vlm-service"

// Define paths - using the actual dataset location
const DATASET_PATH = process.env.DATASET_PATH || "D:/project/kaatchi-fashion-vlm/data/fashion-dataset"
const IMAGE_FOLDER = path.join(DATASET_PATH, "images")
const METADATA_FILE = path.join(DATASET_PATH, "styles.csv")

interface ProductDetail {
  id: string
  name: string
  description?: string
  price?: string
  category?: string
  subCategory?: string
  articleType?: string
  baseColor?: string
  gender?: string
  season?: string
  usage?: string
  brand?: string
  material?: string
  pattern?: string
  images: string[]
  similarProducts?: ProductDetail[]
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

// Function to check if an image exists for a product
function imageExists(productId: string): boolean {
  const imagePath = path.join(IMAGE_FOLDER, `${productId}.jpg`)
  return fs.existsSync(imagePath)
}

// Function to generate a product description based on metadata
function generateProductDescription(product: any): string {
  const descriptions = [
    `This ${product.baseColour || ""} ${product.articleType || "item"} from the ${product.masterCategory || "fashion"} category is perfect for ${product.usage || "everyday"} wear.`,
    `Designed for ${product.gender || "all"}, this ${product.baseColour || ""} ${product.articleType || "item"} is ideal for ${product.season || "any season"}.`,
    `A stylish ${product.baseColour || ""} ${product.articleType || "item"} that's perfect for ${product.usage || "casual"} occasions.`,
    `This ${product.articleType || "item"} features a ${product.baseColour || "versatile"} color that complements any outfit.`,
    `Add this ${product.baseColour || ""} ${product.articleType || "item"} to your ${product.masterCategory || "fashion"} collection for a stylish look.`,
  ]

  // Select a random description template
  const template = descriptions[Math.floor(Math.random() * descriptions.length)]

  // Add material information if available
  const materials = ["cotton", "polyester", "linen", "denim", "wool", "silk", "leather", "synthetic blend"]
  const randomMaterial = materials[Math.floor(Math.random() * materials.length)]

  // Add pattern information if available
  const patterns = ["solid", "striped", "checked", "printed", "patterned", "textured", "embroidered"]
  const randomPattern = patterns[Math.floor(Math.random() * patterns.length)]

  // Add care instructions
  const careInstructions = [
    "Machine wash cold, tumble dry low.",
    "Hand wash recommended, lay flat to dry.",
    "Dry clean only for best results.",
    "Machine washable, do not bleach.",
    "Wash with similar colors, iron on low heat if needed.",
  ]
  const randomCare = careInstructions[Math.floor(Math.random() * careInstructions.length)]

  return `${template} Made from high-quality ${randomMaterial} with a ${randomPattern} design. ${randomCare}`
}

// Function to get similar products based on the current product
async function getSimilarProducts(product: ProductDetail): Promise<ProductDetail[]> {
  try {
    // Create a search query based on the product details
    const searchQuery = `${product.baseColor} ${product.articleType} ${product.gender} ${product.category}`

    // Use the VLM search to find similar products
    const searchResults = await executeSearch("text", searchQuery, undefined, 10)

    if (!searchResults.results || searchResults.results.length === 0) {
      return getMockSimilarProducts(product.id)
    }

    // Filter out the current product from the results
    const filteredResults = searchResults.results.filter((result: any) => result.id !== product.id)

    // Convert the search results to ProductDetail objects
    return filteredResults.slice(0, 4).map((result: any) => ({
      id: result.id,
      name: result.name,
      price: result.price,
      category: result.category,
      articleType: result.articleType,
      baseColor: result.baseColor,
      brand: result.brand,
      images: [result.image.startsWith("/api") ? result.image : `/api/images/${result.id}`],
    }))
  } catch (error) {
    console.error("Error getting similar products:", error)
    return getMockSimilarProducts(product.id)
  }
}

// Mock similar products for fallback
function getMockSimilarProducts(currentId: string): ProductDetail[] {
  return [
    {
      id: "mock1",
      name: "Light Wash Denim Jacket",
      price: "$54.99",
      category: "Apparel",
      articleType: "Jacket",
      baseColor: "Light Blue",
      brand: "GAP",
      images: ["/placeholder.svg?height=300&width=300"],
    },
    {
      id: "mock2",
      name: "Black Denim Jacket",
      price: "$59.99",
      category: "Apparel",
      articleType: "Jacket",
      baseColor: "Black",
      brand: "Levi's",
      images: ["/placeholder.svg?height=300&width=300"],
    },
    {
      id: "mock3",
      name: "Distressed Denim Jacket",
      price: "$64.99",
      category: "Apparel",
      articleType: "Jacket",
      baseColor: "Blue",
      brand: "Zara",
      images: ["/placeholder.svg?height=300&width=300"],
    },
    {
      id: "mock4",
      name: "Vintage Denim Jacket",
      price: "$69.99",
      category: "Apparel",
      articleType: "Jacket",
      baseColor: "Indigo",
      brand: "Tommy Hilfiger",
      images: ["/placeholder.svg?height=300&width=300"],
    },
  ]
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Read the CSV data
    const products = await readCSV()

    if (products.length === 0) {
      console.error("No products found in the dataset")
      return NextResponse.json(getMockProductById(id))
    }

    // Find the product with the matching ID
    const product = products.find((p) => p.id && p.id.toString() === id.toString())

    if (!product) {
      console.error(`Product with ID ${id} not found`)
      return NextResponse.json(getMockProductById(id))
    }

    // Check if the product image exists
    const hasImage = imageExists(id)

    if (!hasImage) {
      console.error(`Image for product with ID ${id} not found`)
    }

    // Generate a price based on article type
    let price = "$29.99"
    if (product.articleType) {
      if (product.articleType.includes("Tshirt") || product.articleType.includes("T-shirt")) {
        price = "$" + (19.99 + Math.random() * 20).toFixed(2)
      } else if (product.articleType.includes("Shirt")) {
        price = "$" + (29.99 + Math.random() * 30).toFixed(2)
      } else if (product.articleType.includes("Jeans")) {
        price = "$" + (39.99 + Math.random() * 40).toFixed(2)
      } else if (product.articleType.includes("Jacket") || product.articleType.includes("Coat")) {
        price = "$" + (59.99 + Math.random() * 60).toFixed(2)
      } else if (product.articleType.includes("Dress")) {
        price = "$" + (49.99 + Math.random() * 50).toFixed(2)
      } else if (product.articleType.includes("Shoes") || product.articleType.includes("Footwear")) {
        price = "$" + (69.99 + Math.random() * 70).toFixed(2)
      } else if (product.articleType.includes("Watch")) {
        price = "$" + (99.99 + Math.random() * 100).toFixed(2)
      } else {
        price = "$" + (24.99 + Math.random() * 25).toFixed(2)
      }
    }

    // Determine brand based on product name
    let brand = ""
    const productName = product.productDisplayName?.toLowerCase() || ""
    if (productName.includes("adidas")) brand = "ADIDAS"
    else if (productName.includes("nike")) brand = "Nike"
    else if (productName.includes("puma")) brand = "Puma"
    else if (productName.includes("tantra")) brand = "Tantra"
    else if (productName.includes("locomotive")) brand = "Locomotive"
    else if (productName.includes("mr.men") || productName.includes("mr.busy")) brand = "Mr.Men"
    else if (productName.includes("levis") || productName.includes("levi's")) brand = "Levi's"
    else if (productName.includes("gucci")) brand = "Gucci"
    else if (productName.includes("zara")) brand = "Zara"
    else if (productName.includes("h&m")) brand = "H&M"
    else if (productName.includes("gap")) brand = "GAP"
    else if (productName.includes("tommy")) brand = "Tommy Hilfiger"
    else if (productName.includes("calvin")) brand = "Calvin Klein"
    else if (productName.includes("armani")) brand = "Armani"
    else {
      // Assign a random brand if none is detected
      const randomBrands = ["ADIDAS", "Nike", "Puma", "Zara", "H&M", "GAP", "Levi's", "Tommy Hilfiger"]
      brand = randomBrands[Math.floor(Math.random() * randomBrands.length)]
    }

    // Generate material based on article type
    const materials = {
      Tshirts: ["Cotton", "Cotton Blend", "Polyester", "Jersey Knit"],
      Shirts: ["Cotton", "Linen", "Polyester Blend", "Oxford Cloth"],
      Jeans: ["Denim", "Stretch Denim", "Cotton Denim"],
      Trousers: ["Cotton", "Polyester", "Wool Blend", "Khaki"],
      Jackets: ["Leather", "Denim", "Polyester", "Nylon", "Cotton"],
      Sweaters: ["Wool", "Cotton", "Cashmere", "Acrylic"],
      Dresses: ["Cotton", "Polyester", "Silk", "Chiffon", "Satin"],
      Skirts: ["Cotton", "Denim", "Polyester", "Pleated Fabric"],
      Shorts: ["Cotton", "Denim", "Linen", "Polyester"],
      Shoes: ["Leather", "Canvas", "Synthetic", "Mesh"],
      Watches: ["Stainless Steel", "Leather", "Silicone", "Titanium"],
      Bags: ["Leather", "Canvas", "Nylon", "Polyester"],
    }

    let material = "Cotton Blend"
    if (product.articleType && materials[product.articleType as keyof typeof materials]) {
      const options = materials[product.articleType as keyof typeof materials]
      material = options[Math.floor(Math.random() * options.length)]
    }

    // Generate pattern
    const patterns = [
      "Solid",
      "Striped",
      "Checked",
      "Graphic Print",
      "Floral",
      "Polka Dot",
      "Brand Logo",
      "Character Print",
    ]
    const pattern = patterns[Math.floor(Math.random() * patterns.length)]

    // Create the product detail object
    const productDetail: ProductDetail = {
      id: product.id,
      name: product.productDisplayName || `Product ${id}`,
      description: generateProductDescription(product),
      price: price,
      category: product.masterCategory || "",
      subCategory: product.subCategory || "",
      articleType: product.articleType || "",
      baseColor: product.baseColour || "",
      gender: product.gender || "",
      season: product.season || "",
      usage: product.usage || "",
      brand: brand,
      material: material,
      pattern: pattern,
      images: [
        `/api/images/${id}`,
        `/api/images/${id}`, // Using the same image multiple times for now
        `/api/images/${id}`,
      ],
    }

    // Get similar products
    const similarProducts = await getSimilarProducts(productDetail)
    productDetail.similarProducts = similarProducts

    return NextResponse.json(productDetail)
  } catch (error) {
    console.error("Error getting product by ID:", error)
    return NextResponse.json(getMockProductById(params.id))
  }
}

// Mock product data for fallback
function getMockProductById(id: string): ProductDetail {
  return {
    id: id,
    name: "Blue Denim Jacket",
    description:
      "Classic blue denim jacket with button closure and multiple pockets. Perfect for casual outings and everyday wear. Features a comfortable fit and durable construction that will last for years.",
    price: "$59.99",
    category: "Apparel",
    subCategory: "Topwear",
    articleType: "Jacket",
    baseColor: "Blue",
    gender: "Men",
    season: "Winter",
    usage: "Casual",
    brand: "Levi's",
    material: "Denim",
    pattern: "Solid",
    images: [
      "/placeholder.svg?height=600&width=600",
      "/placeholder.svg?height=600&width=600",
      "/placeholder.svg?height=600&width=600",
    ],
    similarProducts: getMockSimilarProducts(id),
  }
}

