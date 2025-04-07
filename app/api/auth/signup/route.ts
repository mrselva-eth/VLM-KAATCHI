import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { hash } from "bcrypt"
import jwt from "jsonwebtoken"

export async function POST(request: Request) {
  try {
    const { username, email, firstName, lastName, password, dob } = await request.json()

    // Validate required fields
    if (!username || !email || !firstName || !lastName || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Check if username already exists
    const existingUserByUsername = await db.collection("users").findOne({ username })
    if (existingUserByUsername) {
      return NextResponse.json({ message: "Username already exists" }, { status: 400 })
    }

    // Check if email already exists
    const existingUserByEmail = await db.collection("users").findOne({ email })
    if (existingUserByEmail) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create user
    const now = new Date()
    const user = {
      username,
      email,
      firstName,
      lastName,
      dob: dob || null,
      password: hashedPassword,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      kaiBalance: 0, // Initialize KAI balance to 0
      bonusClaimed: false, // Initialize bonus claimed flag
    }

    // Insert user into database
    const result = await db.collection("users").insertOne(user)

    // Create JWT token
    const token = jwt.sign(
      {
        userId: result.insertedId.toString(),
        username,
        email,
      },
      process.env.JWT_SECRET || "kaatchi-secret-key",
      { expiresIn: "7d" },
    )

    // Return user data (excluding password) and token
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: "User created successfully",
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ message: "An error occurred during signup" }, { status: 500 })
  }
}

