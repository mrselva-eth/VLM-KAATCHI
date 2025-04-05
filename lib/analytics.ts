/**
 * Client-side helper for tracking user analytics
 */

// Track analytics event for authenticated users
export async function trackAnalytics(
  action: "chat_query" | "search_text" | "search_image" | "search_multimodal",
  query?: string,
  metadata?: Record<string, any>,
): Promise<boolean> {
  try {
    // Get auth token
    const token = localStorage.getItem("kaatchi_auth_token")
    if (!token) {
      console.log("Analytics not tracked: User not authenticated")
      return false
    }

    // Send tracking event
    const response = await fetch("/api/analytics/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action,
        query,
        metadata,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to track analytics")
    }

    return true
  } catch (error) {
    console.error("Error tracking analytics:", error)
    return false
  }
}

// Get user analytics stats
export async function getUserStats(): Promise<any> {
  try {
    // Get auth token
    const token = localStorage.getItem("kaatchi_auth_token")
    if (!token) {
      console.log("Cannot get stats: User not authenticated")
      return null
    }

    // Get stats
    const response = await fetch("/api/analytics/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get analytics stats")
    }

    const data = await response.json()
    return data.stats
  } catch (error) {
    console.error("Error getting analytics stats:", error)
    return null
  }
}

