/**
 * Helper functions for KAI credits system
 */

// Check if user has enough KAI balance for an action
export async function checkKaiBalance(action: "search" | "chat"): Promise<boolean> {
    try {
      // Get auth token
      const token = localStorage.getItem("kaatchi_auth_token")
      if (!token) {
        console.log("Cannot check KAI balance: User not authenticated")
        return false
      }
  
      // Get balance
      const response = await fetch("/api/user/kai/balance", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
  
      if (!response.ok) {
        throw new Error("Failed to get KAI balance")
      }
  
      const data = await response.json()
      const balance = data.balance || 0
  
      // Each action costs 1 KAI
      return balance >= 1
    } catch (error) {
      console.error("Error checking KAI balance:", error)
      return false
    }
  }
  
  // Deduct KAI for an action
  export async function deductKai(
    action: "search" | "chat",
    details?: string,
  ): Promise<{ success: boolean; balance?: number }> {
    try {
      // Get auth token
      const token = localStorage.getItem("kaatchi_auth_token")
      if (!token) {
        console.log("Cannot deduct KAI: User not authenticated")
        return { success: false }
      }
  
      // Call the deduct API
      const response = await fetch("/api/user/kai/deduct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          details,
        }),
      })
  
      if (!response.ok) {
        const data = await response.json()
        return {
          success: false,
          balance: data.balance,
        }
      }
  
      const data = await response.json()
      return {
        success: true,
        balance: data.balance,
      }
    } catch (error) {
      console.error("Error deducting KAI:", error)
      return { success: false }
    }
  }
  
  // Get user's KAI balance
  export async function getKaiBalance(): Promise<number> {
    try {
      // Get auth token
      const token = localStorage.getItem("kaatchi_auth_token")
      if (!token) {
        console.log("Cannot get KAI balance: User not authenticated")
        return 0
      }
  
      // Get balance
      const response = await fetch("/api/user/kai/balance", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
  
      if (!response.ok) {
        throw new Error("Failed to get KAI balance")
      }
  
      const data = await response.json()
      return data.balance || 0
    } catch (error) {
      console.error("Error getting KAI balance:", error)
      return 0
    }
  }
  
  // Claim signup bonus
  export async function claimSignupBonus(): Promise<{ success: boolean; balance?: number; message?: string }> {
    try {
      // Get auth token
      const token = localStorage.getItem("kaatchi_auth_token")
      if (!token) {
        return {
          success: false,
          message: "User not authenticated",
        }
      }
  
      // Call claim bonus API
      const response = await fetch("/api/user/kai/claim-bonus", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
  
      const data = await response.json()
  
      if (!response.ok) {
        return {
          success: false,
          message: data.message || "Failed to claim bonus",
        }
      }
  
      return {
        success: true,
        balance: data.balance,
        message: data.message,
      }
    } catch (error) {
      console.error("Error claiming signup bonus:", error)
      return {
        success: false,
        message: "An error occurred while claiming bonus",
      }
    }
  }
  
  