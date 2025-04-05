"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { Magic } from "magic-sdk"
import { useRouter } from "next/navigation"

// Update the User interface to include profilePicture
export interface User {
  username: string
  email: string
  firstName: string
  lastName: string
  dob?: string
  createdAt: string
  profilePicture?: string
}

// Update the AuthContextType to include updateProfilePicture function
interface AuthContextType {
  user: User | null
  loading: boolean
  login: (emailOrUsername: string, password: string) => Promise<void>
  signup: (userData: Omit<User, "createdAt"> & { password: string }) => Promise<void>
  logout: () => Promise<void>
  verifyEmail: (email: string) => Promise<boolean>
  updateProfilePicture: (profilePicture: string | null) => Promise<void>
  isAuthenticated: boolean
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Magic instance
let magic: any = null

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Initialize Magic on client-side only
  useEffect(() => {
    if (typeof window !== "undefined" && !magic) {
      // Use the publishable key directly for development purposes
      // In production, you would use process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY
      magic = new Magic("pk_live_D67FCBFA2E898D9D")
    }

    // Check if user is already logged in
    const checkUser = async () => {
      try {
        setLoading(true)

        // Check if we have a token in localStorage
        const token = localStorage.getItem("kaatchi_auth_token")

        if (token) {
          // Validate token with the server
          const response = await fetch("/api/auth/validate", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const userData = await response.json()
            setUser(userData.user)
          } else {
            // Token is invalid, clear it
            localStorage.removeItem("kaatchi_auth_token")
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [])

  // Login function
  const login = async (emailOrUsername: string, password: string) => {
    try {
      setLoading(true)

      // Call login API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailOrUsername, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Login failed")
      }

      const data = await response.json()

      // Store token
      localStorage.setItem("kaatchi_auth_token", data.token)

      // Set user data
      setUser(data.user)

      // Set a flag in sessionStorage to indicate the user just logged in
      sessionStorage.setItem("justLoggedIn", "true")

      // Redirect to home page
      router.push("/")
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Signup function
  const signup = async (userData: Omit<User, "createdAt"> & { password: string }) => {
    try {
      setLoading(true)

      // Call signup API
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Signup failed")
      }

      // Store token
      localStorage.setItem("kaatchi_auth_token", data.token)

      // Set user data
      setUser(data.user)

      // Set a flag in sessionStorage to indicate the user just signed up
      sessionStorage.setItem("justSignedUp", "true")

      // Redirect to home page
      router.push("/")
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      setLoading(true)

      // Call logout API
      await fetch("/api/auth/logout", {
        method: "POST",
      })

      // Clear token
      localStorage.removeItem("kaatchi_auth_token")

      // Clear user data
      setUser(null)

      // Redirect to home page
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setLoading(false)
    }
  }

  // Verify email with Magic SDK
  const verifyEmail = async (email: string): Promise<boolean> => {
    try {
      if (!magic) {
        throw new Error("Magic SDK not initialized")
      }

      // Send OTP to email and show the Magic UI for OTP input
      const didToken = await magic.auth.loginWithEmailOTP({
        email,
        showUI: true, // Changed from false to true to show the OTP input UI
      })

      // Verify the token with our backend
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${didToken}`,
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error("Email verification failed")
      }

      return true
    } catch (error) {
      console.error("Email verification error:", error)
      return false
    }
  }

  // Add the updateProfilePicture function to the AuthProvider
  // Add this function inside the AuthProvider component, before the value declaration
  const updateProfilePicture = async (profilePicture: string | null) => {
    try {
      setLoading(true)

      // Get token from localStorage
      const token = localStorage.getItem("kaatchi_auth_token")
      if (!token) {
        throw new Error("Not authenticated")
      }

      // Call API to update profile picture
      const response = await fetch("/api/auth/update-profile-picture", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profilePicture }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update profile picture")
      }

      // Update user state with new profile picture
      setUser((prevUser) => {
        if (!prevUser) return null
        return {
          ...prevUser,
          profilePicture: profilePicture || undefined,
        }
      })
    } catch (error) {
      console.error("Update profile picture error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Update the value object to include updateProfilePicture
  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    verifyEmail,
    updateProfilePicture,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

