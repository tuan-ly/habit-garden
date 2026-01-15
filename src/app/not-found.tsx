import { Button } from "@/components/ui/button"
import { Sprout, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Sprout className="h-12 w-12 text-amber-500" />
          </div>
        </div>

        <h1 className="text-6xl font-bold text-muted-foreground mb-2">404</h1>
        <h2 className="text-2xl font-bold mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-6">
          Oops! This page seems to have wandered off. Let&apos;s get you back to your garden.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/garden">
              <Home className="h-4 w-4 mr-2" />
              Go to Garden
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
