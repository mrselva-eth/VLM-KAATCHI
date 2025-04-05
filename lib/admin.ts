/**
 * Helper functions for admin functionality
 */

// Fetch admin analytics data
export async function getAdminAnalytics() {
    try {
      // Get auth token
      const token = localStorage.getItem("kaatchi_auth_token")
      if (!token) {
        throw new Error("Not authenticated")
      }
  
      // Fetch analytics data
      const response = await fetch("/api/admin/analytics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
  
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch admin analytics")
      }
  
      return await response.json()
    } catch (error) {
      console.error("Error fetching admin analytics:", error)
      throw error
    }
  }
  
  // Check if current user is admin
  export async function checkIsAdmin() {
    try {
      const token = localStorage.getItem("kaatchi_auth_token")
      if (!token) return false
  
      const response = await fetch("/api/admin/check", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
  
      return response.ok
    } catch (error) {
      console.error("Error checking admin status:", error)
      return false
    }
  }
  
  