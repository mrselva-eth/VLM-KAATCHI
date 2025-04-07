"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getKaiBalance } from "@/lib/kai-service"
import { useAuth } from "@/lib/auth-context"

interface KaiContextType {
  balance: number
  isLoading: boolean
  refreshBalance: () => Promise<void>
  setBalance: (newBalance: number) => void
}

const KaiContext = createContext<KaiContextType | undefined>(undefined)

export function KaiProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { isAuthenticated } = useAuth()

  const refreshBalance = async () => {
    if (!isAuthenticated) {
      setBalance(0)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const kaiBalance = await getKaiBalance()
      setBalance(kaiBalance)
    } catch (error) {
      console.error("Error fetching KAI balance:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch of balance
  useEffect(() => {
    refreshBalance()
  }, [isAuthenticated])

  return (
    <KaiContext.Provider value={{ balance, isLoading, refreshBalance, setBalance }}>{children}</KaiContext.Provider>
  )
}

export function useKai() {
  const context = useContext(KaiContext)
  if (context === undefined) {
    throw new Error("useKai must be used within a KaiProvider")
  }
  return context
}

