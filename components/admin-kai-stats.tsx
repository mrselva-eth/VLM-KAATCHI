"use client"

import { useEffect, useState } from "react"
import { Coins, ArrowUpRight, ArrowDownRight, Search, MessageSquare, Users, Clock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { useTheme } from "next-themes"
import Image from "next/image"

export function AdminKaiStats() {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { theme } = useTheme()
  const isDark = theme === "dark"

  useEffect(() => {
    async function fetchKaiStats() {
      try {
        setIsLoading(true)
        setError(null)

        const token = localStorage.getItem("kaatchi_auth_token")
        const response = await fetch("/api/admin/kai-stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch KAI statistics")
        }

        const data = await response.json()
        setStats(data)
      } catch (error: any) {
        console.error("Error fetching KAI statistics:", error)
        setError(error.message || "Failed to load KAI statistics")
      } finally {
        setIsLoading(false)
      }
    }

    fetchKaiStats()
  }, [])

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

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold mb-4">KAI Credits Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-8 w-8 rounded-md mb-2" />
              <Skeleton className="h-6 w-3/4 mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {[1, 2].map((i) => (
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
        <h2 className="text-2xl font-bold mb-4">KAI Credits Statistics</h2>
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md max-w-md mx-auto">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">KAI Credits Statistics</h2>
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  // Prepare data for daily transactions chart
  const dailyStats = stats.dailyStats || []
  const maxDailyValue = Math.max(...dailyStats.map((day: any) => Math.max(day.credited, day.debited)), 1)

  return (
    <div className="space-y-8 w-full px-2">
      <h2 className="text-2xl font-bold mb-4">KAI Credits Statistics</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-background hover:border-primary transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative h-5 w-5">
              <Image src="/kai.png" alt="KAI" width={20} height={20} className="object-contain" />
            </div>
            <h3 className="font-medium">Total KAI Claimed</h3>
          </div>
          <p className="text-2xl font-bold">{formatNumber(stats.totalClaimed || 0)}</p>
          <p className="text-sm text-muted-foreground mt-1">From signup bonuses</p>
        </div>

        <div className="border rounded-lg p-4 bg-background hover:border-primary transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative h-5 w-5">
              <Image src="/kai.png" alt="KAI" width={20} height={20} className="object-contain" />
            </div>
            <h3 className="font-medium">Total KAI Spent</h3>
          </div>
          <p className="text-2xl font-bold">{formatNumber(stats.totalSpent || 0)}</p>
          <p className="text-sm text-muted-foreground mt-1">Across all features</p>
        </div>

        <div className="border rounded-lg p-4 bg-background hover:border-primary transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-5 w-5 text-primary" />
            <h3 className="font-medium">KAI Spent on Search</h3>
          </div>
          <p className="text-2xl font-bold">{formatNumber(stats.searchSpent || 0)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.totalSpent > 0
              ? `${((stats.searchSpent / stats.totalSpent) * 100).toFixed(1)}% of total`
              : "0% of total"}
          </p>
        </div>

        <div className="border rounded-lg p-4 bg-background hover:border-primary transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="font-medium">KAI Spent on Chat</h3>
          </div>
          <p className="text-2xl font-bold">{formatNumber(stats.chatSpent || 0)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.totalSpent > 0
              ? `${((stats.chatSpent / stats.totalSpent) * 100).toFixed(1)}% of total`
              : "0% of total"}
          </p>
        </div>
      </div>

      {/* Charts - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Daily KAI Transactions Chart */}
        <div className="border rounded-lg p-6 bg-background hover:bg-background/80 transition-colors hover:border-primary">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Daily KAI Transactions (Last 30 Days)
          </h3>

          <div className="h-80 relative">
            {/* Line chart for daily transactions */}
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
              {dailyStats.length > 0 && (
                <>
                  {/* Credits line */}
                  <polyline
                    points={dailyStats
                      .map((day: any, index: number) => {
                        const x = (index / (dailyStats.length - 1)) * 100
                        const y = 100 - (day.credited / maxDailyValue) * 100
                        return `${x},${y}`
                      })
                      .join(" ")}
                    fill="none"
                    stroke={chartColors.accent1}
                    strokeWidth="1.5"
                  />

                  {/* Debits line */}
                  <polyline
                    points={dailyStats
                      .map((day: any, index: number) => {
                        const x = (index / (dailyStats.length - 1)) * 100
                        const y = 100 - (day.debited / maxDailyValue) * 100
                        return `${x},${y}`
                      })
                      .join(" ")}
                    fill="none"
                    stroke={chartColors.accent2}
                    strokeWidth="1.5"
                  />

                  {/* Data points for credits */}
                  {dailyStats.map((day: any, index: number) => {
                    const x = (index / (dailyStats.length - 1)) * 100
                    const y = 100 - (day.credited / maxDailyValue) * 100
                    return (
                      <g key={`credit-${index}`} className="group">
                        <circle
                          cx={x}
                          cy={y}
                          r="1"
                          fill={chartColors.accent1}
                          className="transition-all duration-200"
                          onMouseOver={(e) => {
                            e.currentTarget.setAttribute("r", "3")
                            e.currentTarget.setAttribute("fill", isDark ? "#4ade80" : "#ec4899")
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.setAttribute("r", "1")
                            e.currentTarget.setAttribute("fill", chartColors.accent1)
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
                          +{day.credited}
                        </text>
                      </g>
                    )
                  })}

                  {/* Data points for debits */}
                  {dailyStats.map((day: any, index: number) => {
                    const x = (index / (dailyStats.length - 1)) * 100
                    const y = 100 - (day.debited / maxDailyValue) * 100
                    return (
                      <g key={`debit-${index}`} className="group">
                        <circle
                          cx={x}
                          cy={y}
                          r="1"
                          fill={chartColors.accent2}
                          className="transition-all duration-200"
                          onMouseOver={(e) => {
                            e.currentTarget.setAttribute("r", "3")
                            e.currentTarget.setAttribute("fill", isDark ? "#f59e0b" : "#f97316")
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.setAttribute("r", "1")
                            e.currentTarget.setAttribute("fill", chartColors.accent2)
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
                          -{day.debited}
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
                {dailyStats.length > 0 &&
                  new Date(dailyStats[0]?.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <span>
                {dailyStats.length > 0 &&
                  new Date(dailyStats[Math.floor(dailyStats.length / 2)]?.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
              </span>
              <span>
                {dailyStats.length > 0 &&
                  new Date(dailyStats[dailyStats.length - 1]?.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
              </span>
            </div>

            {/* Y-axis labels */}
            <div className="absolute top-0 bottom-0 left-0 flex flex-col justify-between text-xs text-muted-foreground pr-2">
              <span>{maxDailyValue}</span>
              <span>{Math.floor(maxDailyValue / 2)}</span>
              <span>0</span>
            </div>

            {/* Legend */}
            <div className="absolute top-0 right-0 flex items-center gap-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.accent1 }}></div>
                <span className="ml-1 text-xs">Credits</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.accent2 }}></div>
                <span className="ml-1 text-xs">Debits</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Users by KAI Balance */}
        <div className="border rounded-lg p-6 bg-background hover:bg-background/80 transition-colors hover:border-primary">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Top Users by KAI Balance
          </h3>

          <div className="space-y-4">
            {stats.topUsers && stats.topUsers.length > 0 ? (
              stats.topUsers.map((user: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-muted rounded-md transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative h-4 w-4">
                      <Image src="/kai.png" alt="KAI" width={16} height={16} className="object-contain" />
                    </div>
                    <span className="font-bold">{user.kaiBalance}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No user data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="border rounded-lg p-6 bg-background hover:bg-background/80 transition-colors hover:border-primary">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent KAI Transactions
        </h3>

        <div className="overflow-hidden">
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-background z-10">
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">User ID</th>
                  <th className="text-left py-2 px-4 font-medium">Type</th>
                  <th className="text-left py-2 px-4 font-medium">Amount</th>
                  <th className="text-left py-2 px-4 font-medium">Description</th>
                  <th className="text-left py-2 px-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions && stats.recentTransactions.length > 0 ? (
                  stats.recentTransactions.map((transaction: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4 text-sm">{transaction.userId.substring(0, 8)}...</td>
                      <td className="py-2 px-4">
                        <div className="flex items-center">
                          {transaction.type === "credit" ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={transaction.type === "credit" ? "text-green-500" : "text-red-500"}>
                            {transaction.type}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-4 font-medium">
                        {transaction.type === "credit" ? "+" : "-"}
                        {transaction.amount}
                      </td>
                      <td className="py-2 px-4">{transaction.description}</td>
                      <td className="py-2 px-4 text-sm text-muted-foreground">
                        {format(new Date(transaction.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      No transactions available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

