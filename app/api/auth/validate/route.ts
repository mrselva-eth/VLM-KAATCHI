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

    // Find user by ID
    const user = await db.collection("users").findOne({
      _id: new ObjectId(decoded.userId),
    })

    // Check if user exists
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Return user data (excluding password)
    const { password, ...userWithoutPassword } = user

    return NextResponse.json({
      message: "Token is valid",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.json({ message: "Invalid token" }, { status: 401 })
  }
}

