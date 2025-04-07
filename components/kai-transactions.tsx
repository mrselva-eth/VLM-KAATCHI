"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { format } from "date-fns"
import type { KaiTransaction } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

export function KaiTransactions() {
  const [transactions, setTransactions] = useState<KaiTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    async function fetchTransactions() {
      if (isAuthenticated) {
        try {
          setIsLoading(true)
          const token = localStorage.getItem("kaatchi_auth_token")

          const response = await fetch("/api/user/kai/balance", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            setTransactions(data.transactions || [])
          }
        } catch (error) {
          console.error("Error fetching KAI transactions:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchTransactions()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-medium mb-3">Recent Transactions</h3>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-medium mb-3">Recent Transactions</h3>
        <div className="text-center py-6 text-muted-foreground border rounded-md">No transactions yet</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium mb-3">Recent Transactions</h3>
      <div className="max-h-[300px] overflow-y-auto pr-2">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors mb-2"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  transaction.type === "credit"
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {transaction.type === "credit" ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{transaction.description}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(transaction.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            <div
              className={`font-medium ${
                transaction.type === "credit" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {transaction.type === "credit" ? "+" : "-"}
              {transaction.amount} KAI
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

