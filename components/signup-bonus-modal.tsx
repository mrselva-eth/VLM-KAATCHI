"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { claimSignupBonus } from "@/lib/kai-service"
import Image from "next/image"
import { useKai } from "@/lib/kai-context"

export function SignupBonusModal({ onClose }: { onClose: () => void }) {
  const { isAuthenticated } = useAuth()
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  const { refreshBalance } = useKai()

  useEffect(() => {
    if (!isAuthenticated) {
      onClose()
    }
  }, [isAuthenticated, onClose])

  const handleClaimBonus = async () => {
    setIsClaiming(true)
    setClaimError(null)

    try {
      const result = await claimSignupBonus()

      if (result.success) {
        setClaimSuccess(true)
        await refreshBalance()
      } else {
        setClaimError(result.message || "Failed to claim bonus")
      }
    } catch (error: any) {
      console.error("Error claiming bonus:", error)
      setClaimError(error.message || "An error occurred while claiming bonus")
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Claim Your Signup Bonus!</DialogTitle>
          <DialogDescription>
            As a new user, you're eligible for a special signup bonus. Claim your 100 KAI now to start exploring our
            features!
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center my-4">
          <div className="relative h-24 w-24">
            <Image src="/kai.png" alt="KAI Token" fill className="object-contain" />
          </div>
        </div>
        {claimError && <p className="text-red-500 text-sm text-center">{claimError}</p>}
        {claimSuccess && (
          <div className="flex items-center justify-center gap-2 p-3 bg-green-100 text-green-800 rounded-md">
            <CheckCircle className="h-4 w-4" />
            <span>Bonus claimed successfully!</span>
          </div>
        )}
        <DialogFooter className="flex flex-col gap-2 mt-4">
          <Button
            className="w-full bg-primary text-primary-foreground"
            onClick={handleClaimBonus}
            disabled={isClaiming || claimSuccess}
          >
            {isClaiming ? "Claiming Bonus..." : claimSuccess ? "Bonus Claimed!" : "Claim Bonus"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isClaiming}>
            {claimSuccess ? "Close" : "Maybe Later"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

