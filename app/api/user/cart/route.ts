import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

// Add product to cart
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
    const { productId, quantity = 1, product } = await request.json()

    if (!productId) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 })
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Check if product already exists in cart
    const existingCartItem = await db.collection("users").findOne({
      _id: new ObjectId(decoded.userId),
      "cart.productId": productId,
    })

    if (existingCartItem) {
      // Update quantity if product already exists
      await db.collection("users").updateOne(
        {
          _id: new ObjectId(decoded.userId),
          "cart.productId": productId,
        },
        {
          $inc: { "cart.$.quantity": quantity },
          $set: { "cart.$.updatedAt": new Date().toISOString() },
        },
      )
    } else {
      // Add new product to cart
      await db.collection("users").updateOne(
        { _id: new ObjectId(decoded.userId) },
        {
          $push: {
            cart: {
              productId,
              quantity,
              product,
              addedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        },
      )
    }

    return NextResponse.json({
      message: "Product added to cart successfully",
    })
  } catch (error) {
    console.error("Add to cart error:", error)
    return NextResponse.json({ message: "An error occurred while adding product to cart" }, { status: 500 })
  }
}

// Get cart items
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

    // Get user with cart items
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(decoded.userId) }, { projection: { cart: 1 } })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      cart: user.cart || [],
    })
  } catch (error) {
    console.error("Get cart error:", error)
    return NextResponse.json({ message: "An error occurred while getting cart items" }, { status: 500 })
  }
}

// Remove product from cart
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

    // Remove product from cart
    await db.collection("users").updateOne(
      { _id: new ObjectId(decoded.userId) },
      {
        $pull: {
          cart: { productId },
        },
      },
    )

    return NextResponse.json({
      message: "Product removed from cart successfully",
    })
  } catch (error) {
    console.error("Remove from cart error:", error)
    return NextResponse.json({ message: "An error occurred while removing product from cart" }, { status: 500 })
  }
}

