import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Validate email
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ message: "Invalid email address" }, { status: 400 })
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Check if we have an authenticated user
    let userId = null
    const authHeader = request.headers.get("Authorization")

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        // Extract token
        const token = authHeader.substring(7)

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "kaatchi-secret-key") as jwt.JwtPayload
        userId = decoded.userId
      } catch (error) {
        console.error("Token verification error:", error)
        // Continue without user ID if token is invalid
      }
    }

    // If we have a user ID, update the user record
    if (userId) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            newsletterSubscribed: false,
            newsletterUnsubscribedAt: new Date().toISOString(),
          },
        },
      )

      return NextResponse.json({
        message: "You've been successfully unsubscribed from our newsletter.",
      })
    }

    // Update user if exists
    const userResult = await db.collection("users").updateOne(
      { email },
      {
        $set: {
          newsletterSubscribed: false,
          newsletterUnsubscribedAt: new Date().toISOString(),
        },
      },
    )

    // Remove from newsletter subscribers collection
    const subscriberResult = await db.collection("newsletter_subscribers").deleteOne({ email })

    if (userResult.matchedCount === 0 && subscriberResult.deletedCount === 0) {
      return NextResponse.json(
        {
          message: "Email not found in our subscription list.",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      message: "You've been successfully unsubscribed from our newsletter.",
    })
  } catch (error) {
    console.error("Newsletter unsubscription error:", error)
    return NextResponse.json(
      {
        message: "An error occurred while processing your unsubscription",
      },
      { status: 500 },
    )
  }
}

