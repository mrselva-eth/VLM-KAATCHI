import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Missing or invalid authorization header" }, { status: 401 })
    }

    // Extract token
    const token = authHeader.substring(7)

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "kaatchi-secret-key") as jwt.JwtPayload

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Get user stats
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(decoded.userId) }, { projection: { stats: 1 } })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Return stats or initialize if not present
    const stats = user.stats || {
      chat_query: 0,
      search_text: 0,
      search_image: 0,
      search_multimodal: 0,
      lastActivity: {},
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Get analytics stats error:", error)
    return NextResponse.json({ message: "An error occurred while fetching analytics stats" }, { status: 500 })
  }
}

