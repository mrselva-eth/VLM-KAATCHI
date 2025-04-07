import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

// Update the GET function to count actual images in the directory
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

    // Get user
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Check if user is admin
    const adminUsername = process.env.ADMIN_USERNAME
    if (!adminUsername || user.username !== adminUsername) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    // Get basic analytics data
    const [userCount, totalSearches, chatQueries, cartItems, wishlistItems, totalKaiClaimed, totalKaiSpent] =
      await Promise.all([
        // User count
        db
          .collection("users")
          .countDocuments(),

        // Total searches
        db
          .collection("analytics")
          .countDocuments({
            action: { $in: ["search_text", "search_image", "search_multimodal"] },
          }),

        // Chat queries
        db
          .collection("analytics")
          .countDocuments({ action: "chat_query" }),

        // Cart items - count items in all users' carts
        db
          .collection("users")
          .aggregate([
            { $match: { cart: { $exists: true, $ne: [] } } },
            { $project: { cartSize: { $size: { $ifNull: ["$cart", []] } } } },
            { $group: { _id: null, total: { $sum: "$cartSize" } } },
          ])
          .toArray()
          .then((result) => result[0]?.total || 0),

        // Wishlist items - count items in all users' wishlists
        db
          .collection("users")
          .aggregate([
            { $match: { wishlist: { $exists: true, $ne: [] } } },
            { $project: { wishlistSize: { $size: { $ifNull: ["$wishlist", []] } } } },
            { $group: { _id: null, total: { $sum: "$wishlistSize" } } },
          ])
          .toArray()
          .then((result) => result[0]?.total || 0),

        // Total KAI claimed
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
      ])

    // Get search types distribution
    const searchTypes = await db
      .collection("analytics")
      .aggregate([
        {
          $match: {
            action: { $in: ["search_text", "search_image", "search_multimodal"] },
          },
        },
        {
          $group: {
            _id: "$action",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    // Format search types
    const searchTypesMap = new Map(searchTypes.map((item) => [item._id, item.count]))
    const formattedSearchTypes = [
      { type: "Text", count: searchTypesMap.get("search_text") || 0 },
      { type: "Image", count: searchTypesMap.get("search_image") || 0 },
      { type: "Multimodal", count: searchTypesMap.get("search_multimodal") || 0 },
    ]

    // Get user stats distribution
    const userStats = await db
      .collection("users")
      .aggregate([
        {
          $project: {
            hasSearched: {
              $cond: [{ $gt: [{ $ifNull: ["$stats.search_text", 0] }, 0] }, true, false],
            },
            hasImageSearched: {
              $cond: [{ $gt: [{ $ifNull: ["$stats.search_image", 0] }, 0] }, true, false],
            },
            hasMultimodalSearched: {
              $cond: [{ $gt: [{ $ifNull: ["$stats.search_multimodal", 0] }, 0] }, true, false],
            },
            hasChatted: {
              $cond: [{ $gt: [{ $ifNull: ["$stats.chat_query", 0] }, 0] }, true, false],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            usersWhoSearched: { $sum: { $cond: ["$hasSearched", 1, 0] } },
            usersWhoImageSearched: { $sum: { $cond: ["$hasImageSearched", 1, 0] } },
            usersWhoMultimodalSearched: { $sum: { $cond: ["$hasMultimodalSearched", 1, 0] } },
            usersWhoChatted: { $sum: { $cond: ["$hasChatted", 1, 0] } },
          },
        },
      ])
      .toArray()

    // Get new users in last 30 days - handle string dates
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

    const newUsersLast30Days = await db.collection("users").countDocuments({
      createdAt: { $gte: thirtyDaysAgoStr },
    })

    // Generate user growth data for the last 30 days
    const usersByDay = []
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      const dateStr = date.toISOString().split("T")[0]

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      const nextDateStr = nextDate.toISOString().split("T")[0]

      // Count users created on this day
      const count = await db.collection("users").countDocuments({
        createdAt: {
          $gte: dateStr,
          $lt: nextDateStr,
        },
      })

      usersByDay.push({
        date: dateStr,
        count,
      })
    }

    // Generate hourly activity data
    const activityByHour = []
    for (let hour = 0; hour < 24; hour++) {
      // Count analytics events for this hour
      const count = await db.collection("analytics").countDocuments({
        timestamp: {
          $regex: `T${hour.toString().padStart(2, "0")}:`,
        },
      })

      activityByHour.push({
        hour,
        count,
      })
    }

    // Get top search terms
    const topSearchTerms = await db
      .collection("analytics")
      .aggregate([
        {
          $match: {
            action: "search_text",
            query: { $exists: true, $ne: "" },
          },
        },
        {
          $group: {
            _id: "$query",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray()

    // Count actual images in the directory
    let totalImages = 60000 // Default to 60,000 based on user's information

    try {
      const fs = require("fs")
      const path = require("path")
      const imageDir = process.env.DATASET_PATH
        ? path.join(process.env.DATASET_PATH, "images")
        : "D:\\project\\kaatchi-fashion-vlm\\data\\fashion-dataset\\images"

      if (fs.existsSync(imageDir)) {
        const files = fs.readdirSync(imageDir)
        // Filter to only include image files (jpg, jpeg, png)
        const imageFiles = files.filter((file) => /\.(jpg|jpeg|png)$/i.test(file))
        totalImages = imageFiles.length
      }
    } catch (err) {
      console.error("Error counting images:", err)
      // Fall back to the user-provided count if there's an error
      totalImages = 60000
    }

    return NextResponse.json({
      userCount,
      newUsersLast30Days,
      usersByDay,
      totalImages,
      totalSearches,
      totalKaiClaimed,
      totalKaiSpent,
      searchesByType: formattedSearchTypes,
      chatQueries,
      cartItems,
      wishlistItems,
      userActivity: activityByHour,
      topSearchTerms,
      userStats: userStats[0] || {
        totalUsers: 0,
        usersWhoSearched: 0,
        usersWhoImageSearched: 0,
        usersWhoMultimodalSearched: 0,
        usersWhoChatted: 0,
      },
    })
  } catch (error) {
    console.error("Admin analytics error:", error)
    return NextResponse.json({ message: "An error occurred while fetching admin analytics" }, { status: 500 })
  }
}

