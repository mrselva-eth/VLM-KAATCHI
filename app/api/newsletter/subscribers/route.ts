import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

// This endpoint is admin-only and returns all newsletter subscribers
export async function GET(request: Request) {
  try {
    // Check if user is admin
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Extract token
    const token = authHeader.substring(7)

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "kaatchi-secret-key") as jwt.JwtPayload

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Get user
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })

    // Check if user is admin
    const adminUsername = process.env.ADMIN_USERNAME
    if (!adminUsername || user.username !== adminUsername) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    // Get all subscribers from both collections

    // 1. From users collection
    const subscribedUsers = await db
      .collection("users")
      .find({ newsletterSubscribed: true })
      .project({ email: 1, firstName: 1, lastName: 1, newsletterSubscribedAt: 1 })
      .toArray()

    // 2. From newsletter_subscribers collection
    const subscribers = await db.collection("newsletter_subscribers").find({}).toArray()

    // Combine results, ensuring no duplicates
    const userEmails = new Set(subscribedUsers.map((user) => user.email))
    const uniqueSubscribers = subscribers.filter((sub) => !userEmails.has(sub.email))

    const allSubscribers = [
      ...subscribedUsers.map((user) => ({
        email: user.email,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null,
        subscribedAt: user.newsletterSubscribedAt,
        isRegisteredUser: true,
      })),
      ...uniqueSubscribers.map((sub) => ({
        email: sub.email,
        name: null,
        subscribedAt: sub.subscribedAt,
        isRegisteredUser: false,
      })),
    ]

    return NextResponse.json({
      subscribers: allSubscribers,
      total: allSubscribers.length,
    })
  } catch (error) {
    console.error("Error fetching newsletter subscribers:", error)
    return NextResponse.json(
      {
        message: "An error occurred while fetching subscribers",
      },
      { status: 500 },
    )
  }
}

