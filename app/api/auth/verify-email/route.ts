import { NextResponse } from "next/server"
import { Magic } from "@magic-sdk/admin"

// Initialize Magic Admin SDK
const magic = new Magic(process.env.MAGIC_SECRET_KEY as string)

export async function POST(request: Request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Missing or invalid authorization header" }, { status: 401 })
    }

    // Extract DID token
    const didToken = authHeader.substring(7)

    // Validate DID token
    try {
      magic.token.validate(didToken)
    } catch (error) {
      return NextResponse.json({ message: "Invalid DID token" }, { status: 401 })
    }

    // Get email from request body
    const { email } = await request.json()

    // Return success response
    return NextResponse.json({
      message: "Email verified successfully",
      email,
    })
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json({ message: "An error occurred during email verification" }, { status: 500 })
  }
}

