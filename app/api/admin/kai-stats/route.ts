import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

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

    // Get KAI statistics
    const [totalClaimed, totalSpent, searchSpent, chatSpent] = await Promise.all([
      // Total KAI claimed (signup bonuses)
      db
        .collection("kai_transactions")
        .aggregate([
          { $match: { type: "credit", description: "Signup bonus" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ])
        .toArray()
        .then((result) => result[0]?.total || 0),

      // Total KAI spent
      db
        .collection("kai_transactions")
        .aggregate([{ $match: { type: "debit" } }, { $group: { _id: null, total: { $sum: "$amount" } } }])
        .toArray()
        .then((result) => result[0]?.total || 0),

      // KAI spent on search
      db
        .collection("kai_transactions")
        .aggregate([
          { $match: { type: "debit", description: "Search usage" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ])
        .toArray()
        .then((result) => result[0]?.total || 0),

      // KAI spent on chat
      db
        .collection("kai_transactions")
        .aggregate([
          { $match: { type: "debit", description: "Chat usage" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ])
        .toArray()
        .then((result) => result[0]?.total || 0),
    ])

    // Get users with highest KAI balance
    const topUsers = await db
      .collection("users")
      .find({ kaiBalance: { $exists: true } })
      .sort({ kaiBalance: -1 })
      .limit(5)
      .project({ username: 1, firstName: 1, lastName: 1, kaiBalance: 1, _id: 0 })
      .toArray()

    // Get recent KAI transactions
    const recentTransactions = await db
      .collection("kai_transactions")
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()
      .then((transactions) =>
        transactions.map((t) => ({
          userId: t.userId,
          amount: t.amount,
          type: t.type,
          description: t.description,
          createdAt: t.createdAt,
        })),
      )

    // Get daily KAI transactions for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

    const dailyTransactions = await db
      .collection("kai_transactions")
      .aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgoStr },
          },
        },
        {
          $addFields: {
            dateOnly: {
              $substr: ["$createdAt", 0, 10],
            },
          },
        },
        {
          $group: {
            _id: {
              date: "$dateOnly",
              type: "$type",
            },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.date": 1 } },
      ])
      .toArray()

    // Format daily transactions for chart
    const dailyStats = []
    const dates = Array.from(new Set(dailyTransactions.map((t) => t._id.date))).sort()

    for (const date of dates) {
      const credited = dailyTransactions.find((t) => t._id.date === date && t._id.type === "credit")?.total || 0
      const debited = dailyTransactions.find((t) => t._id.date === date && t._id.type === "debit")?.total || 0

      dailyStats.push({
        date,
        credited,
        debited,
      })
    }

    return NextResponse.json({
      totalClaimed,
      totalSpent,
      searchSpent,
      chatSpent,
      topUsers,
      recentTransactions,
      dailyStats,
    })
  } catch (error) {
    console.error("Error fetching KAI statistics:", error)
    return NextResponse.json({ message: "An error occurred while fetching KAI statistics" }, { status: 500 })
  }
}

