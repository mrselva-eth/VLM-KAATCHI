import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

// Add product to wishlist
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
    const { productId, product } = await request.json()

    if (!productId) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 })
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Check if product already exists in wishlist
    const existingWishlistItem = await db.collection("users").findOne({
      _id: new ObjectId(decoded.userId),
      "wishlist.productId": productId,
    })

    if (existingWishlistItem) {
      // Product already in wishlist, no need to add again
      return NextResponse.json({
        message: "Product already in wishlist",
      })
    } else {
      // Add new product to wishlist
      await db.collection("users").updateOne(
        { _id: new ObjectId(decoded.userId) },
        {
          $push: {
            wishlist: {
              productId,
              product,
              addedAt: new Date().toISOString(),
            },
          },
        },
      )
    }

    return NextResponse.json({
      message: "Product added to wishlist successfully",
    })
  } catch (error) {
    console.error("Add to wishlist error:", error)
    return NextResponse.json({ message: "An error occurred while adding product to wishlist" }, { status: 500 })
  }
}

// Get wishlist items
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

    // Get user with wishlist items
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(decoded.userId) }, { projection: { wishlist: 1 } })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      wishlist: user.wishlist || [],
    })
  } catch (error) {
    console.error("Get wishlist error:", error)
    return NextResponse.json({ message: "An error occurred while getting wishlist items" }, { status: 500 })
  }
}

// Remove product from wishlist
export async function DELETE(request: Request) {
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

    // Get product ID from URL
    const url = new URL(request.url)
    const productId = url.searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 })
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Remove product from wishlist
    await db.collection("users").updateOne(
      { _id: new ObjectId(decoded.userId) },
      {
        $pull: {
          wishlist: { productId },
        },
      },
    )

    return NextResponse.json({
      message: "Product removed from wishlist successfully",
    })
  } catch (error) {
    console.error("Remove from wishlist error:", error)
    return NextResponse.json({ message: "An error occurred while removing product from wishlist" }, { status: 500 })
  }
}

