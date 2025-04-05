"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Upload, Sparkles, X, ChevronDown, ChevronUp, Settings, AlertTriangle, RefreshCw } from "lucide-react"
import { useTheme } from "next-themes"
import { trackAnalytics } from "@/lib/analytics"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"

interface SearchResult {
  id: string
  name: string
  category: string
  subCategory?: string
  articleType?: string
  baseColor?: string
  gender?: string
  usage?: string
  similarity?: number
  image: string
  brand?: string
  price?: string
  material?: string
}

// Update the interface to include isLoading and setIsLoading props
interface SearchSectionProps {
  onResultsChange?: (results: SearchResult[], searchInfo?: { query?: string; type?: string; image?: string }) => void
  filters?: Record<string, string>
  hasResults?: boolean
  onClearResults?: () => void
  isLoading?: boolean
  setIsLoading?: (loading: boolean) => void
}

// Update the component to accept and use these props
export function SearchSection({
  onResultsChange,
  filters,
  hasResults = false,
  onClearResults,
  isLoading: parentIsLoading,
  setIsLoading: setParentIsLoading,
}: SearchSectionProps) {
  // Add auth hook
  const { isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeSearchType, setActiveSearchType] = useState<"text" | "image" | "multimodal">("text")
  const [error, setError] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(!hasResults)
  const [coherenceSimilarity, setCoherenceSimilarity] = useState<number | null>(null)
  const { theme } = useTheme()
  const isLightTheme = theme === "light"
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const router = useRouter()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  // Sync local loading state with parent loading state
  useEffect(() => {
    if (parentIsLoading !== undefined) {
      setIsLoading(parentIsLoading)
    }
  }, [parentIsLoading])

  // Update parent loading state when local loading state changes
  useEffect(() => {
    if (setParentIsLoading) {
      setParentIsLoading(isLoading)
    }
  }, [isLoading, setParentIsLoading])

  // Close search panel when results are displayed
  useEffect(() => {
    if (hasResults) {
      setIsSearchOpen(false)
    }
  }, [hasResults])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
    setError(null) // Clear any previous errors
    setCoherenceSimilarity(null) // Clear any previous coherence data

    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  // Update the handleSearch function to not set isLoading to false immediately
  // This will allow the parent component to control when loading is complete
  const handleSearch = useCallback(async () => {
    if (isLoading) return

    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowAuthDialog(true)
      return
    }

    setIsLoading(true)
    setError(null)
    setCoherenceSimilarity(null)

    try {
      // Determine search type based on inputs
      const searchType = activeSearchType

      // Track search analytics for authenticated users
      if (isAuthenticated) {
        await trackAnalytics(
          searchType === "text" ? "search_text" : searchType === "image" ? "search_image" : "search_multimodal",
          searchQuery,
          {
            hasImage: !!selectedFile,
            timestamp: new Date().toISOString(),
          },
        )
      }

      // Create form data for the request
      const formData = new FormData()
      formData.append("searchType", searchType)

      if (searchQuery) {
        formData.append("query", searchQuery)
      }

      if (selectedFile) {
        formData.append("image", selectedFile)
      }

      // Add filters if provided
      if (filters && Object.keys(filters).length > 0) {
        formData.append("filters", JSON.stringify(filters))
      }

      formData.append("topK", "50") // Request up to 50 results

      // Use the VLM endpoint for search
      const response = await fetch("/api/vlm", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if this is a validation error
        if (data.isValidationError) {
          setError(data.error || "The uploaded image is not fashion-related. Please try a different image.")

          // If there's coherence data, store it
          if (data.coherenceSimilarity !== undefined) {
            setCoherenceSimilarity(data.coherenceSimilarity)
          }

          if (onResultsChange) {
            onResultsChange([])
          }
          setIsLoading(false) // Only set loading to false here for validation errors
          return
        }
        throw new Error(data.error || "Search request failed")
      }

      // Check if there's an error message in the response
      if (data.error) {
        setError(data.error)
        if (onResultsChange) {
          onResultsChange([])
        }
        setIsLoading(false) // Only set loading to false here for errors
        return
      }

      // Process and normalize results
      let processedResults = data.results || []

      // Normalize similarity scores if they exist
      if (processedResults.length > 0) {
        // Find the max similarity score to use for normalization
        const maxSimilarity = Math.max(
          ...processedResults.map((item) => (item.similarity !== undefined ? Math.abs(item.similarity) : 0)),
        )

        processedResults = processedResults.map((item) => {
          if (item.similarity !== undefined) {
            // Normalize similarity to a value between 0.6 and 1.0
            // This gives a range of 60% to 100% which is more intuitive for users
            let normalizedSimilarity = Math.abs(item.similarity)

            // If similarity is already between 0 and 1, use it directly
            // Otherwise, normalize it based on the maximum value
            if (normalizedSimilarity > 1) {
              normalizedSimilarity = normalizedSimilarity / 100
            }

            // Scale to 0.6-1.0 range for better visual differentiation
            normalizedSimilarity = 0.6 + normalizedSimilarity * 0.4

            return { ...item, similarity: normalizedSimilarity }
          }
          return item
        })
      }

      // Update the results
      if (onResultsChange) {
        // Pass search info along with results
        onResultsChange(processedResults, {
          query: searchQuery,
          type: activeSearchType,
          image: previewUrl || undefined,
        })
      }

      // Show error if no results
      if (processedResults.length === 0) {
        setError("No matching products found. Try adjusting your search or filters.")
        setIsLoading(false) // Set loading to false for no results
      } else {
        // Only close the search panel if we have results
        setIsSearchOpen(false)
        // Note: We don't set isLoading to false here, the parent component will handle that
      }
    } catch (error) {
      console.error("Search error:", error)
      setError(error instanceof Error ? error.message : "Failed to perform search. Please try again.")
      if (onResultsChange) {
        onResultsChange([])
      }
      setIsLoading(false) // Set loading to false for errors
    }
  }, [searchQuery, selectedFile, activeSearchType, filters, isLoading, onResultsChange, previewUrl, isAuthenticated])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isSearchDisabled()) {
      handleSearch()
    }
  }

  const isSearchDisabled = () => {
    if (isLoading) return true
    if (activeSearchType === "text" && !searchQuery.trim()) return true
    if (activeSearchType === "image" && !selectedFile) return true
    if (activeSearchType === "multimodal" && (!searchQuery.trim() || !selectedFile)) return true
    return false
  }

  const clearImage = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    setCoherenceSimilarity(null)

    // Reset file input if there's a reference to it
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  const toggleSearchPanel = () => {
    setIsSearchOpen(!isSearchOpen)
  }

  const getSearchTypeLabel = () => {
    switch (activeSearchType) {
      case "text":
        return "Text Search"
      case "image":
        return "Image Search"
      case "multimodal":
        return "Multimodal Search"
    }
  }

  // Function to handle search type change
  const handleSearchTypeChange = (type: "text" | "image" | "multimodal") => {
    setActiveSearchType(type)
    setError(null)
    setCoherenceSimilarity(null)
  }

  // Function to handle clearing results
  const handleClearResults = () => {
    if (onClearResults) {
      onClearResults()
    }
  }

  // Add this function to handle login redirect
  const handleLoginRedirect = () => {
    router.push("/login")
  }

  // Add this function to handle signup redirect
  const handleSignupRedirect = () => {
    router.push("/signup")
  }

  // Add this at the end of the component, just before the final closing tag
  // Add the login dialog after the main component content
  return (
    <>
      <section className="py-2 bg-background border-b border-input">
        <div className="container px-4 md:px-6">
          <div className="mx-auto w-full max-w-5xl">
            {/* Search Type Toggle Button */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={toggleSearchPanel} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{getSearchTypeLabel()}</span>
                  </div>
                  {isSearchOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                </Button>

                {/* Add New Results button */}
                {hasResults && (
                  <Button variant="outline" size="sm" onClick={handleClearResults} className="flex items-center gap-1">
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>New Search</span>
                  </Button>
                )}
              </div>

              {!isSearchOpen && (
                <div className="flex items-center gap-2">
                  {activeSearchType === "text" && (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="text"
                        placeholder="Quick search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full md:w-64 h-10 text-sm"
                      />
                      <Button
                        onClick={handleSearch}
                        disabled={isSearchDisabled()}
                        size="sm"
                        className="bg-primary text-primary-foreground"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {activeSearchType === "image" && previewUrl && (
                    <div className="flex items-center gap-2">
                      <div className="relative h-[30px] w-[30px] overflow-hidden rounded-md border border-input bg-background">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl || "/placeholder.svg"}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <Button
                        onClick={handleSearch}
                        disabled={isSearchDisabled()}
                        size="sm"
                        className="bg-primary text-primary-foreground"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {activeSearchType === "multimodal" && (
                    <div className="flex items-center gap-2">
                      {searchQuery && <span className="text-sm truncate max-w-[100px]">{searchQuery}</span>}
                      {previewUrl && (
                        <div className="relative h-[30px] w-[30px] overflow-hidden rounded-md border border-input bg-background">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewUrl || "/placeholder.svg"}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <Button
                        onClick={handleSearch}
                        disabled={isSearchDisabled()}
                        size="sm"
                        className="bg-primary text-primary-foreground"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Collapsible Search Panel */}
            {isSearchOpen && (
              <div
                ref={searchContainerRef}
                className="border border-input rounded-md p-4 mb-4 bg-background transition-all duration-300 ease-in-out"
              >
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Button
                    variant={activeSearchType === "text" ? "default" : "outline"}
                    onClick={() => handleSearchTypeChange("text")}
                    className={`${activeSearchType === "text" ? "bg-primary text-primary-foreground" : "bg-background text-foreground"}`}
                  >
                    Text Search
                  </Button>
                  <Button
                    variant={activeSearchType === "image" ? "default" : "outline"}
                    onClick={() => handleSearchTypeChange("image")}
                    className={`${activeSearchType === "image" ? "bg-primary text-primary-foreground" : "bg-background text-foreground"}`}
                  >
                    Image Search
                  </Button>
                  <Button
                    variant={activeSearchType === "multimodal" ? "default" : "outline"}
                    onClick={() => handleSearchTypeChange("multimodal")}
                    className={`${activeSearchType === "multimodal" ? "bg-primary text-primary-foreground" : "bg-background text-foreground"}`}
                  >
                    Multimodal Search
                  </Button>
                </div>

                {/* Text Search Content */}
                {activeSearchType === "text" && (
                  <div className="space-y-4">
                    <div className="flex w-full items-center space-x-2">
                      <Input
                        type="text"
                        placeholder="Search for fashion items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-background border-input text-foreground placeholder:text-muted-foreground h-12 rounded-lg"
                      />
                      <Button
                        onClick={handleSearch}
                        disabled={isSearchDisabled()}
                        className="bg-primary text-primary-foreground h-12 px-6 rounded-lg"
                      >
                        {isLoading ? "Searching..." : "Search"}
                        <Search className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Image Search Content */}
                {activeSearchType === "image" && (
                  <div className="space-y-4">
                    <div className="grid w-full gap-1.5">
                      <Label htmlFor="image" className="text-foreground font-medium">
                        Upload Image
                      </Label>
                      <div className="flex items-center gap-4 relative">
                        <div className="grid w-full gap-1.5">
                          <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="bg-background border-input text-foreground h-12 rounded-lg"
                          />
                        </div>
                        <Button
                          onClick={handleSearch}
                          disabled={isSearchDisabled()}
                          className="bg-primary text-primary-foreground h-12 px-6 rounded-lg"
                        >
                          {isLoading ? "Searching..." : "Search"}
                          <Upload className="ml-2 h-4 w-4" />
                        </Button>

                        {previewUrl && (
                          <div className="ml-2">
                            <div className="relative h-[40px] w-[40px] overflow-hidden rounded-md border border-input bg-background">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={previewUrl || "/placeholder.svg"}
                                alt="Preview"
                                className="h-full w-full object-cover"
                              />
                              <button
                                onClick={clearImage}
                                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-background border border-input flex items-center justify-center"
                                aria-label="Remove image"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Multimodal Search Content */}
                {activeSearchType === "multimodal" && (
                  <div className="space-y-4">
                    <div className="grid w-full gap-4">
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="multimodal-text" className="text-foreground font-medium">
                          Text Query
                        </Label>
                        <Input
                          id="multimodal-text"
                          type="text"
                          placeholder="Describe what you're looking for..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="bg-background border-input text-foreground placeholder:text-muted-foreground h-12 rounded-lg"
                        />
                      </div>

                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="multimodal-image" className="text-foreground font-medium">
                          Upload Image
                        </Label>
                        <div className="flex items-center gap-4">
                          <Input
                            id="multimodal-image"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="bg-background border-input text-foreground h-12 rounded-lg flex-1"
                          />

                          {previewUrl && (
                            <div className="ml-2">
                              <div className="relative h-[40px] w-[40px] overflow-hidden rounded-md border border-input bg-background">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={previewUrl || "/placeholder.svg"}
                                  alt="Preview"
                                  className="h-full w-full object-cover"
                                />
                                <button
                                  onClick={clearImage}
                                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-background border border-input flex items-center justify-center"
                                  aria-label="Remove image"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Coherence warning for multimodal search */}
                      {coherenceSimilarity !== null && coherenceSimilarity < 0.2 && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500 rounded-md flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-amber-600 dark:text-amber-400">
                            <p>
                              Your text query and image appear to be unrelated (similarity:{" "}
                              {Math.round(coherenceSimilarity * 100)}%).
                            </p>
                            <p>For better results, ensure your text description matches the content of your image.</p>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleSearch}
                        disabled={isSearchDisabled()}
                        className="bg-primary text-primary-foreground h-12 px-6 rounded-lg"
                      >
                        {isLoading ? "Searching..." : "Combined Search"}
                        <Sparkles className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Remove or comment out the loading indicator in the dropdown */}
                {/* {isLoading && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="flex space-x-2 items-center">
                      <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 rounded-full bg-primary animate-bounce"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                    </div>
                  </div>
                )} */}
              </div>
            )}

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-md mb-4">
                <p className={`text-lg font-medium ${isLightTheme ? "text-[#7e3b92]" : "text-[#2c8e59]"}`}>{error}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
            <DialogDescription>
              Please log in or create an account to use our advanced fashion search features. Create an account to get
              personalized recommendations and save your favorite items.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full bg-primary text-primary-foreground">Log In</Button>
            </Link>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Don't have an account?</span>
              <Link href="/signup" className="text-sm text-primary hover:underline">
                Sign Up
              </Link>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

