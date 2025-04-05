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
      const result = await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            newsletterSubscribed: true,
            newsletterSubscribedAt: new Date().toISOString(),
          },
        },
      )

      if (result.matchedCount === 0) {
        // User not found, create a new subscriber
        await db.collection("newsletter_subscribers").insertOne({
          email,
          subscribedAt: new Date().toISOString(),
        })
      }

      return NextResponse.json({
        message: "You've been successfully subscribed to our newsletter!",
      })
    }

    // Check if the email already exists in users collection
    const existingUser = await db.collection("users").findOne({ email })

    if (existingUser) {
      // Update existing user
      await db.collection("users").updateOne(
        { email },
        {
          $set: {
            newsletterSubscribed: true,
            newsletterSubscribedAt: new Date().toISOString(),
          },
        },
      )
    } else {
      // Check if already subscribed in the newsletter collection
      const existingSubscriber = await db.collection("newsletter_subscribers").findOne({ email })

      if (existingSubscriber) {
        return NextResponse.json({
          message: "You're already subscribed to our newsletter!",
        })
      }

      // Create new subscriber
      await db.collection("newsletter_subscribers").insertOne({
        email,
        subscribedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      message: "Thank you for subscribing to our newsletter!",
    })
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    return NextResponse.json(
      {
        message: "An error occurred while processing your subscription",
      },
      { status: 500 },
    )
  }
}

