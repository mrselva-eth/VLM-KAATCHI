import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Define the path to your fashion dataset images
const DATASET_PATH = process.env.DATASET_PATH || "D:/project/kaatchi-fashion-vlm/data/fashion-dataset"
const IMAGE_FOLDER = path.join(DATASET_PATH, "images")

// Only log in development and only to server console, never to client
const isDev = process.env.NODE_ENV === "development"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Construct the path to the image
    const imagePath = path.join(IMAGE_FOLDER, `${id}.jpg`)

    // Check if the image exists
    if (!fs.existsSync(imagePath)) {
      if (isDev) console.error(`[Server] Image not found: ${imagePath}`)
      return new NextResponse(null, { status: 404 })
    }

    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath)

    // Return the image with appropriate content type
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch (error) {
    if (isDev) console.error("[Server] Error serving image:", error)
    return new NextResponse(null, { status: 500 })
  }
}

