import { type NextRequest, NextResponse } from "next/server"
import {
  checkDatasetAvailability,
  checkEmbeddingsAvailability,
  saveTempImage,
  executeSearch,
  cleanupTempFile,
  validateFashionImage,
  validateTextImageCoherence,
} from "@/lib/vlm-service"

// Update the POST function to support a larger number of results
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const searchType = formData.get("searchType") as "text" | "image" | "multimodal"
    const query = formData.get("query") as string | undefined
    const imageFile = formData.get("image") as File | undefined
    const topK = Number.parseInt((formData.get("topK") as string) || "50", 10) // Changed default from 5 to 50

    // Check if dataset and embeddings are available
    const datasetAvailable = await checkDatasetAvailability()
    const embeddingsAvailable = await checkEmbeddingsAvailability()

    let imagePath: string | undefined
    let dominantColors: string[] | undefined

    // Save uploaded image to temp directory if provided
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer())

      // Validate the image if it's an image search or multimodal search
      if (searchType === "image" || searchType === "multimodal") {
        const validationResult = await validateFashionImage(buffer)

        // Extract dominant colors from the validation result
        dominantColors = validationResult.dominantColors

        // If the image is not valid, return an error
        if (!validationResult.isValid) {
          return NextResponse.json(
            {
              error:
                validationResult.message ||
                "The uploaded image doesn't appear to be fashion-related. Please upload an image of clothing or fashion items.",
              isValidationError: true,
            },
            { status: 400 },
          )
        }

        // For multimodal search, also validate text-image coherence
        if (searchType === "multimodal" && query) {
          const coherenceResult = await validateTextImageCoherence(query, buffer)

          // If the text and image are not coherent, return an error
          if (!coherenceResult.isCoherent) {
            return NextResponse.json(
              {
                error: coherenceResult.message,
                isValidationError: true,
                coherenceSimilarity: coherenceResult.similarity,
              },
              { status: 400 },
            )
          }
        }
      }

      imagePath = await saveTempImage(buffer)
    }

    // If dataset or embeddings are not available, return an error
    if (!datasetAvailable || !embeddingsAvailable) {
      console.log("Dataset or embeddings not available")
      return NextResponse.json(
        {
          error: "Fashion dataset is not available. Please ensure the dataset is properly configured.",
          results: [],
        },
        { status: 500 },
      )
    }

    // Execute search with dominant colors information
    const results = await executeSearch(searchType, query, imagePath, topK, dominantColors)

    // Clean up temp file if it was created
    if (imagePath) {
      cleanupTempFile(imagePath)
    }

    // If no results were found, return a specific message
    if (!results.results || results.results.length === 0) {
      return NextResponse.json({
        results: [],
        error:
          searchType === "image"
            ? "No matching fashion items found for this image. Please try a different image."
            : searchType === "multimodal"
              ? "No matching fashion items found for this combination of text and image. Please try different search terms or image."
              : "No matching fashion items found. Please try different search terms.",
      })
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("VLM search error:", error)
    return NextResponse.json(
      {
        error: "Failed to process search request",
        results: [],
      },
      { status: 500 },
    )
  }
}

