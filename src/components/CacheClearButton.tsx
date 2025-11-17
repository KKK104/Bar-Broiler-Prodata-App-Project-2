"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { CACHE_BUSTER } from "@/lib/cache-buster"

export function CacheClearButton() {
  const handleClearCache = () => {
    // Clear browser cache
    CACHE_BUSTER.clearCache()
    
    // Force reload the page
    window.location.reload()
  }

  return (
    <Button
      onClick={handleClearCache}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      title="Clear cache and refresh"
    >
      <RefreshCw className="w-4 h-4" />
      Refresh App
    </Button>
  )
}
