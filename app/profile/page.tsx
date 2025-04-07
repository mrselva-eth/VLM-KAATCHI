"use client"

import type React from "react"

import { Navbar } from "@/components/navbar"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  User,
  Mail,
  Calendar,
  Clock,
  Camera,
  ShoppingCart,
  Heart,
  Trash2,
  BarChartIcon as ChartBar,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useTheme } from "next-themes"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { AdminDashboard } from "@/components/admin-dashboard"
import { checkIsAdmin } from "@/lib/admin"
import { KaiTransactions } from "@/components/kai-transactions"

interface CartItem {
  productId: string
  quantity: number
  product: {
    id: string
    name: string
    price: string
    image: string
    brand?: string
    category?: string
    articleType?: string
    baseColor?: string
  }
  addedAt: string
  updatedAt: string
}

interface WishlistItem {
  productId: string
  product: {
    id: string
    name: string
    price: string
    image: string
    brand?: string
    category?: string
    articleType?: string
    baseColor?: string
  }
  addedAt: string
}

export default function ProfilePage() {
  const { user, isAuthenticated, loading, updateProfilePicture } = useAuth()
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState("profile")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [isLoadingCart, setIsLoadingCart] = useState(false)
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const { theme } = useTheme()
  const isLightTheme = theme === "light"

  // Add these pagination state variables after the other state declarations
  const [cartCurrentPage, setCartCurrentPage] = useState(1)
  const [wishlistCurrentPage, setWishlistCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Primary color based on theme
  const primaryColor = isLightTheme ? "text-[#7e3b92]" : "text-[#2c8e59]"
  const primaryBgColor = isLightTheme ? "bg-[#7e3b92]" : "bg-[#2c8e59]"
  const primaryBorderColor = isLightTheme ? "border-[#7e3b92]" : "border-[#2c8e59]"

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isAuthenticated && user) {
        try {
          const adminStatus = await checkIsAdmin()
          setIsAdmin(adminStatus)
        } catch (error) {
          console.error("Error checking admin status:", error)
          setIsAdmin(false)
        }
      }
    }

    checkAdminStatus()
  }, [isAuthenticated, user])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
    }
  }, [loading, isAuthenticated, router])

  // Fetch cart and wishlist items when tab changes
  useEffect(() => {
    let shouldFetchCart = false
    let shouldFetchWishlist = false

    if (isAuthenticated) {
      if (activeTab === "cart") {
        shouldFetchCart = true
      } else if (activeTab === "wishlist") {
        shouldFetchWishlist = true
      }
    }

    const fetchData = async () => {
      if (shouldFetchCart) {
        await fetchCartItems()
      }

      if (shouldFetchWishlist) {
        await fetchWishlistItems()
      }
    }

    fetchData()
  }, [isAuthenticated, activeTab])

  // Fetch cart items
  const fetchCartItems = async () => {
    try {
      setIsLoadingCart(true)
      const response = await fetch("/api/user/cart", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("kaatchi_auth_token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCartItems(data.cart || [])
      } else {
        throw new Error("Failed to fetch cart items")
      }
    } catch (error) {
      console.error("Error fetching cart items:", error)
    } finally {
      setIsLoadingCart(false)
    }
  }

  // Fetch wishlist items
  const fetchWishlistItems = async () => {
    try {
      setIsLoadingWishlist(true)
      const response = await fetch("/api/user/wishlist", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("kaatchi_auth_token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setWishlistItems(data.wishlist || [])
      } else {
        throw new Error("Failed to fetch wishlist items")
      }
    } catch (error) {
      console.error("Error fetching wishlist items:", error)
    } finally {
      setIsLoadingWishlist(false)
    }
  }

  // Remove item from cart
  const removeFromCart = async (productId: string) => {
    try {
      const response = await fetch(`/api/user/cart?productId=${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("kaatchi_auth_token")}`,
        },
      })

      if (response.ok) {
        // Update cart items
        setCartItems(cartItems.filter((item) => item.productId !== productId))
      } else {
        throw new Error("Failed to remove item from cart")
      }
    } catch (error) {
      console.error("Error removing item from cart:", error)
    }
  }

  // Remove item from wishlist
  const removeFromWishlist = async (productId: string) => {
    try {
      const response = await fetch(`/api/user/wishlist?productId=${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("kaatchi_auth_token")}`,
        },
      })

      if (response.ok) {
        // Update wishlist items
        setWishlistItems(wishlistItems.filter((item) => item.productId !== productId))
      } else {
        throw new Error("Failed to remove item from wishlist")
      }
    } catch (error) {
      console.error("Error removing item from wishlist:", error)
    }
  }

  // Show loading state
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file")
      return
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size should be less than 5MB")
      return
    }

    try {
      setIsUploading(true)
      setUploadError("")

      // Convert file to base64
      const base64 = await convertFileToBase64(file)

      // Update profile picture
      await updateProfilePicture(base64)
    } catch (error: any) {
      console.error("Error uploading profile picture:", error)
      setUploadError(error.message || "Failed to upload profile picture")
    } finally {
      setIsUploading(false)
    }
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removeProfilePicture = async () => {
    if (window.confirm("Are you sure you want to remove your profile picture?")) {
      try {
        setIsUploading(true)
        await updateProfilePicture(null)
      } catch (error: any) {
        console.error("Error removing profile picture:", error)
        setUploadError(error.message || "Failed to remove profile picture")
      } finally {
        setIsUploading(false)
      }
    }
  }

  const goBack = () => {
    router.back()
  }

  // Add these functions after other handler functions but before the return statement
  const getCartItemsForCurrentPage = () => {
    const startIndex = (cartCurrentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return cartItems.slice(startIndex, endIndex)
  }

  const getWishlistItemsForCurrentPage = () => {
    const startIndex = (wishlistCurrentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return wishlistItems.slice(startIndex, endIndex)
  }

  const totalCartPages = Math.ceil(cartItems.length / itemsPerPage)
  const totalWishlistPages = Math.ceil(wishlistItems.length / itemsPerPage)

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Go Back Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goBack}
        className="fixed top-[72px] left-4 z-30 text-foreground hover:bg-muted h-8 w-8"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Go back</span>
      </Button>

      <div className="flex-1 w-full py-8 px-4">
        <div className="w-full mx-auto">
          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid ${isAdmin ? "grid-cols-5" : "grid-cols-4"} mb-8 w-full max-w-5xl mx-auto`}>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="cart">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
              </TabsTrigger>
              <TabsTrigger value="wishlist">
                <Heart className="h-4 w-4 mr-2" />
                Wishlist
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <ChartBar className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin">
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Admin
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="profile">
              <h1 className="text-3xl font-bold mb-8 text-center">My Profile</h1>

              <div className="bg-card border rounded-lg overflow-hidden">
                <div className="bg-primary p-8 flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className="h-32 w-32 rounded-full overflow-hidden bg-primary-foreground flex items-center justify-center relative">
                      {user.profilePicture ? (
                        <Image
                          src={user.profilePicture || "/placeholder.svg"}
                          alt="Profile"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <User className="h-16 w-16 text-primary" />
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 flex gap-2">
                      <Button
                        size="icon"
                        className="h-8 w-8 rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                        onClick={triggerFileInput}
                        disabled={isUploading}
                      >
                        <Camera className="h-4 w-4" />
                        <span className="sr-only">Upload profile picture</span>
                      </Button>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  {uploadError && <p className="text-red-300 text-sm mt-2">{uploadError}</p>}
                  <h2 className="text-2xl font-bold text-primary-foreground">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-primary-foreground/80">{user.username}</p>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-background border rounded-md p-4 flex items-start">
                      <User className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                      <div>
                        <h3 className="font-medium">Full Name</h3>
                        <p className="text-muted-foreground">
                          {user.firstName} {user.lastName}
                        </p>
                      </div>
                    </div>

                    <div className="bg-background border rounded-md p-4 flex items-start">
                      <Mail className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                      <div>
                        <h3 className="font-medium">Email</h3>
                        <p className="text-muted-foreground">{user.email}</p>
                      </div>
                    </div>

                    {user.dob && (
                      <div className="bg-background border rounded-md p-4 flex items-start">
                        <Calendar className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                        <div>
                          <h3 className="font-medium">Date of Birth</h3>
                          <p className="text-muted-foreground">{format(new Date(user.dob), "MMMM d, yyyy")}</p>
                        </div>
                      </div>
                    )}

                    <div className="bg-background border rounded-md p-4 flex items-start">
                      <Clock className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                      <div>
                        <h3 className="font-medium">Member Since</h3>
                        <p className="text-muted-foreground">{format(new Date(user.createdAt), "MMMM d, yyyy")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button onClick={() => router.push("/settings")} className="bg-primary text-primary-foreground">
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cart">
              <div className="space-y-6">
                <h1 className="text-3xl font-bold mb-8 text-center">My Cart</h1>

                {isLoadingCart ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="border rounded-lg p-4 flex gap-4">
                        <Skeleton className="h-24 w-24 rounded-md" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : cartItems.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getCartItemsForCurrentPage().map((item) => (
                        <div key={item.productId} className="border rounded-lg p-4 flex gap-4 group relative">
                          <Link
                            href={`/product/${item.productId}`}
                            className="h-24 w-24 relative rounded-md overflow-hidden"
                          >
                            <Image
                              src={item.product.image || "/placeholder.svg?height=100&width=100"}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=100&width=100"
                              }}
                            />
                          </Link>
                          <div className="flex-1">
                            <Link href={`/product/${item.productId}`} className="font-medium hover:text-primary">
                              {item.product.name}
                            </Link>
                            <div className="flex justify-between mt-1">
                              <span className="text-sm text-muted-foreground">
                                {item.product.baseColor} {item.product.articleType}
                              </span>
                              <span className={`font-medium ${primaryColor}`}>{item.product.price}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm">Quantity: {item.quantity}</span>
                              <span className="text-sm text-muted-foreground">
                                Added {format(new Date(item.addedAt), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove from cart</span>
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Pagination for cart */}
                    {totalCartPages > 1 && (
                      <div className="flex justify-center mt-6 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCartCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={cartCurrentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalCartPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={cartCurrentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCartCurrentPage(page)}
                              className={`w-8 h-8 p-0 ${
                                cartCurrentPage === page ? "bg-primary text-primary-foreground" : ""
                              }`}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCartCurrentPage((prev) => Math.min(prev + 1, totalCartPages))}
                          disabled={cartCurrentPage === totalCartPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}

                    <div className="text-center mt-2 text-sm text-muted-foreground">
                      Showing {Math.min(cartItems.length, (cartCurrentPage - 1) * itemsPerPage + 1)}-
                      {Math.min(cartCurrentPage * itemsPerPage, cartItems.length)} of {cartItems.length} items
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
                    <p className="text-muted-foreground mb-6">Start shopping to add items to your cart</p>
                    <Link href="/search">
                      <Button className="bg-primary text-primary-foreground">Browse Products</Button>
                    </Link>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="wishlist">
              <div className="space-y-6">
                <h1 className="text-3xl font-bold mb-8 text-center">My Wishlist</h1>

                {isLoadingWishlist ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="border rounded-lg overflow-hidden">
                        <Skeleton className="aspect-square w-full" />
                        <div className="p-3 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : wishlistItems.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {getWishlistItemsForCurrentPage().map((item) => (
                        <div key={item.productId} className="border rounded-lg overflow-hidden group relative">
                          <Link href={`/product/${item.productId}`} className="block">
                            <div className="aspect-square relative">
                              <Image
                                src={item.product.image || "/placeholder.svg?height=300&width=300"}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=300&width=300"
                                }}
                              />
                              {item.product.brand && (
                                <div
                                  className={`absolute top-2 left-2 ${primaryBgColor} text-white px-2 py-0.5 rounded text-xs font-medium`}
                                >
                                  {item.product.brand}
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                {item.product.name}
                              </h3>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-muted-foreground line-clamp-1">
                                  {item.product.baseColor} {item.product.articleType}
                                </span>
                                <span className={`text-xs font-medium ${primaryColor}`}>{item.product.price}</span>
                              </div>
                            </div>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 bg-background/80 text-red-500 hover:text-red-700 hover:bg-background"
                            onClick={() => removeFromWishlist(item.productId)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove from wishlist</span>
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Pagination for wishlist */}
                    {totalWishlistPages > 1 && (
                      <div className="flex justify-center mt-6 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setWishlistCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={wishlistCurrentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalWishlistPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={wishlistCurrentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setWishlistCurrentPage(page)}
                              className={`w-8 h-8 p-0 ${
                                wishlistCurrentPage === page ? "bg-primary text-primary-foreground" : ""
                              }`}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setWishlistCurrentPage((prev) => Math.min(prev + 1, totalWishlistPages))}
                          disabled={wishlistCurrentPage === totalWishlistPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}

                    <div className="text-center mt-2 text-sm text-muted-foreground">
                      Showing {Math.min(wishlistItems.length, (wishlistCurrentPage - 1) * itemsPerPage + 1)}-
                      {Math.min(wishlistCurrentPage * itemsPerPage, wishlistItems.length)} of {wishlistItems.length}{" "}
                      items
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-medium mb-2">Your wishlist is empty</h2>
                    <p className="text-muted-foreground mb-6">Save items you love to your wishlist</p>
                    <Link href="/search">
                      <Button className="bg-primary text-primary-foreground">Discover Products</Button>
                    </Link>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="space-y-8">
                <AnalyticsDashboard />
                <KaiTransactions /> {/* Add KAI transactions here */}
              </div>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin">
                <AdminDashboard />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </main>
  )
}

