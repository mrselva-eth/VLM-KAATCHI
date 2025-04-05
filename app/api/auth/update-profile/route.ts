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
    const { firstName, lastName, dob } = await request.json()

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json({ message: "First name and last name are required" }, { status: 400 })
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Update user
    const now = new Date()
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(decoded.userId) },
      {
        $set: {
          firstName,
          lastName,
          dob: dob || null,
          updatedAt: now.toISOString(),
        },
      },
    )

    // Check if user was updated
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ message: "An error occurred while updating profile" }, { status: 500 })
  }
}

