import { NextResponse } from "next/server"
import { getTrendingCategories } from "@/lib/trending-service"

export async function GET(request: Request) {
  try {
    // Get the count parameter from the URL query string
    const url = new URL(request.url)
    const countParam = url.searchParams.get("count")
    const count = countParam ? Number.parseInt(countParam, 10) : 10

    // Ensure count is within reasonable limits but allow at least 10
    const safeCount = Math.min(Math.max(count, 10), 24)

    const categories = await getTrendingCategories(safeCount)
    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Error in trending API:", error)
    return NextResponse.json({ error: "Failed to fetch trending categories" }, { status: 500 })
  }
}

