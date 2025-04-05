import Image from "next/image"
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

interface SearchResultsProps {
  results: SearchResult[]
  isLoading: boolean
}

export function SearchResults({ results, isLoading }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium mb-2">No results found</h3>
        <p className="text-muted-foreground">Try a different search query or adjust your filters.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {results.map((result) => (
        <Link href={`/product/${result.id}`} key={result.id}>
          <div className="overflow-hidden transition-all hover:shadow-md bg-card border border-input rounded-md h-full">
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={result.image.startsWith("/api") ? result.image : `/api/images/${result.id}`}
                alt={result.name}
                fill
                className="object-cover transition-transform hover:scale-105"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=300&width=300"
                }}
              />
              {result.brand && (
                <div className="absolute top-0 left-0 bg-primary/80 text-primary-foreground text-xs px-2 py-1 rounded-br-md">
                  {result.brand}
                </div>
              )}
              {result.similarity !== undefined && (
                <div className="absolute bottom-0 right-0 bg-background/80 text-foreground text-xs px-2 py-1 rounded-tl-md font-medium">
                  {Math.round((result.similarity || 0) * 100)}% match
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm line-clamp-1 text-foreground">{result.name}</h3>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-muted-foreground">
                  {result.category} • {result.baseColor || "Various"}
                </p>
                {result.price && <p className="text-xs font-medium text-primary">{result.price}</p>}
              </div>
              {result.articleType && (
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-muted-foreground">
                    {result.articleType} • {result.gender || "Unisex"}
                  </p>
                  {result.material && <p className="text-xs text-muted-foreground">{result.material}</p>}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

