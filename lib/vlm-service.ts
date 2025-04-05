import path from "path"
import fs from "fs"
import { exec } from "child_process"
import { promisify } from "util"
import os from "os"

const execAsync = promisify(exec)

// Define paths - using the actual dataset location
const DATASET_PATH = process.env.DATASET_PATH || "D:/project/kaatchi-fashion-vlm/data/fashion-dataset"
const IMAGE_FOLDER = path.join(DATASET_PATH, "images")
const METADATA_FILE = path.join(DATASET_PATH, "styles.csv")
const EMBEDDINGS_PATH = path.join(DATASET_PATH, "embeddings")
const FAISS_INDEX_PATH = path.join(EMBEDDINGS_PATH, "fashion_faiss.index")

// Only log in development and only to server console, never to client
const isDev = process.env.NODE_ENV === "development"
const log = isDev ? (...args: any[]) => console.log("[Server]", ...args) : () => {}

// Check if the dataset is available
export async function checkDatasetAvailability(): Promise<boolean> {
  try {
    return fs.existsSync(DATASET_PATH) && fs.existsSync(IMAGE_FOLDER) && fs.existsSync(METADATA_FILE)
  } catch (error) {
    if (isDev) console.error("[Server] Error checking dataset availability:", error)
    return false
  }
}

// Check if embeddings and index are already generated
export async function checkEmbeddingsAvailability(): Promise<boolean> {
  try {
    return (
      fs.existsSync(EMBEDDINGS_PATH) &&
      fs.existsSync(path.join(EMBEDDINGS_PATH, "image_embeddings.npy")) &&
      fs.existsSync(path.join(EMBEDDINGS_PATH, "text_embeddings.npy")) &&
      fs.existsSync(FAISS_INDEX_PATH)
    )
  } catch (error) {
    if (isDev) console.error("[Server] Error checking embeddings availability:", error)
    return false
  }
}

// Save temporary image for processing
export async function saveTempImage(imageBuffer: Buffer): Promise<string> {
  const tempDir = os.tmpdir()
  const imagePath = path.join(tempDir, `upload_${Date.now()}.jpg`)

  try {
    fs.writeFileSync(imagePath, imageBuffer)
    return imagePath
  } catch (error) {
    if (isDev) console.error("[Server] Error saving temporary image:", error)
    throw new Error("Failed to save temporary image")
  }
}

// Update the validateFashionImage function to be more sensitive to accessories
export async function validateFashionImage(imageBuffer: Buffer): Promise<{
  isValid: boolean
  message: string
  dominantColors?: string[]
}> {
  try {
    // Save the image to a temporary file for processing
    const tempDir = os.tmpdir()
    const imagePath = path.join(tempDir, `validate_${Date.now()}.jpg`)
    fs.writeFileSync(imagePath, imageBuffer)

    try {
      // Path to the Python script
      const scriptPath = path.join(process.cwd(), "lib", "clip_search.py")

      // Execute a simple classification to determine if the image is fashion-related
      // Added color-detection flag to improve color extraction and a new rotation-check flag
      const command = `python "${scriptPath}" --search-type validate --image-path "${imagePath}" --color-detection --rotation-check --quiet`

      const { stdout, stderr } = await execAsync(command)

      // Parse the validation result
      const result = JSON.parse(stdout)

      // Check if the image contains fashion elements with stricter thresholds
      if (result.validation && result.validation.categories) {
        const categories = result.validation.categories

        // Define fashion-related keywords to detect in image classification
        const fashionKeywords = [
          "clothing",
          "fashion",
          "apparel",
          "wear",
          "dress",
          "shirt",
          "pants",
          "jeans",
          "t-shirt",
          "jacket",
          "coat",
          "sweater",
          "skirt",
          "blouse",
          "suit",
          "tie",
          "scarf",
          "hat",
          "cap",
          "shoes",
          "boots",
          "sneakers",
          "heels",
          "sandals",
          "accessories",
          "jewelry",
          "watch",
          "bag",
          "purse",
          "handbag",
          "backpack",
          "sunglasses",
          "glasses",
          "belt",
          "wallet",
        ]

        // Add specific accessory keywords with lower threshold
        const accessoryKeywords = [
          "bag",
          "purse",
          "handbag",
          "backpack",
          "wallet",
          "accessories",
          "watch",
          "jewelry",
          "belt",
          "sunglasses",
          "glasses",
        ]

        // Check if any of the top 3 categories contain fashion keywords with higher confidence threshold
        const hasFashionKeywords = categories
          .slice(0, 3)
          .some(
            (cat: any) =>
              fashionKeywords.some((keyword) => cat.name.toLowerCase().includes(keyword)) && cat.confidence > 0.35,
          )

        // Special check for accessories with a lower threshold
        const hasAccessoryKeywords = categories
          .slice(0, 5) // Check top 5 categories for accessories
          .some(
            (cat: any) =>
              accessoryKeywords.some((keyword) => cat.name.toLowerCase().includes(keyword)) && cat.confidence > 0.2,
          )

        // Check if the top category is definitely not fashion-related
        const topCategory = categories[0]
        const isTopCategoryNonFashion = !fashionKeywords.some((keyword) =>
          topCategory.name.toLowerCase().includes(keyword),
        )

        // Accept if it has fashion keywords or accessory keywords
        if (hasFashionKeywords || hasAccessoryKeywords) {
          const dominantColors = result.validation?.dominantColors || []
          return {
            isValid: true,
            message: "Valid fashion image",
            dominantColors,
          }
        }

        // Reject if no fashion keywords are found in top categories or if top category is definitely non-fashion
        if (!hasFashionKeywords || (isTopCategoryNonFashion && topCategory.confidence > 0.5)) {
          // Check if the image was rotated and validated successfully
          if (
            result.validation.rotatedValidation &&
            (result.validation.rotatedValidation.is_fashion_related ||
              result.validation.rotatedValidation.accessory_override)
          ) {
            // If the rotated image is valid, use the dominant colors from the rotated image if available
            const dominantColors =
              result.validation.rotatedValidation.dominantColors || result.validation.dominantColors || []

            return {
              isValid: true,
              message: "Valid fashion image (auto-rotated)",
              dominantColors,
            }
          }

          return {
            isValid: false,
            message:
              "The uploaded image doesn't appear to be fashion-related. Please upload an image of clothing, accessories, or fashion items.",
          }
        }
      }

      // Extract dominant colors from the validation result
      const dominantColors = result.validation?.dominantColors || []

      // Default to accepting the image only if we're confident it's fashion-related
      return {
        isValid: true,
        message: "Valid fashion image",
        dominantColors,
      }
    } catch (error) {
      // If there's an error in validation, be more conservative and reject the image
      if (isDev) console.error("[Server] Error validating image:", error)
      return {
        isValid: false,
        message:
          "Unable to validate if this is a fashion image. Please try uploading a clearer image of clothing or accessories.",
      }
    } finally {
      // Clean up the temporary file
      cleanupTempFile(imagePath)
    }
  } catch (error) {
    if (isDev) console.error("[Server] Error in validateFashionImage:", error)
    return {
      isValid: false,
      message: "Error processing image. Please try again with a different image.",
    }
  }
}

// Update the executeSearch function to pass dominant color information to the Python script
export async function executeSearch(
  searchType: "text" | "image" | "multimodal",
  query?: string,
  imagePath?: string,
  topK = 50, // Changed default from 5 to 50
  dominantColors?: string[],
): Promise<any> {
  try {
    // Path to the Python script
    const scriptPath = path.join(process.cwd(), "lib", "clip_search.py")

    // Build command with appropriate arguments
    let command = `python "${scriptPath}" --search-type ${searchType} --top-k ${topK} --quiet`

    if (query) {
      command += ` --query "${query}"`
    }

    if (imagePath) {
      command += ` --image-path "${imagePath}"`
    }

    // Add dominant colors if available
    if (dominantColors && dominantColors.length > 0) {
      command += ` --dominant-colors "${dominantColors.join(",")}"`
    }

    // Set environment variables for the child process to fix OpenMP conflicts
    const env = {
      ...process.env,
      KMP_DUPLICATE_LIB_OK: "TRUE", // This allows multiple OpenMP runtimes
      PYTHONUNBUFFERED: "1", // Prevent Python from buffering stdout/stderr
    }

    // Execute Python script with the modified environment
    const { stdout, stderr } = await execAsync(command, { env })

    if (stderr && stderr.trim() !== "" && isDev) {
      // Only log stderr in development if it contains actual error messages
      if (stderr.includes("Error") || stderr.includes("Exception") || stderr.includes("Failed")) {
        console.error("[Server] Python Error:", stderr)
      }
    }

    // Parse and return results
    try {
      // Pre-process the JSON to handle NaN values before parsing
      const processedOutput = stdout.replace(/: NaN/g, ": null")
      const results = JSON.parse(processedOutput)

      // Enhance results with additional processing
      if (results.results && Array.isArray(results.results)) {
        results.results = results.results.map((item) => {
          // Format similarity to be a value between 0 and 1
          if (item.similarity !== undefined) {
            item.similarity = Math.abs(item.similarity)
            if (item.similarity > 1) item.similarity = item.similarity / 100
          }

          // Add brand information based on product name
          const productName = item.name?.toLowerCase() || ""
          if (productName.includes("adidas")) item.brand = "ADIDAS"
          else if (productName.includes("nike")) item.brand = "Nike"
          else if (productName.includes("puma")) item.brand = "Puma"
          else if (productName.includes("tantra")) item.brand = "Tantra"
          else if (productName.includes("locomotive")) item.brand = "Locomotive"
          else if (productName.includes("mr.men") || productName.includes("mr.busy")) item.brand = "Mr.Men"
          else if (productName.includes("levis") || productName.includes("levi's")) item.brand = "Levi's"
          else if (productName.includes("gucci")) item.brand = "Gucci"
          else if (productName.includes("zara")) item.brand = "Zara"

          // Add mock price based on article type
          if (item.articleType) {
            if (item.articleType.includes("Tshirt") || item.articleType.includes("T-shirt")) {
              item.price = "$" + (19.99 + Math.random() * 20).toFixed(2)
            } else if (item.articleType.includes("Shirt")) {
              item.price = "$" + (29.99 + Math.random() * 30).toFixed(2)
            } else if (item.articleType.includes("Jeans")) {
              item.price = "$" + (39.99 + Math.random() * 40).toFixed(2)
            } else {
              item.price = "$" + (24.99 + Math.random() * 25).toFixed(2)
            }
          }

          // Ensure all required fields are present
          return {
            id: item.id || `product-${Math.random().toString(36).substr(2, 9)}`,
            name: item.name || "Untitled Product",
            category: item.category || "Uncategorized",
            subCategory: item.subCategory || item.sub_category || "",
            articleType: item.articleType || item.article_type || "",
            baseColor: item.baseColor || item.base_color || "",
            gender: item.gender || "",
            usage: item.usage || "",
            similarity: item.similarity || 0.5,
            image: item.image || "/placeholder.svg?height=300&width=300",
            brand: item.brand || "",
            price: item.price || "",
            colorMatch: item.colorMatch || false, // Track if this is a color match
            ...item, // Keep any additional fields
          }
        })
      }

      return results
    } catch (error) {
      if (isDev) {
        console.error("[Server] Error parsing Python output:", error)
        console.log("[Server] Raw output:", stdout)
      }

      // Return an empty result set instead of mock data
      return { results: [], error: "Failed to parse search results" }
    }
  } catch (error) {
    if (isDev) console.error("[Server] Error executing search:", error)

    // Return an empty result set instead of mock data
    return { results: [], error: "Failed to execute search" }
  }
}

// Clean up temporary files
export function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    if (isDev) console.error("[Server] Error cleaning up temporary file:", error)
  }
}

// Update the mockSearch function to provide more realistic and detailed mock data
export async function mockSearch(
  searchType: "text" | "image" | "multimodal",
  query?: string,
  imagePath?: string,
  topK = 5,
): Promise<any> {
  // Enhanced mock results with more realistic fashion data
  const mockResults = [
    {
      id: "t1001",
      name: "Tantra Men's Beer Addict Blue T-shirt",
      category: "Apparel",
      subCategory: "Topwear",
      articleType: "Tshirts",
      baseColor: "Blue",
      gender: "Men",
      usage: "Casual",
      similarity: 0.94,
      image: "/placeholder.svg?height=300&width=300",
      brand: "Tantra",
      price: "$24.99",
      material: "Cotton",
      pattern: "Graphic Print",
    },
    {
      id: "t1002",
      name: "ADIDAS Men Blue Printed T-shirt",
      category: "Apparel",
      subCategory: "Topwear",
      articleType: "Tshirts",
      baseColor: "Blue",
      gender: "Men",
      usage: "Sports",
      similarity: 0.92,
      image: "/placeholder.svg?height=300&width=300",
      brand: "ADIDAS",
      price: "$34.99",
      material: "Polyester",
      pattern: "Brand Logo",
    },
    {
      id: "t1003",
      name: "Mr.Men Men's Mr.Busy Navy Blue T-shirt",
      category: "Apparel",
      subCategory: "Topwear",
      articleType: "Tshirts",
      baseColor: "Navy Blue",
      gender: "Men",
      usage: "Casual",
      similarity: 0.89,
      image: "/placeholder.svg?height=300&width=300",
      brand: "Mr.Men",
      price: "$19.99",
      material: "Cotton Blend",
      pattern: "Character Print",
    },
    {
      id: "t1004",
      name: "Locomotive Men Blue T-shirt",
      category: "Apparel",
      subCategory: "Topwear",
      articleType: "Tshirts",
      baseColor: "Blue",
      gender: "Men",
      usage: "Casual",
      similarity: 0.87,
      image: "/placeholder.svg?height=300&width=300",
      brand: "Locomotive",
      price: "$22.99",
      material: "Cotton",
      pattern: "Solid",
    },
    {
      id: "t1005",
      name: "Puma Men's Royal Blue Sports T-shirt",
      category: "Apparel",
      subCategory: "Topwear",
      articleType: "Tshirts",
      baseColor: "Royal Blue",
      gender: "Men",
      usage: "Sports",
      similarity: 0.85,
      image: "/placeholder.svg?height=300&width=300",
      brand: "Puma",
      price: "$29.99",
      material: "Dri-FIT",
      pattern: "Brand Logo",
    },
    {
      id: "t1006",
      name: "H&M Men's Basic Blue Crew Neck T-shirt",
      category: "Apparel",
      subCategory: "Topwear",
      articleType: "Tshirts",
      baseColor: "Light Blue",
      gender: "Men",
      usage: "Casual",
      similarity: 0.82,
      image: "/placeholder.svg?height=300&width=300",
      brand: "H&M",
      price: "$14.99",
      material: "Cotton",
      pattern: "Solid",
    },
  ]

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Filter results based on query (improved implementation)
  let results = [...mockResults]

  if (query) {
    const queryTerms = query.toLowerCase().split(/\s+/)

    // Score each result based on how many query terms it matches
    results = results.map((item) => {
      const itemText =
        `${item.name} ${item.category} ${item.subCategory} ${item.articleType} ${item.baseColor} ${item.gender} ${item.usage} ${item.brand || ""}`.toLowerCase()

      // Calculate match score based on query terms present
      let matchScore = 0
      for (const term of queryTerms) {
        if (itemText.includes(term)) {
          matchScore += 1
        }
      }

      // Adjust similarity based on match score
      const adjustedSimilarity = item.similarity * (0.7 + 0.3 * (matchScore / queryTerms.length))

      return {
        ...item,
        similarity: adjustedSimilarity,
      }
    })

    // Sort by adjusted similarity
    results.sort((a, b) => b.similarity - a.similarity)
  }

  return { results: results.slice(0, topK) }
}

// Add this function after the existing functions
// Add a new function to validate text-image coherence for multimodal search
export async function validateTextImageCoherence(
  query: string,
  imageBuffer: Buffer,
): Promise<{ isCoherent: boolean; message: string; similarity?: number }> {
  try {
    // Save the image to a temporary file for processing
    const tempDir = os.tmpdir()
    const imagePath = path.join(tempDir, `coherence_${Date.now()}.jpg`)
    fs.writeFileSync(imagePath, imageBuffer)

    try {
      // Path to the Python script
      const scriptPath = path.join(process.cwd(), "lib", "clip_search.py")

      // Execute the coherence check
      const command = `python "${scriptPath}" --search-type coherence --query "${query}" --image-path "${imagePath}" --quiet`

      const { stdout, stderr } = await execAsync(command)

      // Parse the validation result
      const result = JSON.parse(stdout)

      if (result.coherence) {
        const { similarity, is_coherent } = result.coherence

        // Define threshold for coherence
        const coherenceThreshold = 0.2 // This can be adjusted based on testing

        if (!is_coherent || similarity < coherenceThreshold) {
          return {
            isCoherent: false,
            similarity: similarity,
            message: `Your text query "${query}" doesn't seem to match the uploaded image. For better results, please ensure your text description relates to the image content.`,
          }
        }

        return {
          isCoherent: true,
          similarity: similarity,
          message: "Text and image are coherent",
        }
      }

      // Default fallback if no coherence data is returned
      return {
        isCoherent: true,
        message: "Coherence check skipped",
      }
    } catch (error) {
      if (isDev) console.error("[Server] Error validating text-image coherence:", error)
      return { isCoherent: true, message: "Coherence check skipped due to error" }
    } finally {
      // Clean up the temporary file
      cleanupTempFile(imagePath)
    }
  } catch (error) {
    if (isDev) console.error("[Server] Error in validateTextImageCoherence:", error)
    return { isCoherent: true, message: "Coherence check skipped" }
  }
}

