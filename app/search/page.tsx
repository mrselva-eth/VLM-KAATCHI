"use client"

import { Navbar } from "@/components/navbar"
import { SearchSection } from "@/components/search-section"
import { FilterSection } from "@/components/filter-section"
import { SearchResults } from "@/components/search-results"
import { useState, useCallback, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Filter, X, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
// Add these imports at the top
import { useSearchParams, useRouter as useNextRouter } from "next/navigation"

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
  season?: string
}

// Update the interface to match the updated function signature
// Add this after the SearchResult interface
interface SearchInfo {
  query?: string
  type?: string
  image?: string
}

// Storage key for search results
const SEARCH_RESULTS_STORAGE_KEY = "kaatchi_search_results"
const SEARCH_FILTERS_STORAGE_KEY = "kaatchi_search_filters"

export default function SearchPage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<Record<string, string | number[] | boolean>>({})
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([])
  const { theme } = useTheme()
  const isLightTheme = theme === "light"
  const router = useRouter()
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const resultsPerPage = 28
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage)

  // Add this after the existing state declarations
  const searchParams = useSearchParams()
  const nextRouter = useNextRouter()

  // Load search results from sessionStorage on initial render
  useEffect(() => {
    // Check if we have stored search results
    try {
      const storedResults = sessionStorage.getItem(SEARCH_RESULTS_STORAGE_KEY)
      const storedFilters = sessionStorage.getItem(SEARCH_FILTERS_STORAGE_KEY)

      if (storedResults) {
        const parsedResults = JSON.parse(storedResults) as SearchResult[]
        setSearchResults(parsedResults)

        // Apply filters if they exist
        if (storedFilters) {
          const parsedFilters = JSON.parse(storedFilters)
          setFilters(parsedFilters)
          applyFiltersToResults(parsedResults, parsedFilters)
        } else {
          setFilteredResults(parsedResults)
        }
      }
    } catch (error) {
      console.error("Error loading stored search results:", error)
    }
  }, [])

  // Add this useEffect to restore search state from URL parameters
  useEffect(() => {
    // Check if we have search parameters in the URL
    const query = searchParams.get("q")
    const type = searchParams.get("type")
    const imageParam = searchParams.get("image")

    if (query || type || imageParam) {
      setIsLoading(true)

      // Prepare the search request based on URL parameters
      const searchType = (type as "text" | "image" | "multimodal") || "text"

      // Create form data for the request
      const formData = new FormData()
      formData.append("searchType", searchType)

      if (query) {
        formData.append("query", query)
      }

      // Apply any filters from URL if they exist
      const filtersParam = searchParams.get("filters")
      if (filtersParam) {
        try {
          const parsedFilters = JSON.parse(decodeURIComponent(filtersParam))
          setFilters(parsedFilters)
          formData.append("filters", filtersParam)
        } catch (e) {
          console.error("Error parsing filters from URL", e)
        }
      }

      formData.append("topK", "50")

      // Execute the search
      fetch("/api/vlm", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.results) {
            setSearchResults(data.results)
            applyFiltersToResults(data.results, filters)
          }
        })
        .catch((error) => {
          console.error("Error restoring search:", error)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [searchParams, filters])

  // Get current results for pagination
  const getCurrentResults = () => {
    const startIndex = (currentPage - 1) * resultsPerPage
    const endIndex = startIndex + resultsPerPage
    return filteredResults.slice(startIndex, endIndex)
  }

  // Reset to page 1 when results change
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredResults])

  const goBack = () => {
    router.back()
  }

  // Update handleResultsChange to store results in sessionStorage
  const handleResultsChange = useCallback(
    (results: SearchResult[], searchInfo?: SearchInfo) => {
      setSearchResults(results)

      // Apply filters to the new results
      applyFiltersToResults(results, filters)
      setIsLoading(false)

      // Store results in sessionStorage
      try {
        sessionStorage.setItem(SEARCH_RESULTS_STORAGE_KEY, JSON.stringify(results))

        // Store filters if they exist
        if (Object.keys(filters).length > 0) {
          sessionStorage.setItem(SEARCH_FILTERS_STORAGE_KEY, JSON.stringify(filters))
        } else {
          sessionStorage.removeItem(SEARCH_FILTERS_STORAGE_KEY)
        }
      } catch (error) {
        console.error("Error storing search results:", error)
      }
    },
    [filters],
  )

  // Use useCallback for filter changes
  const handleFilterChange = useCallback(
    (newFilters: Record<string, string | number[] | boolean>) => {
      setFilters(newFilters)

      // Apply the new filters to the existing results
      applyFiltersToResults(searchResults, newFilters)

      // Store the updated filters
      try {
        if (Object.keys(newFilters).length > 0) {
          sessionStorage.setItem(SEARCH_FILTERS_STORAGE_KEY, JSON.stringify(newFilters))
        } else {
          sessionStorage.removeItem(SEARCH_FILTERS_STORAGE_KEY)
        }
      } catch (error) {
        console.error("Error storing filters:", error)
      }
    },
    [searchResults],
  )

  // Update the applyFiltersToResults function to handle the enhanced filters
  const applyFiltersToResults = (
    results: SearchResult[],
    currentFilters: Record<string, string | number[] | boolean | string[]>,
  ) => {
    if (!results || results.length === 0) {
      setFilteredResults([])
      return
    }

    if (Object.keys(currentFilters).length === 0) {
      setFilteredResults(results)
      return
    }

    const filtered = results.filter((item) => {
      let matches = true

      // Gender filter
      if (currentFilters.gender && item.gender) {
        matches = matches && item.gender.toLowerCase() === (currentFilters.gender as string).toLowerCase()
      }

      // Master Category filter
      if (currentFilters.masterCategory && item.category) {
        matches = matches && item.category.toLowerCase() === (currentFilters.masterCategory as string).toLowerCase()
      }

      // Sub Category filter
      if (currentFilters.subCategory && item.subCategory) {
        matches = matches && item.subCategory.toLowerCase() === (currentFilters.subCategory as string).toLowerCase()
      }

      // Article Type filter
      if (currentFilters.articleType && item.articleType) {
        matches = matches && item.articleType.toLowerCase() === (currentFilters.articleType as string).toLowerCase()
      }

      // Color filter
      if (currentFilters.baseColour && item.baseColor) {
        matches = matches && item.baseColor.toLowerCase() === (currentFilters.baseColour as string).toLowerCase()
      }

      // Usage filter
      if (currentFilters.usage && item.usage) {
        matches = matches && item.usage.toLowerCase() === (currentFilters.usage as string).toLowerCase()
      }

      // Season filter (if available in your data)
      if (currentFilters.season && item.season) {
        matches = matches && item.season.toLowerCase() === (currentFilters.season as string).toLowerCase()
      }

      // Multi-select colors
      if (
        currentFilters.selectedColors &&
        Array.isArray(currentFilters.selectedColors) &&
        currentFilters.selectedColors.length > 0 &&
        item.baseColor
      ) {
        matches =
          matches &&
          (currentFilters.selectedColors as string[]).some(
            (color) => item.baseColor?.toLowerCase() === color.toLowerCase(),
          )
      }

      // Price range filter
      if (currentFilters.priceRange && item.price) {
        const priceRange = currentFilters.priceRange as number[]
        const itemPrice = Number.parseFloat(item.price.replace("$", ""))
        matches = matches && itemPrice >= priceRange[0] && itemPrice <= priceRange[1]
      }

      return matches
    })

    setFilteredResults(filtered)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of results
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  // Add a function to clear search results
  const clearSearchResults = () => {
    setSearchResults([])
    setFilteredResults([])
    setFilters({})
    sessionStorage.removeItem(SEARCH_RESULTS_STORAGE_KEY)
    sessionStorage.removeItem(SEARCH_FILTERS_STORAGE_KEY)
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Go Back Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goBack}
        className="fixed top-[72px] left-4 z-50 text-foreground hover:bg-muted h-8 w-8"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Go back</span>
      </Button>

      {/* Fixed search section */}
      <div className="sticky top-16 z-40 w-full bg-background border-b border-input">
        <SearchSection
          onResultsChange={handleResultsChange}
          filters={filters as Record<string, string>}
          hasResults={searchResults.length > 0}
          onClearResults={clearSearchResults}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      </div>

      <div className="flex flex-1 relative">
        {/* Fixed sidebar for desktop */}
        <div className="hidden md:block w-[280px] h-[calc(100vh-120px)] sticky top-[120px] overflow-y-auto pr-4 pt-4">
          <FilterSection onFilterChange={handleFilterChange} />
        </div>

        {/* Mobile filter toggle button - fixed to the bottom left */}
        <div className="md:hidden fixed bottom-4 left-4 z-50">
          <Button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="rounded-full h-12 w-12 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Filter className="h-5 w-5" />
            <span className="sr-only">Toggle filters</span>
          </Button>
        </div>

        {/* Mobile filter panel - slides in from bottom */}
        {showMobileFilters && (
          <div className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-end">
            <div className="bg-background border-t border-input rounded-t-xl p-4 w-full max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Filters</h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowMobileFilters(false)}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              <FilterSection onFilterChange={handleFilterChange} />
              <div className="pt-4 sticky bottom-0 bg-background border-t mt-4">
                <Button
                  className="w-full bg-primary text-primary-foreground"
                  onClick={() => setShowMobileFilters(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main content area - scrollable */}
        <div className="flex-1 p-4 md:pl-6 md:pr-6 pb-20 md:pb-6 overflow-y-auto">
          {/* Replace the existing loading overlay with the new main-content-loading class */}
          {isLoading && (
            <div className="main-content-loading">
              <div className="loadingspinner">
                <div id="square1"></div>
                <div id="square2"></div>
                <div id="square3"></div>
                <div id="square4"></div>
                <div id="square5"></div>
              </div>
              <p className="text-center mt-4 text-foreground font-medium">Searching...</p>
            </div>
          )}
          {searchResults.length > 0 ? (
            filteredResults.length > 0 || Object.keys(filters).length === 0 ? (
              <>
                <SearchResults results={getCurrentResults()} isLoading={false} />

                {/* Pagination Controls */}
                {filteredResults.length > resultsPerPage && (
                  <div className="flex justify-center items-center mt-8 mb-4 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Previous page</span>
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          // Show first, last, current and pages adjacent to current
                          return (
                            page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)
                          )
                        })
                        .map((page, index, array) => {
                          // Add ellipsis if there are gaps
                          const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1
                          const showEllipsisAfter = index < array.length - 1 && array[index + 1] !== page + 1

                          return (
                            <div key={page} className="flex items-center">
                              {showEllipsisBefore && <span className="mx-1 text-muted-foreground">...</span>}

                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className={`h-8 w-8 p-0 ${
                                  currentPage === page ? "bg-primary text-primary-foreground" : "text-foreground"
                                }`}
                              >
                                {page}
                              </Button>

                              {showEllipsisAfter && <span className="mx-1 text-muted-foreground">...</span>}
                            </div>
                          )
                        })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Next page</span>
                    </Button>
                  </div>
                )}

                {/* Results count information */}
                <div className="text-center text-sm text-muted-foreground mt-2">
                  Showing {(currentPage - 1) * resultsPerPage + 1} -{" "}
                  {Math.min(currentPage * resultsPerPage, filteredResults.length)} of {filteredResults.length} results
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium mb-2">No matching products</h3>
                <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <h2 className="text-xl font-medium mb-2 text-foreground">No search results yet</h2>
              <p className="text-muted-foreground">
                Use the search options above to find fashion products that match your criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

