import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

type AnalyticsAction = "chat_query" | "search_text" | "search_image" | "search_multimodal"

export async function POST(request: Request) {
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

    // Get request body
    const { action, query, metadata } = await request.json()

    // Validate action
    if (!action || !["chat_query", "search_text", "search_image", "search_multimodal"].includes(action)) {
      return NextResponse.json({ message: "Invalid action type" }, { status: 400 })
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Create analytics event
    const analyticsEvent = {
      userId: new ObjectId(decoded.userId),
      action,
      query: query || null,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    }

    // Insert into analytics collection
    await db.collection("analytics").insertOne(analyticsEvent)

    // Update user stats in the users collection
    const updateField = `stats.${action}`
    await db.collection("users").updateOne(
      { _id: new ObjectId(decoded.userId) },
      {
        $inc: { [updateField]: 1 },
        $set: {
          [`stats.lastActivity.${action}`]: new Date().toISOString(),
        },
      },
      { upsert: true },
    )

    return NextResponse.json({
      message: "Analytics event tracked successfully",
    })
  } catch (error) {
    console.error("Analytics tracking error:", error)
    return NextResponse.json({ message: "An error occurred while tracking analytics" }, { status: 500 })
  }
}

