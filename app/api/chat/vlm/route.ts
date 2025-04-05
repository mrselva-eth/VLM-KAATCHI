import { type NextRequest, NextResponse } from "next/server"
import { saveTempImage, cleanupTempFile, executeSearch } from "@/lib/vlm-service"
import path from "path"
import fs from "fs"

// Define paths - these should match your actual dataset location
const DATASET_PATH = process.env.DATASET_PATH || "D:/project/kaatchi-fashion-vlm/data/fashion-dataset"
const IMAGE_FOLDER = path.join(DATASET_PATH, "images")
const METADATA_FILE = path.join(DATASET_PATH, "styles.csv")
const EMBEDDINGS_PATH = path.join(DATASET_PATH, "embeddings")
const FAISS_INDEX_PATH = path.join(EMBEDDINGS_PATH, "fashion_faiss.index")
const CLIP_SEARCH_SCRIPT = path.join(process.cwd(), "lib", "clip_search.py")

// Only log in development and only to server console, never to client
const isDev = process.env.NODE_ENV === "development"
const log = isDev ? (...args: any[]) => console.log("[Server]", ...args) : () => {}

export async function POST(request: NextRequest) {
  try {
    const { message, imageBase64, searchType } = await request.json()

    let imagePath: string | undefined

    // Process image if provided
    if (imageBase64) {
      // Extract base64 data
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "")
      const buffer = Buffer.from(base64Data, "base64")

      // Save to temp file
      imagePath = await saveTempImage(buffer)
    }

    // Check if we have the necessary files for the VLM
    const datasetAvailable = fs.existsSync(DATASET_PATH) && fs.existsSync(IMAGE_FOLDER) && fs.existsSync(METADATA_FILE)

    const embeddingsAvailable =
      fs.existsSync(EMBEDDINGS_PATH) &&
      fs.existsSync(path.join(EMBEDDINGS_PATH, "image_embeddings.npy")) &&
      fs.existsSync(FAISS_INDEX_PATH)

    let results = []

    // Use the actual VLM search with your dataset
    if (datasetAvailable && embeddingsAvailable && fs.existsSync(CLIP_SEARCH_SCRIPT)) {
      try {
        const searchResults = await executeSearch(searchType || "text", message, imagePath)
        results = searchResults.results || []

        if (results.length === 0 && isDev) {
          log("No results found. This could be due to:")
          log("1. No matching items in the dataset")
          log("2. The query terms don't match well with the CLIP embeddings")
          log("3. There might be an issue with the search algorithm")
        }
      } catch (error) {
        if (isDev) console.error("[Server] Error executing VLM search:", error)
        results = []
      }
    } else if (isDev) {
      console.error("[Server] Required files not found. Dataset or embeddings missing.")
      results = []
    }

    // Clean up temp file if it was created
    if (imagePath) {
      cleanupTempFile(imagePath)
    }

    // If no results were found, return an appropriate message
    if (results.length === 0) {
      // Try a fallback search with a more general term
      if (message && message.length > 0) {
        try {
          // Extract key terms from the query
          const terms = message.toLowerCase().split(/\s+/)
          let generalTerm = ""

          // Look for category terms
          if (terms.includes("pants") || terms.includes("pant") || terms.includes("trousers")) {
            generalTerm = "pants"
          } else if (terms.includes("shirt") || terms.includes("tshirt") || terms.includes("t-shirt")) {
            generalTerm = "shirt"
          } else if (terms.includes("dress")) {
            generalTerm = "dress"
          } else if (terms.includes("jacket") || terms.includes("coat")) {
            generalTerm = "jacket"
          } else if (terms.includes("shoes") || terms.includes("sneakers") || terms.includes("footwear")) {
            generalTerm = "shoes"
          } else if (terms.includes("watch") || terms.includes("watches")) {
            generalTerm = "watch"
          } else {
            // Use the first term as a fallback
            generalTerm = terms[0]
          }

          const fallbackResults = await executeSearch("text", generalTerm, imagePath)
          results = fallbackResults.results || []
        } catch (fallbackError) {
          if (isDev) console.error("[Server] Error in fallback search:", fallbackError)
        }
      }

      // If still no results, return the no-results message
      if (results.length === 0) {
        return NextResponse.json({
          response:
            "I couldn't find any matching fashion items in our database. Could you try a different query or image?",
          source: "vlm",
        })
      }
    }

    // Format response for chat interface
    const responseText = formatResponseText(searchType || "text", message, results)

    // Fix image paths to use your actual dataset
    const productsWithFixedPaths = results.slice(0, 4).map((product) => {
      // If the image path doesn't start with http or /, add the correct path
      if (product.image && !product.image.startsWith("/") && !product.image.startsWith("http")) {
        // Convert the image path to use web-friendly format
        product.image = `/api/images/${product.id}`
      }

      // Fix negative similarity scores
      if (product.similarity < 0) {
        product.similarity = Math.abs(product.similarity)
      }

      return product
    })

    return NextResponse.json({
      response: responseText,
      products: productsWithFixedPaths,
      source: "vlm",
    })
  } catch (error) {
    if (isDev) console.error("[Server] VLM chat error:", error)
    return NextResponse.json({ error: "Failed to process VLM chat request" }, { status: 500 })
  }
}

// Format response for chat interface
function formatResponseText(searchType: string, query: string, results: any[]): string {
  if (results.length === 0) {
    return "I couldn't find any matching fashion items. Could you try a different query or image?"
  }

  const topResult = results[0]
  const brandInfo = topResult.brand ? `from ${topResult.brand}` : ""
  const priceInfo = topResult.price ? `priced at ${topResult.price}` : ""
  const materialInfo = topResult.material ? `made of ${topResult.material}` : ""
  const patternInfo = topResult.pattern ? `with a ${topResult.pattern} design` : ""

  // Count how many results are of the same category/type
  const categories = results.map((r) => r.articleType).filter(Boolean)
  const mostCommonCategory =
    categories.length > 0
      ? categories
          .sort((a, b) => categories.filter((v) => v === a).length - categories.filter((v) => v === b).length)
          .pop()
      : topResult.articleType || "item"

  const similarityPercentage = Math.round((topResult.similarity || 0) * 100)

  switch (searchType) {
    case "text":
      return `I found some great options matching your search for "${query}". The top match is a ${topResult.baseColor || ""} ${topResult.articleType || "item"} ${brandInfo} from the ${topResult.category || "fashion"} category ${priceInfo} ${materialInfo} ${patternInfo}. Would you like to see more details about any of these items?`

    case "image":
      return `Based on the image you shared, I found some similar items. The top match is a ${topResult.baseColor || ""} ${topResult.articleType || "item"} ${brandInfo} ${priceInfo} in the ${topResult.category || "fashion"} category. These items have similar style, color, and design to your image with ${similarityPercentage}% similarity.`

    case "multimodal":
      return `Based on both your text description "${query}" and the image you shared, I found some great matches. The top result is a ${topResult.baseColor || ""} ${topResult.articleType || "item"} ${brandInfo} that's ${similarityPercentage}% similar to what you're looking for ${priceInfo} ${materialInfo}. The combination of text and image helps me find more precise matches.`

    default:
      return `I found some ${mostCommonCategory}s that might interest you. Here are a few options from our collection. The top match is ${similarityPercentage}% similar to what you're looking for.`
  }
}

