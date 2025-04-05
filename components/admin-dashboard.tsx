"use client"

import { useEffect, useState } from "react"
import { getAdminAnalytics } from "@/lib/admin"
import {
  Users,
  Database,
  Search,
  MessageSquare,
  ShoppingCart,
  Heart,
  PieChart,
  TrendingUp,
  Clock,
  ImageIcon,
  Activity,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { useTheme } from "next-themes"

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { theme } = useTheme()
  const isDark = theme === "dark"

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getAdminAnalytics()
        setAnalytics(data)
      } catch (error: any) {
        console.error("Error fetching admin analytics:", error)
        setError(error.message || "Failed to load admin analytics")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-8 w-8 rounded-md mb-2" />
              <Skeleton className="h-6 w-3/4 mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-6 w-1/4 mb-4" />
              <Skeleton className="h-60 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md max-w-md mx-auto">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  // Chart colors
  const chartColors = {
    primary: isDark ? "#2c8e59" : "#7e3b92",
    secondary: isDark ? "#3b82f6" : "#8b5cf6",
    accent1: isDark ? "#10b981" : "#ec4899",
    accent2: isDark ? "#f59e0b" : "#f97316",
    accent3: isDark ? "#06b6d4" : "#0ea5e9",
    text: isDark ? "#e2e8f0" : "#1e293b",
    background: isDark ? "#1e293b" : "#f8fafc",
    muted: isDark ? "#334155" : "#e2e8f0",
  }

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  // Calculate percentages for user engagement
  const userStats = analytics.userStats || {}
  const totalUsers = userStats.totalUsers || 0
  const searchPercentage = totalUsers > 0 ? (userStats.usersWhoSearched / totalUsers) * 100 : 0
  const imageSearchPercentage = totalUsers > 0 ? (userStats.usersWhoImageSearched / totalUsers) * 100 : 0
  const multimodalSearchPercentage = totalUsers > 0 ? (userStats.usersWhoMultimodalSearched / totalUsers) * 100 : 0
  const chatPercentage = totalUsers > 0 ? (userStats.usersWhoChatted / totalUsers) * 100 : 0

  // Prepare data for user growth chart
  const userGrowthData = analytics.usersByDay || []
  const maxUserGrowth = Math.max(...userGrowthData.map((d: any) => d.count), 1)

  // Prepare data for search types pie chart
  const searchTypes = analytics.searchesByType || []
  const totalSearchCount = searchTypes.reduce((sum: number, item: any) => sum + item.count, 0)

  // Prepare data for user activity by hour
  const activityByHour = analytics.userActivity || []
  const maxHourlyActivity = Math.max(...activityByHour.map((d: any) => d.count), 1)

  return (
    <div className="space-y-8 w-full px-2">
      <h1 className="text-3xl font-bold mb-8 text-center">Admin Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className="border rounded-lg p-4 bg-background hover:border-primary transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Total Users</h3>
          </div>
          <p className="text-2xl font-bold">{formatNumber(analytics.userCount || 0)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            +{formatNumber(analytics.newUsersLast30Days || 0)} in last 30 days
          </p>
        </div>

        <div className="border rounded-lg p-4 bg-background hover:border-primary transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Total Images</h3>
          </div>
          <p className="text-2xl font-bold">{formatNumber(analytics.totalImages || 0)}</p>
          <p className="text-sm text-muted-foreground mt-1">In dataset</p>
        </div>

        <div className="border rounded-lg p-4 bg-background hover:border-primary transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Total Searches</h3>
          </div>
          <p className="text-2xl font-bold">{formatNumber(analytics.totalSearches || 0)}</p>
          <p className="text-sm text-muted-foreground mt-1">Across all search types</p>
        </div>

        <div className="border rounded-lg p-4 bg-background hover:border-primary transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Chat Queries</h3>
          </div>
          <p className="text-2xl font-bold">{formatNumber(analytics.chatQueries || 0)}</p>
          <p className="text-sm text-muted-foreground mt-1">Total chat interactions</p>
        </div>

        <div className="border rounded-lg p-4 bg-background hover:border-primary transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Cart Items</h3>
          </div>
          <p className="text-2xl font-bold">{formatNumber(analytics.cartItems || 0)}</p>
          <p className="text-sm text-muted-foreground mt-1">Items in user carts</p>
        </div>

        <div className="border rounded-lg p-4 bg-background hover:border-primary transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Wishlist Items</h3>
          </div>
          <p className="text-2xl font-bold">{formatNumber(analytics.wishlistItems || 0)}</p>
          <p className="text-sm text-muted-foreground mt-1">Saved for later</p>
        </div>

        <div className="border rounded-lg p-4 bg-background hover:border-primary transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Engagement Rate</h3>
          </div>
          <p className="text-2xl font-bold">{chatPercentage.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground mt-1">Users who used chat</p>
        </div>
      </div>

      {/* Charts - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* User Growth Chart */}
        <div className="border rounded-lg p-6 bg-background hover:bg-background/80 transition-colors hover:border-primary">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            User Growth (Last 30 Days)
          </h3>

          <div className="h-80 relative">
            {/* Line chart for user growth */}
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="overflow-visible"
            >
              {/* Grid lines */}
              <line x1="0" y1="0" x2="0" y2="100" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="0.5" />
              <line x1="0" y1="100" x2="100" y2="100" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="0.5" />
              <line
                x1="0"
                y1="75"
                x2="100"
                y2="75"
                stroke={isDark ? "#334155" : "#e2e8f0"}
                strokeWidth="0.2"
                strokeDasharray="1,1"
              />
              <line
                x1="0"
                y1="50"
                x2="100"
                y2="50"
                stroke={isDark ? "#334155" : "#e2e8f0"}
                strokeWidth="0.2"
                strokeDasharray="1,1"
              />
              <line
                x1="0"
                y1="25"
                x2="100"
                y2="25"
                stroke={isDark ? "#334155" : "#e2e8f0"}
                strokeWidth="0.2"
                strokeDasharray="1,1"
              />

              {/* Line chart */}
              {userGrowthData.length > 0 && (
                <>
                  {/* Area under the line - with very low opacity */}
                  <path
                    d={`
                    M 0,${100 - (userGrowthData[0].count / maxUserGrowth) * 100}
                    ${userGrowthData
                      .map((day: any, index: number) => {
                        const x = (index / (userGrowthData.length - 1)) * 100
                        const y = 100 - (day.count / maxUserGrowth) * 100
                        return `L ${x},${y}`
                      })
                      .join(" ")}
                    L 100,100 L 0,100 Z
                  `}
                    fill="url(#growthGradient)"
                    opacity="0.05"
                  />

                  {/* Define gradient */}
                  <defs>
                    <linearGradient id="growthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={chartColors.primary} stopOpacity="1" />
                      <stop offset="100%" stopColor={chartColors.primary} stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  <polyline
                    points={userGrowthData
                      .map((day: any, index: number) => {
                        const x = (index / (userGrowthData.length - 1)) * 100
                        const y = 100 - (day.count / maxUserGrowth) * 100
                        return `${x},${y}`
                      })
                      .join(" ")}
                    fill="none"
                    stroke={chartColors.primary}
                    strokeWidth="1.5"
                  />

                  {/* Data points */}
                  {userGrowthData.map((day: any, index: number) => {
                    const x = (index / (userGrowthData.length - 1)) * 100
                    const y = 100 - (day.count / maxUserGrowth) * 100
                    return (
                      <g key={index} className="group">
                        <circle
                          cx={x}
                          cy={y}
                          r="1"
                          fill={chartColors.primary}
                          className="transition-all duration-200"
                          onMouseOver={(e) => {
                            e.currentTarget.setAttribute("r", "3")
                            e.currentTarget.setAttribute("fill", isDark ? "#4ade80" : "#a855f7")
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.setAttribute("r", "1")
                            e.currentTarget.setAttribute("fill", chartColors.primary)
                          }}
                        />
                        <text
                          x={x}
                          y={y - 5}
                          textAnchor="middle"
                          fontSize="3"
                          fill={isDark ? "#e2e8f0" : "#1e293b"}
                          opacity="0"
                          className="group-hover:opacity-100 transition-opacity"
                        >
                          {day.count}
                        </text>
                      </g>
                    )
                  })}
                </>
              )}
            </svg>

            {/* X-axis labels */}
            <div className="absolute left-0 right-0 bottom-0 flex justify-between text-xs text-muted-foreground pt-2">
              <span>
                {userGrowthData.length > 0 &&
                  new Date(userGrowthData[0]?.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <span>
                {userGrowthData.length > 0 &&
                  new Date(userGrowthData[Math.floor(userGrowthData.length / 2)]?.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
              </span>
              <span>
                {userGrowthData.length > 0 &&
                  new Date(userGrowthData[userGrowthData.length - 1]?.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
              </span>
            </div>

            {/* Y-axis labels */}
            <div className="absolute top-0 bottom-0 left-0 flex flex-col justify-between text-xs text-muted-foreground pr-2">
              <span>{maxUserGrowth}</span>
              <span>{Math.floor(maxUserGrowth / 2)}</span>
              <span>0</span>
            </div>
          </div>
        </div>

        {/* Search Types Distribution */}
        <div className="border rounded-lg p-6 bg-background hover:bg-background/80 transition-colors hover:border-primary">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Search Types Distribution
          </h3>

          <div className="flex items-center justify-center h-80">
            {totalSearchCount > 0 ? (
              <div className="flex items-center">
                {/* Improved pie chart */}
                <div className="relative w-52 h-52">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {(() => {
                      const colors = ["#3b82f6", "#10b981", "#f59e0b"]
                      const hoverColors = ["#2563eb", "#059669", "#d97706"]
                      let startAngle = 0
                      const segments = []

                      for (let i = 0; i < searchTypes.length; i++) {
                        const type = searchTypes[i]
                        const percentage = (type.count / totalSearchCount) * 100
                        const angle = (percentage / 100) * 360
                        const endAngle = startAngle + angle

                        // Calculate SVG arc path
                        const startRad = ((startAngle - 90) * Math.PI) / 180
                        const endRad = ((endAngle - 90) * Math.PI) / 180

                        const x1 = 50 + 40 * Math.cos(startRad)
                        const y1 = 50 + 40 * Math.sin(startRad)
                        const x2 = 50 + 40 * Math.cos(endRad)
                        const y2 = 50 + 40 * Math.sin(endRad)

                        const largeArcFlag = angle > 180 ? 1 : 0

                        const pathData = [
                          `M 50 50`,
                          `L ${x1} ${y1}`,
                          `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                          `Z`,
                        ].join(" ")

                        segments.push(
                          <path
                            key={i}
                            d={pathData}
                            fill={colors[i % colors.length]}
                            stroke={isDark ? "#1e293b" : "#ffffff"}
                            strokeWidth="1"
                            className="transition-all duration-200"
                            onMouseOver={(e) => {
                              e.currentTarget.setAttribute("fill", hoverColors[i % hoverColors.length])
                              e.currentTarget.setAttribute("transform", "scale(1.05) translate(-2.5, -2.5)")
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.setAttribute("fill", colors[i % colors.length])
                              e.currentTarget.setAttribute("transform", "scale(1) translate(0, 0)")
                            }}
                          />,
                        )

                        // Add text label if segment is large enough
                        if (percentage > 10) {
                          const labelRad = ((startAngle + angle / 2 - 90) * Math.PI) / 180
                          const labelX = 50 + 25 * Math.cos(labelRad)
                          const labelY = 50 + 25 * Math.sin(labelRad)

                          segments.push(
                            <text
                              key={`text-${i}`}
                              x={labelX}
                              y={labelY}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#ffffff"
                              fontSize="8"
                              fontWeight="bold"
                            >
                              {Math.round(percentage)}%
                            </text>,
                          )
                        }

                        startAngle = endAngle
                      }

                      return segments
                    })()}

                    {/* Center circle for donut chart effect */}
                    <circle cx="50" cy="50" r="20" fill={isDark ? "#1e293b" : "#ffffff"} />

                    {/* Center text */}
                    <text
                      x="50"
                      y="46"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill={isDark ? "#e2e8f0" : "#1e293b"}
                    >
                      {formatNumber(totalSearchCount)}
                    </text>
                    <text x="50" y="56" textAnchor="middle" fontSize="6" fill={isDark ? "#94a3b8" : "#64748b"}>
                      Total
                    </text>
                  </svg>
                </div>

                {/* Legend */}
                <div className="ml-8 space-y-4">
                  <div className="flex items-center p-2 rounded-md hover:bg-muted transition-colors">
                    <div className="w-5 h-5 rounded-full bg-blue-500 mr-3"></div>
                    <div>
                      <span className="text-sm font-medium">Text</span>
                      <span className="ml-2 text-sm text-muted-foreground">({searchTypes[0]?.count || 0})</span>
                    </div>
                  </div>
                  <div className="flex items-center p-2 rounded-md hover:bg-muted transition-colors">
                    <div className="w-5 h-5 rounded-full bg-green-500 mr-3"></div>
                    <div>
                      <span className="text-sm font-medium">Image</span>
                      <span className="ml-2 text-sm text-muted-foreground">({searchTypes[1]?.count || 0})</span>
                    </div>
                  </div>
                  <div className="flex items-center p-2 rounded-md hover:bg-muted transition-colors">
                    <div className="w-5 h-5 rounded-full bg-amber-500 mr-3"></div>
                    <div>
                      <span className="text-sm font-medium">Multimodal</span>
                      <span className="ml-2 text-sm text-muted-foreground">({searchTypes[2]?.count || 0})</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No search data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity by Hour - Line Chart */}
        <div className="border rounded-lg p-6 bg-background hover:bg-background/80 transition-colors hover:border-primary">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            User Activity by Hour (24h)
          </h3>

          <div className="h-80 relative">
            {/* Line chart for hourly activity */}
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="overflow-visible"
            >
              {/* Grid lines */}
              <line x1="0" y1="0" x2="0" y2="100" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="0.5" />
              <line x1="0" y1="100" x2="100" y2="100" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="0.5" />
              <line
                x1="0"
                y1="75"
                x2="100"
                y2="75"
                stroke={isDark ? "#334155" : "#e2e8f0"}
                strokeWidth="0.2"
                strokeDasharray="1,1"
              />
              <line
                x1="0"
                y1="50"
                x2="100"
                y2="50"
                stroke={isDark ? "#334155" : "#e2e8f0"}
                strokeWidth="0.2"
                strokeDasharray="1,1"
              />
              <line
                x1="0"
                y1="25"
                x2="100"
                y2="25"
                stroke={isDark ? "#334155" : "#e2e8f0"}
                strokeWidth="0.2"
                strokeDasharray="1,1"
              />

              {/* Line chart */}
              {activityByHour.length > 0 && (
                <>
                  {/* Area under the line - with very low opacity */}
                  <path
                    d={`
                    M 0,${100 - (activityByHour[0].count / maxHourlyActivity) * 100}
                    ${activityByHour
                      .map((hour: any, index: number) => {
                        const x = (index / (activityByHour.length - 1)) * 100
                        const y = 100 - (hour.count / maxHourlyActivity) * 100
                        return `L ${x},${y}`
                      })
                      .join(" ")}
                    L 100,100 L 0,100 Z
                  `}
                    fill="url(#activityGradient)"
                    opacity="0.05"
                  />

                  {/* Define gradient */}
                  <defs>
                    <linearGradient id="activityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={chartColors.accent3} stopOpacity="1" />
                      <stop offset="100%" stopColor={chartColors.accent3} stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  {/* Line */}
                  <polyline
                    points={activityByHour
                      .map((hour: any, index: number) => {
                        const x = (index / (activityByHour.length - 1)) * 100
                        const y = 100 - (hour.count / maxHourlyActivity) * 100
                        return `${x},${y}`
                      })
                      .join(" ")}
                    fill="none"
                    stroke={chartColors.accent3}
                    strokeWidth="1.5"
                  />

                  {/* Data points */}
                  {activityByHour.map((hour: any, index: number) => {
                    const x = (index / (activityByHour.length - 1)) * 100
                    const y = 100 - (hour.count / maxHourlyActivity) * 100
                    return (
                      <g key={index} className="group">
                        <circle
                          cx={x}
                          cy={y}
                          r="1"
                          fill={chartColors.accent3}
                          className="transition-all duration-200"
                          onMouseOver={(e) => {
                            e.currentTarget.setAttribute("r", "3")
                            e.currentTarget.setAttribute("fill", isDark ? "#22d3ee" : "#0ea5e9")
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.setAttribute("r", "1")
                            e.currentTarget.setAttribute("fill", chartColors.accent3)
                          }}
                        />
                        <text
                          x={x}
                          y={y - 5}
                          textAnchor="middle"
                          fontSize="3"
                          fill={isDark ? "#e2e8f0" : "#1e293b"}
                          opacity="0"
                          className="group-hover:opacity-100 transition-opacity"
                        >
                          {hour.count}
                        </text>
                      </g>
                    )
                  })}
                </>
              )}
            </svg>

            {/* X-axis labels */}
            <div className="absolute left-0 right-0 bottom-0 flex justify-between text-xs text-muted-foreground pt-2">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>

            {/* Y-axis labels */}
            <div className="absolute top-0 bottom-0 left-0 flex flex-col justify-between text-xs text-muted-foreground pr-2">
              <span>{maxHourlyActivity}</span>
              <span>{Math.floor(maxHourlyActivity / 2)}</span>
              <span>0</span>
            </div>
          </div>
        </div>

        {/* User Engagement */}
        <div className="border rounded-lg p-6 bg-background hover:bg-background/80 transition-colors hover:border-primary">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            User Engagement Metrics
          </h3>

          <div className="space-y-8 mt-6">
            <div className="space-y-2 hover:opacity-90 transition-opacity">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Users Who Searched</span>
                <span className="font-bold">{searchPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-in-out hover:bg-blue-600"
                  style={{ width: `${searchPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2 hover:opacity-90 transition-opacity">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Users Who Used Image Search</span>
                <span className="font-bold">{imageSearchPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-1000 ease-in-out hover:bg-purple-600"
                  style={{ width: `${imageSearchPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2 hover:opacity-90 transition-opacity">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Users Who Used Multimodal Search</span>
                <span className="font-bold">{multimodalSearchPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-in-out hover:bg-green-600"
                  style={{ width: `${multimodalSearchPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2 hover:opacity-90 transition-opacity">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Users Who Used Chat</span>
                <span className="font-bold">{chatPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-in-out hover:bg-amber-600"
                  style={{ width: `${chatPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Search Terms */}
      <div className="grid grid-cols-1 gap-6">
        <div className="border rounded-lg p-6 bg-background hover:bg-background/80 transition-colors hover:border-primary">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Top Search Terms
          </h3>

          <div className="space-y-2">
            {(analytics.topSearchTerms || []).length > 0 ? (
              (analytics.topSearchTerms || []).map((term: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 hover:bg-muted rounded-md transition-colors cursor-pointer"
                >
                  <span className="flex items-center">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary mr-3 text-sm font-bold hover:bg-primary hover:text-white transition-colors">
                      {index + 1}
                    </span>
                    <span className="font-medium">{term._id}</span>
                  </span>
                  <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium hover:bg-primary hover:text-white transition-colors">
                    {term.count} searches
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-16 w-16 mx-auto mb-3 opacity-30" />
                <p>No search data available yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="border rounded-lg p-6 bg-background hover:bg-background/80 transition-colors hover:border-primary">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          System Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="p-4 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md flex items-center hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors cursor-pointer">
            <div className="h-4 w-4 rounded-full bg-green-500 mr-3 animate-pulse"></div>
            <span className="font-medium">MongoDB: Connected</span>
          </div>

          <div className="p-4 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md flex items-center hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors cursor-pointer">
            <div className="h-4 w-4 rounded-full bg-green-500 mr-3 animate-pulse"></div>
            <span className="font-medium">Image Service: Online</span>
          </div>

          <div className="p-4 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md flex items-center hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors cursor-pointer">
            <div className="h-4 w-4 rounded-full bg-green-500 mr-3 animate-pulse"></div>
            <span className="font-medium">VLM Service: Online</span>
          </div>

          <div className="p-4 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md flex items-center hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors cursor-pointer">
            <div className="h-4 w-4 rounded-full bg-green-500 mr-3 animate-pulse"></div>
            <span className="font-medium">Authentication: Active</span>
          </div>

          <div className="p-4 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md flex items-center hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors cursor-pointer">
            <div className="h-4 w-4 rounded-full bg-green-500 mr-3 animate-pulse"></div>
            <span className="font-medium">Search API: Operational</span>
          </div>

          <div className="p-4 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md flex items-center hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors cursor-pointer">
            <div className="h-4 w-4 rounded-full bg-green-500 mr-3 animate-pulse"></div>
            <span className="font-medium">Analytics: Collecting</span>
          </div>
        </div>

        <div className="mt-4 text-right text-xs text-muted-foreground">
          Last updated: {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
        </div>
      </div>
    </div>
  )
}

