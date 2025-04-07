"use client"

import { useKai } from "@/lib/kai-context"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"

export function KaiBalance() {
  const { balance, isLoading } = useKai()
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
      <div className="relative h-5 w-5">
        <Image src="/kai.png" alt="KAI" width={20} height={20} className="object-contain" />
      </div>
      {isLoading ? <Skeleton className="h-4 w-10" /> : <span className="text-sm font-medium">{balance}</span>}
    </div>
  )
}

