import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

export async function PUT(request: Request) {
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
    const { profilePicture } = await request.json()

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Update user
    const now = new Date()
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(decoded.userId) },
      {
        $set: {
          profilePicture: profilePicture,
          updatedAt: now.toISOString(),
        },
      },
    )

    // Check if user was updated
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Profile picture updated successfully",
    })
  } catch (error) {
    console.error("Update profile picture error:", error)
    return NextResponse.json({ message: "An error occurred while updating profile picture" }, { status: 500 })
  }
}

