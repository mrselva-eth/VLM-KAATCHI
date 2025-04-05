"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Heart, ShoppingCart, Star, Truck, Shield, RefreshCw, Check, AlertCircle } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface ProductDetail {
  id: string
  name: string
  description?: string
  price?: string
  category?: string
  subCategory?: string
  articleType?: string
  baseColor?: string
  gender?: string
  season?: string
  usage?: string
  brand?: string
  material?: string
  pattern?: string
  images: string[]
  similarProducts?: ProductDetail[]
}

interface ProductPageProps {
  params: {
    id: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isInCart, setIsInCart] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const router = useRouter()
  const { theme } = useTheme()
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  const isLightTheme = theme === "light"

  // Fetch product data from API
  useEffect(() => {
    async function fetchProduct() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/products/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch product")
        }
        const productData = await response.json()
        setProduct(productData)
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  // Check if product is in wishlist or cart
  useEffect(() => {
    if (isAuthenticated && product) {
      // Check wishlist
      const checkWishlist = async () => {
        try {
          const response = await fetch("/api/user/wishlist", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("kaatchi_auth_token")}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            const isInWishlist = data.wishlist.some((item: any) => item.productId === product.id)
            setIsWishlisted(isInWishlist)
          }
        } catch (error) {
          console.error("Error checking wishlist:", error)
        }
      }

      // Check cart
      const checkCart = async () => {
        try {
          const response = await fetch("/api/user/cart", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("kaatchi_auth_token")}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            const productInCart = data.cart.some((item: any) => item.productId === product.id)
            setIsInCart(productInCart)
          }
        } catch (error) {
          console.error("Error checking cart:", error)
        }
      }

      checkWishlist()
      checkCart()
    }
  }, [isAuthenticated, product])

  const goBack = () => {
    router.back()
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity)
    }
  }

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to add items to your wishlist",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    try {
      setIsAddingToWishlist(true)

      if (isWishlisted) {
        // Remove from wishlist
        const response = await fetch(`/api/user/wishlist?productId=${product?.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("kaatchi_auth_token")}`,
          },
        })

        if (response.ok) {
          setIsWishlisted(false)
          setActionMessage({ type: "success", message: "Removed from wishlist" })
          setTimeout(() => setActionMessage(null), 3000)
        } else {
          throw new Error("Failed to remove from wishlist")
        }
      } else {
        // Add to wishlist
        const response = await fetch("/api/user/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("kaatchi_auth_token")}`,
          },
          body: JSON.stringify({
            productId: product?.id,
            product: {
              id: product?.id,
              name: product?.name,
              price: product?.price,
              image: product?.images[0],
              brand: product?.brand,
              category: product?.category,
              articleType: product?.articleType,
              baseColor: product?.baseColor,
            },
          }),
        })

        if (response.ok) {
          setIsWishlisted(true)
          setActionMessage({ type: "success", message: "Added to wishlist" })
          setTimeout(() => setActionMessage(null), 3000)
        } else {
          throw new Error("Failed to add to wishlist")
        }
      }
    } catch (error) {
      console.error("Wishlist error:", error)
      setActionMessage({ type: "error", message: "Failed to update wishlist" })
      setTimeout(() => setActionMessage(null), 3000)
    } finally {
      setIsAddingToWishlist(false)
    }
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to add items to your cart",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    try {
      setIsAddingToCart(true)

      const response = await fetch("/api/user/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("kaatchi_auth_token")}`,
        },
        body: JSON.stringify({
          productId: product?.id,
          quantity: quantity,
          product: {
            id: product?.id,
            name: product?.name,
            price: product?.price,
            image: product?.images[0],
            brand: product?.brand,
            category: product?.category,
            articleType: product?.articleType,
            baseColor: product?.baseColor,
          },
        }),
      })

      if (response.ok) {
        setIsInCart(true)
        setActionMessage({ type: "success", message: `Added ${quantity} ${product?.name} to cart` })
        setTimeout(() => setActionMessage(null), 3000)
      } else {
        throw new Error("Failed to add to cart")
      }
    } catch (error) {
      console.error("Add to cart error:", error)
      setActionMessage({ type: "error", message: "Failed to add to cart" })
      setTimeout(() => setActionMessage(null), 3000)
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Generate random rating between 3.5 and 5.0
  const rating = (3.5 + Math.random() * 1.5).toFixed(1)
  const reviewCount = Math.floor(10 + Math.random() * 490)

  // Primary color based on theme
  const primaryColor = isLightTheme ? "text-[#7e3b92]" : "text-[#2c8e59]"
  const primaryBgColor = isLightTheme ? "bg-[#7e3b92]" : "bg-[#2c8e59]"
  const primaryBorderColor = isLightTheme ? "border-[#7e3b92]" : "border-[#2c8e59]"

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

      {/* Action message toast */}
      {actionMessage && (
        <div
          className={`fixed top-20 right-4 z-50 p-3 rounded-md shadow-lg flex items-center gap-2 ${
            actionMessage.type === "success"
              ? "bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300"
              : "bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300"
          }`}
        >
          {actionMessage.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{actionMessage.message}</span>
        </div>
      )}

      <div className="flex-1 container py-8 pt-16">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="loadingspinner">
              <div id="square1"></div>
              <div id="square2"></div>
              <div id="square3"></div>
              <div id="square4"></div>
              <div id="square5"></div>
            </div>
            <p className="text-center mt-4 text-foreground font-medium">Loading product details...</p>
          </div>
        ) : product ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-lg border">
                <Image
                  src={product.images[selectedImageIndex] || "/placeholder.svg?height=600&width=600"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=600&width=600"
                  }}
                />
                {product.brand && (
                  <div
                    className={`absolute top-4 left-4 ${primaryBgColor} text-white px-3 py-1 rounded-md text-sm font-medium`}
                  >
                    {product.brand}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {product.images.map((image, index) => (
                  <div
                    key={index}
                    className={`relative aspect-square overflow-hidden rounded-md border cursor-pointer ${selectedImageIndex === index ? primaryBorderColor + " border-2" : ""}`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <Image
                      src={image || "/placeholder.svg?height=300&width=300"}
                      alt={`${product.name} view ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=300&width=300"
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center">
                    <Star className={`h-5 w-5 fill-current ${primaryColor}`} />
                    <span className="ml-1 font-medium">{rating}</span>
                    <span className="ml-1 text-muted-foreground">({reviewCount} reviews)</span>
                  </div>
                  {product.articleType && <span className="text-muted-foreground">{product.articleType}</span>}
                </div>
                <p className="text-2xl font-bold mt-4 text-foreground">{product.price}</p>
              </div>

              {/* Product Description */}
              <div>
                <p className="text-muted-foreground">{product.description}</p>
              </div>

              {/* Product Attributes */}
              <div className="grid grid-cols-2 gap-y-2 border-t border-b py-4">
                {product.category && (
                  <div className="flex items-center">
                    <span className="text-muted-foreground w-32">Category:</span>
                    <span className="font-medium">{product.category}</span>
                  </div>
                )}
                {product.subCategory && (
                  <div className="flex items-center">
                    <span className="text-muted-foreground w-32">Sub Category:</span>
                    <span className="font-medium">{product.subCategory}</span>
                  </div>
                )}
                {product.articleType && (
                  <div className="flex items-center">
                    <span className="text-muted-foreground w-32">Article Type:</span>
                    <span className="font-medium">{product.articleType}</span>
                  </div>
                )}
                {product.baseColor && (
                  <div className="flex items-center">
                    <span className="text-muted-foreground w-32">Color:</span>
                    <span className="font-medium">{product.baseColor}</span>
                  </div>
                )}
                {product.gender && (
                  <div className="flex items-center">
                    <span className="text-muted-foreground w-32">Gender:</span>
                    <span className="font-medium">{product.gender}</span>
                  </div>
                )}
                {product.season && (
                  <div className="flex items-center">
                    <span className="text-muted-foreground w-32">Season:</span>
                    <span className="font-medium">{product.season}</span>
                  </div>
                )}
                {product.usage && (
                  <div className="flex items-center">
                    <span className="text-muted-foreground w-32">Usage:</span>
                    <span className="font-medium">{product.usage}</span>
                  </div>
                )}
                {product.material && (
                  <div className="flex items-center">
                    <span className="text-muted-foreground w-32">Material:</span>
                    <span className="font-medium">{product.material}</span>
                  </div>
                )}
                {product.pattern && (
                  <div className="flex items-center">
                    <span className="text-muted-foreground w-32">Pattern:</span>
                    <span className="font-medium">{product.pattern}</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center space-x-4">
                <span className="text-muted-foreground">Quantity:</span>
                <div className="flex items-center border rounded-md">
                  <button
                    className="px-3 py-1 border-r"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-1">{quantity}</span>
                  <button
                    className="px-3 py-1 border-l"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= 10}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className={`${primaryBgColor} text-white hover:opacity-90 flex-1`}
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  {isAddingToCart ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      Adding...
                    </>
                  ) : isInCart ? (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Add to Cart
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className={`border-2 ${isWishlisted ? primaryBorderColor + " " + primaryColor : ""}`}
                  onClick={toggleWishlist}
                  disabled={isAddingToWishlist}
                >
                  {isAddingToWishlist ? (
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Heart className={`mr-2 h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
                  )}
                  {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                </Button>
              </div>

              {/* Shipping & Returns */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-sm">Free shipping on orders over $50</span>
                </div>
                <div className="flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-sm">30-day return policy</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-sm">Secure checkout</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={goBack}>Go Back</Button>
          </div>
        )}

        {/* Similar Products Section */}
        {product && product.similarProducts && product.similarProducts.length > 0 && (
          <div className="mt-16">
            <h2 className={`text-2xl font-bold mb-6 ${primaryColor}`}>Similar Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {product.similarProducts.map((similarProduct) => (
                <Link href={`/product/${similarProduct.id}`} key={similarProduct.id}>
                  <div className="border rounded-lg overflow-hidden hover:shadow-md transition-all">
                    <div className="relative aspect-square">
                      <Image
                        src={similarProduct.images[0] || "/placeholder.svg?height=300&width=300"}
                        alt={similarProduct.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=300&width=300"
                        }}
                      />
                      {similarProduct.brand && (
                        <div
                          className={`absolute top-2 left-2 ${primaryBgColor} text-white px-2 py-0.5 rounded text-xs font-medium`}
                        >
                          {similarProduct.brand}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-sm line-clamp-1">{similarProduct.name}</h3>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-muted-foreground">
                          {similarProduct.baseColor} {similarProduct.articleType}
                        </span>
                        {similarProduct.price && (
                          <span className={`text-xs font-medium ${primaryColor}`}>{similarProduct.price}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}

