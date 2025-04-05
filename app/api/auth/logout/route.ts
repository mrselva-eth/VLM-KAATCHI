import { NextResponse } from "next/server"

export async function POST() {
  try {
    // In a stateless JWT authentication system, the server doesn't need to do anything
    // The client will remove the token from localStorage

    return NextResponse.json({
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ message: "An error occurred during logout" }, { status: 500 })
  }
}

