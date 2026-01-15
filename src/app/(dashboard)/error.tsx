"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Sprout } from "lucide-react"
import Link from "next/link"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
              <Sprout className="h-10 w-10 text-red-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-red-500">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-2">Your garden needs attention</h2>
        <p className="text-muted-foreground mb-6">
          {error.message || "Something went wrong while loading this page. Let's try to fix it!"}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <Link href="/garden">
              <Sprout className="h-4 w-4 mr-2" />
              Back to Garden
            </Link>
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-muted-foreground mt-4">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
