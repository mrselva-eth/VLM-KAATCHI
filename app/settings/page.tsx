"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle, Save } from "lucide-react"

// Define form schema with validation
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dob: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function SettingsPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [updateError, setUpdateError] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const [defaultValues, setDefaultValues] = useState<ProfileFormValues>({
    firstName: "",
    lastName: "",
    dob: "",
  })

  useEffect(() => {
    if (user) {
      setDefaultValues({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        dob: user.dob || "",
      })
    }
  }, [user])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaultValues,
    mode: "onChange",
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
    }
  }, [loading, isAuthenticated, router])

  if (loading || !user) {
    return (
      <main className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 container py-8 flex items-center justify-center">
          <div className="animate-pulse space-y-8 w-full max-w-md">
            <div className="h-12 bg-muted rounded-md w-1/2 mx-auto"></div>
            <div className="space-y-4">
              <div className="h-20 bg-muted rounded-md"></div>
              <div className="h-20 bg-muted rounded-md"></div>
              <div className="h-20 bg-muted rounded-md"></div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsUpdating(true)
      setUpdateError("")
      setUpdateSuccess(false)

      // Call update profile API
      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("kaatchi_auth_token")}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update profile")
      }

      setUpdateSuccess(true)

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error: any) {
      console.error("Update profile error:", error)
      setUpdateError(error.message || "An error occurred while updating your profile")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 container py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Profile Settings</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {updateError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-red-600 dark:text-red-400 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {updateError}
                </p>
              </div>
            )}

            {updateSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                <p className="text-green-600 dark:text-green-400 text-sm flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Profile updated successfully!
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={user.username} disabled className="bg-muted" />
              <p className="text-sm text-muted-foreground">Username cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled className="bg-muted" />
              <p className="text-sm text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register("firstName")} className={errors.firstName ? "border-red-500" : ""} />
                {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register("lastName")} className={errors.lastName ? "border-red-500" : ""} />
                {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" {...register("dob")} />
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}

