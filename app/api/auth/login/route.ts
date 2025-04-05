import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { compare } from "bcrypt"
import jwt from "jsonwebtoken"

export async function POST(request: Request) {
  try {
    const { emailOrUsername, password } = await request.json()

    // Validate required fields
    if (!emailOrUsername || !password) {
      return NextResponse.json({ message: "Email/username and password are required" }, { status: 400 })
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Find user by email or username
    const user = await db.collection("users").findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    })

    // Check if user exists
    if (!user) {
      return NextResponse.json({ message: "Invalid email/username or password" }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid email/username or password" }, { status: 401 })
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET || "kaatchi-secret-key",
      { expiresIn: "7d" },
    )

    // Return user data (excluding password) and token
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: "Login successful",
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "An error occurred during login" }, { status: 500 })
  }
}

