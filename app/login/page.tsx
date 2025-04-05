"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"

// Define form schema with validation
const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [loginError, setLoginError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  })

  // Handle form submission
  const onSubmit = async (data: LoginFormValues) => {
    try {
      setLoginError("")
      await login(data.emailOrUsername, data.password)
      router.push("/")
    } catch (error: any) {
      console.error("Login error:", error)
      setLoginError(error.message || "Invalid email/username or password")
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 flex">
        {/* Left side - Login text */}
        <div className="hidden md:flex w-1/2 bg-background items-center justify-center p-8">
          <h1 className="text-6xl lg:text-7xl font-bold text-foreground font-bastro leading-tight">Login</h1>
        </div>

        {/* Right side - Login form */}
        <div className="w-full md:w-1/2 p-8 flex items-center">
          <div className="max-w-md mx-auto w-full">
            {/* Mobile heading - only visible on small screens */}
            <h1 className="text-3xl font-bold mb-6 text-center md:hidden">Log In</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {loginError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                  <p className="text-red-600 dark:text-red-400 text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {loginError}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="emailOrUsername">Email or Username</Label>
                <Input
                  id="emailOrUsername"
                  {...register("emailOrUsername")}
                  className={errors.emailOrUsername ? "border-red-500" : ""}
                />
                {errors.emailOrUsername && <p className="text-red-500 text-sm">{errors.emailOrUsername.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </Button>

              <p className="text-center text-sm">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

