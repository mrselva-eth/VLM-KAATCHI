import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

// Claim signup bonus
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

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Check if user has already claimed bonus
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(decoded.userId) }, { projection: { kaiBalance: 1, bonusClaimed: 1 } })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    if (user.bonusClaimed) {
      return NextResponse.json({ message: "Bonus already claimed" }, { status: 400 })
    }

    // Add bonus to user's balance
    const bonusAmount = 100
    const currentBalance = user.kaiBalance || 0
    const newBalance = currentBalance + bonusAmount

    // Update user's balance and set bonusClaimed flag
    await db.collection("users").updateOne(
      { _id: new ObjectId(decoded.userId) },
      {
        $set: {
          kaiBalance: newBalance,
          bonusClaimed: true,
          bonusClaimedAt: new Date().toISOString(),
        },
      },
    )

    // Create transaction record
    const transaction = {
      userId: decoded.userId,
      amount: bonusAmount,
      type: "credit",
      description: "Signup bonus",
      createdAt: new Date().toISOString(),
    }

    await db.collection("kai_transactions").insertOne(transaction)

    return NextResponse.json({
      message: "Bonus claimed successfully",
      balance: newBalance,
    })
  } catch (error) {
    console.error("Error claiming KAI bonus:", error)
    return NextResponse.json({ message: "An error occurred while claiming bonus" }, { status: 500 })
  }
}

