import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

// Deduct KAI for an action
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
    const { action, details } = await request.json()

    // Validate action
    if (!action || !["search", "chat"].includes(action)) {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Get user's current balance
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(decoded.userId) }, { projection: { kaiBalance: 1 } })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const currentBalance = user.kaiBalance || 0

    // Check if user has enough balance
    if (currentBalance < 1) {
      return NextResponse.json(
        {
          message: "Insufficient KAI balance",
          balance: currentBalance,
        },
        { status: 400 },
      )
    }

    // Deduct KAI
    const deductAmount = 1
    const newBalance = currentBalance - deductAmount

    // Update user's balance
    await db.collection("users").updateOne({ _id: new ObjectId(decoded.userId) }, { $set: { kaiBalance: newBalance } })

    // Create transaction record
    const transaction = {
      userId: decoded.userId,
      amount: deductAmount,
      type: "debit",
      description: `${action.charAt(0).toUpperCase() + action.slice(1)} usage`,
      details: details || undefined,
      createdAt: new Date().toISOString(),
    }

    await db.collection("kai_transactions").insertOne(transaction)

    return NextResponse.json({
      message: "KAI deducted successfully",
      balance: newBalance,
    })
  } catch (error) {
    console.error("Error deducting KAI:", error)
    return NextResponse.json({ message: "An error occurred while deducting KAI" }, { status: 500 })
  }
}

