"use client"

import { useEffect, useState } from "react"
import { getUserStats } from "@/lib/analytics"
import { MessageSquare, Search, ImageIcon, Split, Calendar, BarChart3 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true)
        const data = await getUserStats()
        setStats(data)
      } catch (error) {
        console.error("Error fetching user stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Your Activity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-8 w-8 rounded-md mb-2" />
              <Skeleton className="h-6 w-3/4 mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
        <div className="border rounded-lg p-4 mt-4">
          <Skeleton className="h-6 w-1/4 mb-4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  // Initialize stats to zero if not present
  const chatQueries = stats?.chat_query || 0
  const textSearches = stats?.search_text || 0
  const imageSearches = stats?.search_image || 0
  const multimodalSearches = stats?.search_multimodal || 0
  const totalSearches = textSearches + imageSearches + multimodalSearches
  const totalActivity = chatQueries + totalSearches

  // Format last activity dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Never"
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a")
    } catch {
      return "Unknown"
    }
  }

  const lastChatActivity = formatDate(stats?.lastActivity?.chat_query)
  const lastTextSearch = formatDate(stats?.lastActivity?.search_text)
  const lastImageSearch = formatDate(stats?.lastActivity?.search_image)
  const lastMultimodalSearch = formatDate(stats?.lastActivity?.search_multimodal)

  // Calculate percentages for charts
  const searchPercentages = {
    text: totalSearches > 0 ? (textSearches / totalSearches) * 100 : 0,
    image: totalSearches > 0 ? (imageSearches / totalSearches) * 100 : 0,
    multimodal: totalSearches > 0 ? (multimodalSearches / totalSearches) * 100 : 0,
  }

  const activityPercentages = {
    chat: totalActivity > 0 ? (chatQueries / totalActivity) * 100 : 0,
    search: totalActivity > 0 ? (totalSearches / totalActivity) * 100 : 0,
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Your Activity</h2>

      {/* Activity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-background hover:border-primary transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Chat Queries</h3>
          </div>
          <p className="text-2xl font-bold">{chatQueries}</p>
          <p className="text-sm text-muted-foreground mt-1">Last: {lastChatActivity}</p>
        </div>

        <div className="border rounded-lg p-4 bg-background hover:border-primary transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Text Searches</h3>
          </div>
          <p className="text-2xl font-bold">{textSearches}</p>
          <p className="text-sm text-muted-foreground mt-1">Last: {lastTextSearch}</p>
        </div>

        <div className="border rounded-lg p-4 bg-background hover:border-primary transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Image Searches</h3>
          </div>
          <p className="text-2xl font-bold">{imageSearches}</p>
          <p className="text-sm text-muted-foreground mt-1">Last: {lastImageSearch}</p>
        </div>

        <div className="border rounded-lg p-4 bg-background hover:border-primary transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Split className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Multimodal Searches</h3>
          </div>
          <p className="text-2xl font-bold">{multimodalSearches}</p>
          <p className="text-sm text-muted-foreground mt-1">Last: {lastMultimodalSearch}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="border rounded-lg p-4 bg-background">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Search Type Distribution
          </h3>

          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Text Search</span>
                <span>{searchPercentages.text.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${searchPercentages.text}%` }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Image Search</span>
                <span>{searchPercentages.image.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${searchPercentages.image}%` }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Multimodal Search</span>
                <span>{searchPercentages.multimodal.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${searchPercentages.multimodal}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-background">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Overall Activity
          </h3>

          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Chat Activity</span>
                <span>{activityPercentages.chat.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${activityPercentages.chat}%` }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Search Activity</span>
                <span>{activityPercentages.search.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500" style={{ width: `${activityPercentages.search}%` }}></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Activity</span>
              <span className="font-medium">{totalActivity} actions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

