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
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

// Define form schema with validation
const signupSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    dob: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const { signup, verifyEmail } = useAuth()
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [verificationError, setVerificationError] = useState("")
  const [signupError, setSignupError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setError,
    clearErrors,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      dob: "",
    },
  })

  const email = watch("email")

  // Handle email verification
  const handleVerifyEmail = async () => {
    if (!email) {
      setVerificationError("Please enter an email address")
      return
    }

    try {
      setIsVerifying(true)
      setVerificationError("")

      // Call the verifyEmail function which will now show the Magic UI
      const success = await verifyEmail(email)

      if (success) {
        setIsVerified(true)
      } else {
        setVerificationError("Email verification failed. Please try again.")
      }
    } catch (error) {
      setVerificationError("An error occurred during verification")
      console.error(error)
    } finally {
      setIsVerifying(false)
    }
  }

  // Handle form submission
  const onSubmit = async (data: SignupFormValues) => {
    if (!isVerified) {
      setError("email", {
        type: "manual",
        message: "Please verify your email before signing up",
      })
      return
    }

    try {
      setSignupError("")

      // Ensure all required fields are present
      const userData = {
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        dob: data.dob,
      }

      await signup(userData)
      router.push("/")
    } catch (error: any) {
      console.error("Signup error:", error)

      // Handle specific errors
      if (error.message.includes("Username already exists")) {
        setError("username", { type: "manual", message: "Username already taken" })
      } else if (error.message.includes("Email already exists")) {
        setError("email", { type: "manual", message: "Email already registered" })
      } else {
        // General error
        setSignupError(error.message || "An error occurred during signup")
      }
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 flex">
        {/* Left side - Create an Account text */}
        <div className="hidden md:flex w-1/2 bg-background items-center justify-center p-8">
          <h1 className="text-6xl lg:text-7xl font-bold text-foreground font-bastro leading-tight">
            Create
            <br />
            an
            <br />
            Account
          </h1>
        </div>

        {/* Right side - Signup form */}
        <div className="w-full md:w-1/2 p-8 flex items-center">
          <div className="w-full max-w-md mx-auto">
            {/* Mobile heading - only visible on small screens */}
            <h1 className="text-3xl font-bold mb-6 text-center md:hidden">Create an Account</h1>

            {signupError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
                <p className="text-red-600 dark:text-red-400 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {signupError}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="flex">
                  <div className="bg-primary text-primary-foreground flex items-center justify-center px-3 rounded-l-md">
                    @
                  </div>
                  <Input
                    id="username"
                    {...register("username")}
                    className={`rounded-l-none ${errors.username ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" {...register("lastName")} className={errors.lastName ? "border-red-500" : ""} />
                  {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      className={errors.email ? "border-red-500" : ""}
                      disabled={isVerified}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleVerifyEmail}
                    disabled={isVerifying || isVerified || !email}
                    className="whitespace-nowrap"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying
                      </>
                    ) : isVerified ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verified
                      </>
                    ) : (
                      "Verify Email"
                    )}
                  </Button>
                </div>
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                {verificationError && (
                  <p className="text-red-500 text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {verificationError}
                  </p>
                )}
                {isVerified && (
                  <p className="text-green-500 text-sm flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Email verified successfully
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth (Optional)</Label>
                <Input id="dob" type="date" {...register("dob")} />
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-primary text-primary-foreground mt-6" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>

              <p className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Log in
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

